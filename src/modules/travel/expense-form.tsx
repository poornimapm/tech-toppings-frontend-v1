import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { toInput, toMinor } from '@/core/utils/money';
import { Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import {
  useAddExpense,
  useEditExpense,
  type Expense,
  type ExpenseInput,
  type ExpenseKind,
} from '@/modules/travel/budget-api';
import { CHOICE } from '@/modules/travel/choice';
import { useCurrencies } from '@/modules/travel/currencies';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useActivities } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { weekdayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

const KINDS: ExpenseKind[] = ['estimate', 'actual'];

/** Everything in the form is as typed; `bodyOf` turns it into what the API takes. */
interface ExpenseValues {
  kind: ExpenseKind;
  title: string;
  amount: string;
  currency: string;
  category: string;
  day: string;
  activity_id: string;
  paid_by: string;
  shared_with: string[];
}

function bodyOf(values: ExpenseValues): ExpenseInput {
  return {
    kind: values.kind,
    title: values.title.trim(),
    amount_minor: toMinor(values.amount, values.currency) ?? 0,
    currency: values.currency,
    category: values.category,
    day: values.day || null,
    activity_id: values.activity_id || null,
    paid_by: values.paid_by || null,
    shared_with: values.shared_with,
  };
}

/**
 * Add a cost, or edit one, in a dialog: an estimate or what was really spent, in any currency
 * (the budget converts it at its day's rate), filed under a category, for an activity if it is
 * one's, and who paid and who share it. A new one goes with one key for the form's life; an
 * edit, as of the revision opened.
 */
export function ExpenseForm({
  expense,
  onClose,
  onReload,
}: {
  /** The cost being edited, or null for a new one. */
  expense: Expense | null;
  onClose: () => void;
  onReload: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const words = useWords();
  const activities = useActivities(trip.id);
  const add = useAddExpense(trip.id);
  const edit = useEditExpense();
  const save = expense ? edit : add;
  const [key] = useState(() => crypto.randomUUID());
  const sending = useRef(false);
  const form = useForm<ExpenseValues>({
    defaultValues: {
      // Before the trip, most costs are estimates; once on, what was spent.
      kind: expense?.kind ?? (trip.phase === 'upcoming' ? 'estimate' : 'actual'),
      title: expense?.title ?? '',
      amount: expense ? toInput(expense.amount_minor, expense.currency) : '',
      currency: expense?.currency ?? trip.currency,
      category: expense?.category ?? options.expense_categories[0] ?? 'other',
      day: expense?.day ?? '',
      activity_id: expense?.activity_id ?? '',
      paid_by: expense?.paid_by ?? '',
      shared_with: expense?.shared_with ?? [],
    },
  });
  const { errors, isDirty } = form.formState;
  const currency = useWatch({ control: form.control, name: 'currency' });
  const currencies = useCurrencies(currency);
  const { travellers } = trip;

  const send = async (values: ExpenseValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const body = bodyOf(values);
    const saved = await (
      expense
        ? edit.mutateAsync({ id: expense.id, body: { ...body, revision_no: expense.revision_no } })
        : add.mutateAsync({ body, key })
    ).catch(() => null);
    if (!saved) {
      sending.current = false; // shown from save.error, and can be tried again
      return;
    }
    toast(t(expense ? 'expense.saved' : 'expense.added', { title: saved.title }), {
      tone: 'success',
    });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={expense ? t('expense.editTitle', { title: expense.title }) : t('expense.addTitle')}
    >
      <UnsavedGuard dirty={isDirty && !save.isSuccess} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(send)(event)}
      >
        <Failure
          error={save.error}
          onReload={() => {
            save.reset();
            onReload();
          }}
        />
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('expense.kind')}</legend>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((kind) => (
              <label key={kind} className={CHOICE}>
                <input type="radio" value={kind} className="sr-only" {...form.register('kind')} />
                {t(`budget.kinds.${kind}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label={t('expense.name')}
          maxLength={120}
          autoComplete="off"
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('expense.nameError'),
          })}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('expense.amount')}
            inputMode="decimal"
            autoComplete="off"
            error={errors.amount?.message}
            {...form.register('amount', {
              validate: (value, values) =>
                toMinor(value, values.currency) !== null || t('expense.amountError'),
            })}
          />
          <SelectField
            label={t('expense.currency')}
            options={currencies}
            {...form.register('currency', { deps: ['amount'] })}
          />
        </div>
        <SelectField
          label={t('expense.category')}
          options={options.expense_categories.map((category) => ({
            value: category,
            label: words.category(category),
          }))}
          {...form.register('category')}
        />
        <TextField
          type="date"
          label={t('expense.day')}
          hint={t('expense.dayHint')}
          {...form.register('day')}
        />
        <SelectField
          label={t('expense.activity')}
          options={[
            { value: '', label: t('expense.noActivity') },
            ...(activities.data ?? []).map((activity) => ({
              value: activity.id,
              label: `${activity.title} · ${weekdayOf(activity.day, i18n.language)}`,
            })),
          ]}
          {...form.register('activity_id')}
        />
        {travellers.length > 0 && (
          <SelectField
            label={t('expense.paidBy')}
            options={[
              { value: '', label: t('expense.nobody') },
              ...travellers.map((each) => ({ value: each.id, label: each.name })),
            ]}
            {...form.register('paid_by')}
          />
        )}
        {travellers.length > 1 && (
          <fieldset>
            <legend className="text-sm font-medium">{t('expense.sharedWith')}</legend>
            <p className="mb-2 text-sm text-muted">{t('expense.sharedHint')}</p>
            <div className="flex flex-wrap gap-2">
              {travellers.map((each) => (
                <label key={each.id} className={CHOICE}>
                  <input
                    type="checkbox"
                    value={each.id}
                    className="size-4 accent-[var(--tt-primary)]"
                    {...form.register('shared_with')}
                  />
                  {each.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={save.isPending || save.isSuccess}
        >
          {t('expense.save')}
        </Button>
      </form>
    </Dialog>
  );
}
