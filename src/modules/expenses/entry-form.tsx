import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { useSettled } from '@/core/utils/use-settled';
import { Alert, Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import {
  failureCode,
  PAYMENT_MODES,
  useFacets,
  useSaveEntry,
  useUnits,
  type Entry,
  type EntryInput,
  type EntryKind,
} from '@/modules/expenses/api';
import type { Draft } from '@/modules/expenses/capture';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CHOICE } from '@/modules/expenses/choice';
import { DuplicateNote } from '@/modules/expenses/duplicate-note';
import { useDuplicates } from '@/modules/expenses/duplicates';
import { NS } from '@/modules/expenses/i18n';
import { priceUnitFor, unitPrice, useUnitText } from '@/modules/expenses/units';

const MAX_TAGS = 10;
const KINDS = ['expense', 'income'] as const satisfies readonly EntryKind[];
/** How long typing pauses before a new entry is checked against saved ones. */
const SETTLE_MS = 400;

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  kind: EntryKind;
  amount: string;
  title: string;
  quantity: string;
  unit: string;
  category_id: string;
  date: string;
  time: string;
  merchant: string;
  payment_mode: string;
  for_whom: string;
  tags: string;
  note: string;
  link: string;
}

const DETAILS = ['time', 'merchant', 'payment_mode', 'for_whom', 'tags', 'note', 'link'] as const;

/** Start from the entry being edited, else from a draft, else empty and dated today. */
function valuesOf(entry: Entry | null, draft: Draft | undefined, today: string): FormValues {
  return {
    kind: entry?.kind ?? draft?.kind ?? 'expense',
    amount: entry ? toInput(entry.amount_minor, entry.currency) : (draft?.amount ?? ''),
    title: entry?.title ?? draft?.title ?? '',
    quantity: entry ? String(entry.quantity ?? '') : (draft?.quantity ?? ''),
    unit: entry ? (entry.unit ?? '') : (draft?.unit ?? ''),
    category_id: entry?.category_id ?? draft?.category_id ?? '',
    date: entry?.date ?? draft?.date ?? today,
    time: entry?.time?.slice(0, 5) ?? '',
    merchant: entry?.merchant ?? draft?.merchant ?? '',
    payment_mode: entry?.payment_mode ?? '',
    for_whom: entry?.for_whom ?? draft?.for_whom ?? '',
    tags: entry?.tags.join(', ') ?? '',
    note: entry?.note ?? '',
    link: entry?.attachments[0]?.url ?? '',
  };
}

/** "0.5", "0,5" or "2" as a number; `null` for anything that isn't a positive one. */
function quantityOf(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
}

