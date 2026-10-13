import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import {
  failureCode,
  PAYMENT_MODES,
  useFacets,
  useSaveEntry,
  type Entry,
  type EntryInput,
  type EntryKind,
} from '@/modules/expenses/api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { NS } from '@/modules/expenses/i18n';

const MAX_TAGS = 10;
const KINDS = ['expense', 'income'] as const satisfies readonly EntryKind[];

/** A choice drawn as a pill; the radio inside keeps the keyboard and screen-reader behaviour. */
const CHOICE =
  'group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm ' +
  'has-checked:border-primary has-checked:bg-primary/10 has-checked:font-semibold ' +
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--tt-focus)]';

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  kind: EntryKind;
  amount: string;
  title: string;
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

function valuesOf(entry: Entry | null, today: string): FormValues {
  return {
    kind: entry?.kind ?? 'expense',
    amount: entry ? toInput(entry.amount_minor, entry.currency) : '',
    title: entry?.title ?? '',
    category_id: entry?.category_id ?? '',
    date: entry?.date ?? today,
    time: entry?.time?.slice(0, 5) ?? '',
    merchant: entry?.merchant ?? '',
    payment_mode: entry?.payment_mode ?? '',
    for_whom: entry?.for_whom ?? '',
    tags: entry?.tags.join(', ') ?? '',
    note: entry?.note ?? '',
    link: entry?.attachments[0]?.url ?? '',
  };
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
  onClose: () => void;
  /** The entry had changed elsewhere and the user asked for the latest. */
  onReload?: () => void;
}

/** Add or edit an entry, in a dialog: the essentials first, the rest under "More details". */
export function EntryForm({ entry, onClose, onReload }: EntryFormProps) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const listId = useId();
  const user = useSession((state) => state.user);
  const book = useCategoryBook();
  const facets = useFacets().data;
  const save = useSaveEntry();
  // One key for this form's whole life: saving again after a lost reply can't add it twice.
  const [key] = useState(() => crypto.randomUUID());
  const form = useForm<FormValues>({ defaultValues: valuesOf(entry, todayIn(user?.timezone)) });
  const kind = useWatch({ control: form.control, name: 'kind' });
  const { errors } = form.formState;
  const currency = entry?.currency ?? user?.base_currency;
  if (!currency) return null;

  // An archived category is offered only to the entry already filed under it.
  const choices = book.categories.filter(
    (category) =>
      category.kind === kind && (!category.archived || category.id === entry?.category_id),
  );
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const body = bodyOf(values, currency, entry);
    const saved = await save.mutateAsync(entry ? { body, editing: entry } : { body, key }).catch(
      () => null, // shown from save.error
    );
    if (!saved) return;
    toast(t(entry ? 'toast.saved' : 'toast.added', { title: saved.title }), { tone: 'success' });
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
