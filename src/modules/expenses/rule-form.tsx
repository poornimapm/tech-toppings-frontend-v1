import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import { failureCode, useCategories, type EntryKind } from '@/modules/expenses/api';
import {
  useSaveRule,
  type CadenceUnit,
  type Rule,
  type RuleInput,
  type RuleMode,
  type Suggestion,
} from '@/modules/expenses/bills-api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CHOICE } from '@/modules/expenses/choice';
import { NS } from '@/modules/expenses/i18n';

const KINDS = ['expense', 'income'] as const satisfies readonly EntryKind[];
const UNITS = ['day', 'week', 'month', 'year'] as const satisfies readonly CadenceUnit[];
const MODES = ['remind', 'auto_create'] as const satisfies readonly RuleMode[];
/** "Every 1 … 12" days, weeks, months or years. */
const EVERY = Array.from({ length: 12 }, (_, index) => index + 1);
/** Days before a due date to remind; a rule's own number is offered too. A new rule starts with
 *  the app's usual one (sent as nothing), so the server's setting decides it. */
const BEFORE = [0, 1, 2, 3, 7];

/** What a new rule starts from: a suggestion (confirmed with its signature), or nothing yet. */
export interface RuleDraft {
  suggestion?: Suggestion;
  mode: RuleMode;
}

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  kind: EntryKind;
  title: string;
  amount: string;
  category_id: string;
  unit: CadenceUnit;
  every: string;
  anchor: string;
  mode: RuleMode;
  /** Days before a due date; '' (new rules) is the app's usual. */
  before: string;
}

function valuesOf(rule: Rule | null, draft: RuleDraft, today: string): FormValues {
  const from = rule ?? draft.suggestion;
  return {
    kind: from?.template.kind ?? 'expense',
    title: from?.template.title ?? '',
    amount: from ? toInput(from.template.amount_minor, from.currency) : '',
    category_id: from?.template.category_id ?? '',
    unit: from?.cadence.unit ?? 'month',
    every: String(from?.cadence.every ?? 1),
    anchor: from?.cadence.anchor ?? today,
    mode: rule?.mode ?? draft.mode,
    before: rule ? String(rule.remind_days_before) : '',
  };
}

/** Add something that repeats (a bill, a salary, a subscription), confirm a suggestion, or
 *  change one, in a dialog. What the form doesn't show (where, tags ...) is kept as it was. */
export function RuleForm({
  rule,
  draft,
  onClose,
}: {
  rule: Rule | null;
  draft: RuleDraft;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const user = useSession((state) => state.user);
  const book = useCategoryBook();
  const loading = useCategories().isPending;
  const save = useSaveRule();
  const form = useForm<FormValues>({
    defaultValues: valuesOf(rule, draft, todayIn(user?.timezone)),
  });
  const [kind, unit, mode] = useWatch({ control: form.control, name: ['kind', 'unit', 'mode'] });
  const { errors } = form.formState;
  const currency = rule?.currency ?? draft.suggestion?.currency ?? user?.base_currency;
  // The category list mounts with its options, so the one filled in shows as chosen.
  if (!currency || loading) return null;

  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(displayDate(value));
  const before = [...new Set([...BEFORE, ...(rule ? [rule.remind_days_before] : [])])]
    .sort((a, b) => a - b)
    .map((count) => ({
      value: String(count),
      label: count ? t('bills.form.before', { count }) : t('bills.form.onTheDay'),
    }));
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const kept = (rule ?? draft.suggestion)?.template;
    const body: RuleInput = {
      template: {
        merchant: kept?.merchant ?? null,
        payment_mode: kept?.payment_mode ?? null,
        for_whom: kept?.for_whom ?? null,
        tags: kept?.tags ?? [],
        note: kept?.note ?? null,
        kind: values.kind,
        title: values.title.trim(),
        amount_minor: toMinor(values.amount, currency) ?? 0,
        category_id: values.category_id,
      },
      cadence: { unit: values.unit, every: Number(values.every), anchor: values.anchor },
      mode: values.mode,
      ...(values.before ? { remind_days_before: Number(values.before) } : {}),
      active: rule?.active ?? true,
      ...(draft.suggestion ? { signature: draft.suggestion.signature } : {}),
    };
    const saved = await save.mutateAsync({ body, id: rule?.id }).catch(() => null); // shown from save.error
    if (!saved) return;
    toast(t(rule ? 'bills.saved' : 'bills.added', { title: saved.template.title }), {
      tone: 'success',
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(rule ? 'bills.form.editTitle' : 'bills.form.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}

        <fieldset>
          <legend className="sr-only">{t('form.kind')}</legend>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('kind', {
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
          label={t('bills.form.title')}
          hint={t('bills.form.titleHint')}
          maxLength={120}
          autoComplete="off"
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('bills.form.titleError'),
          })}
        />
        <TextField
          label={t('bills.form.amount', { currency })}
          hint={mode === 'remind' ? t('bills.form.amountHint') : undefined}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => (toMinor(value, currency) ?? 0) > 0 || t('bills.form.amountError'),
          })}
        />
        <SelectField
          label={t('bills.form.category')}
          placeholder={t('bills.form.chooseCategory')}
          options={book.categories
            .filter(
              (item) =>
                item.kind === kind && (!item.archived || item.id === rule?.template.category_id),
            )
            .map((item) => ({ value: item.id, label: `${item.icon} ${book.nameOf(item)}` }))}
          error={errors.category_id?.message}
          {...form.register('category_id', {
            validate: (value) => value !== '' || t('bills.form.categoryError'),
          })}
        />

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('bills.form.unit')}</legend>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((value) => (
              <label key={value} className={CHOICE}>
                <input type="radio" value={value} className="sr-only" {...form.register('unit')} />
                {t(`bills.form.units.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label={t('bills.form.every')}
            options={EVERY.map((count) => ({
              value: String(count),
              label: t(`bills.every.${unit}`, { count }),
            }))}
            {...form.register('every')}
          />
          <TextField
            type="date"
            label={t('bills.form.anchor')}
            hint={rule ? t('bills.form.nextHint', { date: day(rule.next_run) }) : undefined}
            error={errors.anchor?.message}
            {...form.register('anchor', {
              validate: (value) => value !== '' || t('bills.form.anchorError'),
            })}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('bills.form.mode')}</legend>
          <div className="flex flex-wrap gap-2">
            {MODES.map((value) => (
              <label key={value} className={CHOICE}>
                <input type="radio" value={value} className="sr-only" {...form.register('mode')} />
                {t(`bills.form.modes.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {mode === 'remind' && (
          <SelectField
            label={t('bills.form.remind')}
            placeholder={rule ? undefined : t('bills.form.usual')}
            options={before}
            {...form.register('before')}
          />
        )}

        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t('bills.form.save')}
        </Button>
      </form>
    </Dialog>
  );
}
