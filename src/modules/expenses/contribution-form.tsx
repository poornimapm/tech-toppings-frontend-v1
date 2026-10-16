import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/core/api/api-error';
import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { formatMoney, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { CHOICE } from '@/modules/expenses/choice';
import type { MoneyMode } from '@/modules/expenses/goal-card';
import { useContribute, type Goal } from '@/modules/expenses/goals-api';
import { NS } from '@/modules/expenses/i18n';

const MODES = ['add', 'out'] as const satisfies readonly MoneyMode[];

interface FormValues {
  mode: MoneyMode;
  amount: string;
  date: string;
  note: string;
}

/** What the server says is saved, when it refused because more was taken out than that (it
 *  can be less than this page shows: money taken out on another device). */
function savedWhenTooMuch(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'EXPENSE_CONTRIBUTION_INVALID') return null;
  const details = error.details as { reason?: string; saved_minor?: number } | null;
  return details?.reason === 'below_zero' && typeof details.saved_minor === 'number'
    ? details.saved_minor
    : null;
}

/** Add money to a goal, or take some out, in a dialog. The form keeps one key however often
 *  it is sent, so a retry never counts the money twice. */
export function ContributionForm({
  goal,
  mode,
  onClose,
}: {
  goal: Goal;
  mode: MoneyMode;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const today = todayIn(useSession((state) => state.user?.timezone));
  const [key] = useState(() => crypto.randomUUID());
  const contribute = useContribute();
  const form = useForm<FormValues>({ defaultValues: { mode, amount: '', date: today, note: '' } });
  const chosen = useWatch({ control: form.control, name: 'mode' });
  const { errors } = form.formState;
  const { currency, name } = goal;
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const saved = money(goal.saved_minor);
  const failure = failureCode(contribute.error);
  const most = savedWhenTooMuch(contribute.error);

  const submit = form.handleSubmit(async (values) => {
    const amount = toMinor(values.amount, currency) ?? 0;
    const done = await contribute
      .mutateAsync({
        id: goal.id,
        key,
        amount_minor: values.mode === 'out' ? -amount : amount,
        date: values.date,
        note: values.note.trim() || null,
      })
      .catch(() => null); // shown from contribute.error
    if (!done) return;
    // A replay holds what the first send did, which may not be what the form says now.
    const said = done.replayed
      ? t('goals.money.already', { name, amount: money(done.data.saved_minor) })
      : t(values.mode === 'out' ? 'goals.money.tookOut' : 'goals.money.added', {
          amount: money(amount),
          name,
        });
    toast(said, { tone: 'success' });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('goals.money.title', { name })}
      description={t('goals.money.saved', { amount: saved })}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && (
          <Alert tone="danger">
            {most === null
              ? tError(errorKey(failure))
              : t('goals.money.tooMuch', { amount: money(most) })}
          </Alert>
        )}

        <fieldset>
          <legend className="sr-only">{t('goals.money.mode')}</legend>
          <div className="flex flex-wrap gap-2">
            {MODES.map((value) => (
              <label key={value} className={CHOICE}>
                <input type="radio" value={value} className="sr-only" {...form.register('mode')} />
                {t(`goals.money.modes.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <TextField
          label={t('goals.money.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value, values) => {
              const amount = toMinor(value, currency) ?? 0;
              if (amount <= 0) return t('goals.money.amountError');
              return (
                values.mode === 'add' ||
                amount <= goal.saved_minor ||
                t('goals.money.tooMuch', { amount: saved })
              );
            },
          })}
        />
        <TextField
          type="date"
          label={t('goals.money.date')}
          max={today}
          error={errors.date?.message}
          {...form.register('date', {
            validate: (value) => (value !== '' && value <= today) || t('goals.money.dateError'),
          })}
        />
        <TextField
          label={t('goals.money.note')}
          maxLength={1000}
          autoComplete="off"
          {...form.register('note')}
        />

        <Button type="submit" className="w-full" disabled={contribute.isPending}>
          {t(chosen === 'out' ? 'goals.money.saveOut' : 'goals.money.saveAdd')}
        </Button>
      </form>
    </Dialog>
  );
}