function tagsOf(text: string): string[] {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function bodyOf(values: FormValues, currency: string, entry: Entry | null): EntryInput {
  // The form edits one link; any others the entry has (added elsewhere) are kept as they are.
  const [first, ...others] = entry?.attachments ?? [];
  const link = values.link ? [{ url: values.link, label: first?.label ?? null }] : [];
  return {
    kind: values.kind,
    title: values.title,
    amount_minor: toMinor(values.amount, currency) ?? 0,
    // How much was bought is about spending; and a quantity means nothing without its unit.
    ...(values.kind === 'expense' && values.unit && quantityOf(values.quantity)
      ? { quantity: quantityOf(values.quantity), unit: values.unit }
      : { quantity: null, unit: null }),
    category_id: values.category_id,
    date: values.date,
    time: values.time || null,
    merchant: values.merchant,
    payment_mode: PAYMENT_MODES.find((mode) => mode === values.payment_mode) ?? null,
    for_whom: values.for_whom,
    tags: tagsOf(values.tags),
    note: values.note,
    attachments: [...link, ...others],
  };
}

export interface EntryFormProps {
  /** The entry being edited, or `null` for a new one. */
  entry: Entry | null;
  /** A new entry starts from what was understood (the confirm card's "Edit"). */
  draft?: Draft;
  onClose: () => void;
  onSaved?: (entry: Entry) => void;
  /** The entry had changed elsewhere and the user asked for the latest. */
  onReload?: () => void;
}

/** Add or edit an entry, in a dialog: the essentials first, the rest under "More details". */
export function EntryForm({ entry, draft, onClose, onSaved, onReload }: EntryFormProps) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const listId = useId();
  const user = useSession((state) => state.user);
  const book = useCategoryBook();
  const facets = useFacets().data;
  const save = useSaveEntry();
  // One key for this form's whole life (a draft brings its own): saving again after a lost
  // reply can't add the entry twice.
  const [key] = useState(() => draft?.key ?? crypto.randomUUID());
  const form = useForm<FormValues>({
    defaultValues: valuesOf(entry, draft, todayIn(user?.timezone)),
  });
  const kind = useWatch({ control: form.control, name: 'kind' });
  const [amount, quantity, unit, title, date, merchant] = useWatch({
    control: form.control,
    name: ['amount', 'quantity', 'unit', 'title', 'date', 'merchant'],
  });
  const units = useUnits().data ?? [];
  const unitText = useUnitText();
  const { errors } = form.formState;
  const currency = entry?.currency ?? user?.base_currency;
  const minor = currency ? toMinor(amount, currency) : null;
  // Only a new entry is compared with saved ones, once it has a name, an amount and a day.
  const named = title.trim();
  const asked =
    !entry && named && minor && date
      ? [{ kind, title: named, amount_minor: minor, date, merchant: merchant.trim() || null }]
      : [];
  const settled = useSettled(asked, SETTLE_MS);
  // Not from the moment Save is pressed (isSubmitting comes on before anything is sent): asked
  // again then, the entry being saved would find itself.
  const saving = form.formState.isSubmitting || save.isSuccess;
  const [matches = []] = useDuplicates(saving ? [] : settled);
  if (!currency) return null;

  // An archived category is offered only to the entry already filed under it.
  const choices = book.categories.filter(
    (category) =>
      category.kind === kind && (!category.archived || category.id === entry?.category_id),
  );
  const failure = failureCode(save.error);
  const counted = quantityOf(quantity);
  const per = priceUnitFor(units, unit);
  const each = minor && counted && unit ? unitPrice(units, minor, counted, unit, per) : null;

  const submit = form.handleSubmit(async (values) => {
    const body = bodyOf(values, currency, entry);
    const saved = await save.mutateAsync(entry ? { body, editing: entry } : { body, key }).catch(
      () => null, // shown from save.error
    );
    if (!saved) return;
    toast(t(entry ? 'toast.saved' : 'toast.added', { title: saved.title }), { tone: 'success' });
    onSaved?.(saved);
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(entry ? 'form.editTitle' : 'form.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure === 'VERSION_CONFLICT' ? (
          <Alert tone="danger">
            <span className="flex flex-wrap items-center justify-between gap-3">
              {t('form.conflict')}
              <Button variant="secondary" onClick={onReload}>
                {t('form.reload')}
              </Button>
            </span>
          </Alert>
        ) : (
          failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>
        )}

        <fieldset>
          <legend className="sr-only">{t('form.kind')}</legend>
          <div className="flex gap-2">
            {KINDS.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('kind', {
                    // Categories belong to a kind, so the old choice no longer applies.
                    onChange: () => {
                      form.setValue('category_id', '');
                    },
                  })}
                />
                {t(`kind.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <TextField
          label={t('form.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          // The one thing every entry needs, so typing can start at once.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => (toMinor(value, currency) ?? 0) > 0 || t('form.amountError'),
          })}
        />
        <TextField
          label={t('form.title')}
          placeholder={t('form.titlePlaceholder')}
          maxLength={120}
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('form.titleError'),
          })}
        />

        {kind === 'expense' && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label={t('form.quantity')}
                inputMode="decimal"
                autoComplete="off"
                placeholder={t('form.quantityPlaceholder')}
                error={errors.quantity?.message}
                {...form.register('quantity', {
                  validate: (value, values) =>
                    value.trim() === ''
                      ? values.unit === '' || t('form.quantityError')
                      : quantityOf(value) !== null || t('form.quantityError'),
                })}
              />
              <SelectField
                label={t('form.unit')}
                placeholder={t('form.notSet')}
                options={units.map((item) => ({
                  value: item.code,
                  label: unitText.name(item.code),
                }))}
                error={errors.unit?.message}
                {...form.register('unit', {
                  validate: (value, values) =>
                    value !== '' || values.quantity.trim() === '' || t('form.unitError'),
                })}
              />
            </div>
            {each !== null && (
              <p className="mt-1 text-sm text-muted" aria-live="polite">
                {t('form.each', { price: unitText.perUnit(each, currency, per) })}
              </p>
            )}
          </div>
        )}

        <fieldset aria-describedby={errors.category_id ? `${listId}-category` : undefined}>
          <legend className="mb-1 text-sm font-medium">{t('form.category')}</legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((category) => (
              <label key={category.id} className={CHOICE}>
                <input
                  type="radio"
                  value={category.id}
                  className="sr-only"
                  {...form.register('category_id', { required: t('form.categoryError') })}
                />
                <span aria-hidden="true">{category.icon}</span>
                {book.nameOf(category)}
                {/* Chosen is said by a mark and weight as well as colour. */}
                <Check aria-hidden="true" className="hidden size-3.5 group-has-checked:block" />
              </label>
            ))}
          </div>
          {errors.category_id && (
            <p id={`${listId}-category`} className="mt-1 text-sm text-danger">
              {errors.category_id.message}
            </p>
          )}
        </fieldset>

        <TextField
          type="date"
          label={t('form.date')}
          error={errors.date?.message}
          {...form.register('date', { required: t('form.dateError') })}
        />
        <DuplicateNote matches={matches} />

        <details open={DETAILS.some((name) => form.getValues(name) !== '')}>
          <summary className="cursor-pointer text-sm font-medium text-primary">
            {t('form.more')}
          </summary>
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField type="time" label={t('form.time')} {...form.register('time')} />
              <SelectField
                label={t('form.paymentMode')}
                placeholder={t('form.notSet')}
                options={PAYMENT_MODES.map((mode) => ({
                  value: mode,
                  label: t(`paymentMode.${mode}`),
                }))}
                {...form.register('payment_mode')}
              />
            </div>
            <TextField
              label={t('form.merchant')}
              maxLength={80}
              list={`${listId}-merchants`}
              {...form.register('merchant')}
            />
            <TextField
              label={t('form.forWhom')}
              maxLength={60}
              list={`${listId}-people`}
              {...form.register('for_whom')}
            />
            <TextField
              label={t('form.tags')}
              hint={t('form.tagsHint')}
              list={`${listId}-tags`}
              error={errors.tags?.message}
              {...form.register('tags', {
                validate: (value) =>
                  tagsOf(value).length <= MAX_TAGS || t('form.tagsError', { max: MAX_TAGS }),
              })}
            />
            <TextField label={t('form.note')} maxLength={1000} {...form.register('note')} />
            <TextField
              type="url"
              label={t('form.link')}
              placeholder="https://"
              error={errors.link?.message}
              {...form.register('link', {
                validate: (value) =>
                  value === '' || /^https?:\/\/\S+\.\S+/.test(value) || t('form.linkError'),
              })}
            />
            {(
              [
                ['merchants', facets?.merchants],
                ['people', facets?.for_whom],
                ['tags', facets?.tags],
              ] as const
            ).map(([name, values]) => (
              <datalist key={name} id={`${listId}-${name}`}>
                {values?.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            ))}
          </div>
        </details>

        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t('form.save')}
        </Button>
      </form>
    </Dialog>
  );
}
