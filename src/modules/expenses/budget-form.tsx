import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { addDays, todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import { failureCode, useFacets } from '@/modules/expenses/api';
import {
  useSaveBudget,
  type Budget,
  type BudgetInput,
  type BudgetPeriod,
  type BudgetScope,
} from '@/modules/expenses/budgets-api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CHOICE } from '@/modules/expenses/choice';
import { NS } from '@/modules/expenses/i18n';

const SCOPES = ['overall', 'category', 'tag'] as const satisfies readonly BudgetScope[];
const PERIODS = ['month', 'week', 'custom'] as const satisfies readonly BudgetPeriod[];
/** Shares of the limit to warn at. A new budget starts with the app's usual one (sent as
 *  nothing), so the server's setting decides it. */
const WARN_AT = ['0.5', '0.75', '0.9'];
/** A new trip starts this many days long. */
const TRIP_DAYS = 7;

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  name: string;
  scope: BudgetScope;
  category_id: string;
  tag: string;
  period: BudgetPeriod;
  start: string;
  end: string;
  limit: string;
  /** A share of the limit, '0' for "only when over"; '' (new budgets) is the app's usual. */
  warn: string;
}

function valuesOf(budget: Budget | null, today: string, name: string): FormValues {
  return {
    name: budget?.name ?? name,
    scope: budget?.scope ?? 'overall',
    category_id: budget?.category_id ?? '',
    tag: budget?.tag ?? '',
    period: budget?.period ?? 'month',
    start: budget?.start ?? today,
    end: budget?.end ?? addDays(today, TRIP_DAYS - 1),
    limit: budget ? toInput(budget.limit_minor, budget.currency) : '',
    warn: budget ? String(budget.alert_threshold) : '',
  };
}

function bodyOf(values: FormValues, currency: string): BudgetInput {
  const custom = values.period === 'custom';
  return {
    name: values.name.trim(),
    scope: values.scope,
    category_id: values.scope === 'category' ? values.category_id : null,
    tag: values.scope === 'tag' ? values.tag.trim() : null,
    period: values.period,
    start: custom ? values.start : null,
    end: custom ? values.end : null,
    limit_minor: toMinor(values.limit, currency) ?? 0,
    ...(values.warn ? { alert_threshold: Number(values.warn) } : {}),
  };
}

/** Add or change a budget, in a dialog. Its name follows what it counts until the user types
 *  one of their own. */
export function BudgetForm({ budget, onClose }: { budget: Budget | null; onClose: () => void }) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const listId = useId();
  const user = useSession((state) => state.user);
  const book = useCategoryBook();
  const tags = useFacets().data?.tags ?? [];
  const save = useSaveBudget();
  const form = useForm<FormValues>({
    defaultValues: valuesOf(budget, todayIn(user?.timezone), t('budgets.form.names.month')),
  });
  const [scope, period] = useWatch({ control: form.control, name: ['scope', 'period'] });
  const { errors } = form.formState;
  const currency = budget?.currency ?? user?.base_currency;
  if (!currency) return null;

  /** The name a new budget gets from what it counts, unless the user has typed their own. */
  function suggestName() {
    if (budget || form.getFieldState('name').isDirty) return;
    const values = form.getValues();
    const suggested =
      values.scope === 'category'
        ? values.category_id && book.nameOf(book.find(values.category_id))
        : values.scope === 'tag'
          ? values.tag.trim()
          : t(`budgets.form.names.${values.period}`);
    form.setValue('name', suggested);
  }

  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' });
  // A budget's own share is offered too, when it isn't one of the usual ones.
  const shares = [...new Set([...WARN_AT, ...(budget ? [String(budget.alert_threshold)] : [])])]
    .filter((value) => value !== '0')
    .sort((a, b) => Number(a) - Number(b))
    .map((value) => ({
      value,
      label: t('budgets.form.warnAt', { pct: percent.format(Number(value)) }),
    }));
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({ body: bodyOf(values, currency), id: budget?.id })
      .catch(() => null); // shown from save.error
    if (!saved) return;
    toast(t(budget ? 'budgets.saved' : 'budgets.added', { name: saved.name }), {
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
      title={t(budget ? 'budgets.form.editTitle' : 'budgets.form.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('budgets.form.scope')}</legend>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('scope', { onChange: suggestName })}
                />
                {t(`budgets.form.scopes.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>

        {scope === 'category' && (
          <SelectField
            label={t('budgets.form.category')}
            placeholder={t('budgets.form.chooseCategory')}
            options={book.categories
              .filter(
                (item) =>
                  item.kind === 'expense' && (!item.archived || item.id === budget?.category_id),
              )
              .map((item) => ({ value: item.id, label: `${item.icon} ${book.nameOf(item)}` }))}
            error={errors.category_id?.message}
            {...form.register('category_id', {
              onChange: suggestName,
              validate: (value, values) =>
                values.scope !== 'category' || value !== '' || t('budgets.form.categoryError'),
            })}
          />
        )}
        {scope === 'tag' && (
          <>
            <TextField
              label={t('budgets.form.tag')}
              hint={t('budgets.form.tagHint')}
              maxLength={30}
              autoComplete="off"
              list={`${listId}-tags`}
              error={errors.tag?.message}
              {...form.register('tag', {
                onChange: suggestName,
                validate: (value, values) =>
                  values.scope !== 'tag' || value.trim() !== '' || t('budgets.form.tagError'),
              })}
            />
            <datalist id={`${listId}-tags`}>
              {tags.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </>
        )}

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('budgets.form.period')}</legend>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('period', { onChange: suggestName })}
                />
                {t(`budgets.form.periods.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              type="date"
              label={t('budgets.form.from')}
              error={errors.start?.message}
              {...form.register('start', {
                validate: (value, values) =>
                  values.period !== 'custom' || value !== '' || t('budgets.form.datesError'),
              })}
            />
            <TextField
              type="date"
              label={t('budgets.form.to')}
              error={errors.end?.message}
              {...form.register('end', {
                validate: (value, values) =>
                  values.period !== 'custom' ||
                  (value === ''
                    ? t('budgets.form.datesError')
                    : value >= values.start || t('budgets.form.orderError')),
              })}
            />
          </div>
        )}

        <TextField
          label={t('budgets.form.limit', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.limit?.message}
          {...form.register('limit', {
            validate: (value) =>
              (toMinor(value, currency) ?? 0) > 0 || t('budgets.form.limitError'),
          })}
        />
        <TextField
          label={t('budgets.form.name')}
          maxLength={60}
          autoComplete="off"
          error={errors.name?.message}
          {...form.register('name', {
            validate: (value) => value.trim() !== '' || t('budgets.form.nameError'),
          })}
        />
        <SelectField
          label={t('budgets.form.warn')}
          placeholder={budget ? undefined : t('budgets.form.warnUsual')}
          options={[...shares, { value: '0', label: t('budgets.form.warnOff') }]}
          {...form.register('warn')}
        />

        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t('budgets.form.save')}
        </Button>
      </form>
    </Dialog>
  );
}
