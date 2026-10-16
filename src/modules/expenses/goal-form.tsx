import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { CHOICE } from '@/modules/expenses/choice';
import {
  useSaveGoal,
  type Goal,
  type GoalFunding,
  type GoalInput,
} from '@/modules/expenses/goals-api';
import { NS } from '@/modules/expenses/i18n';

const FUNDINGS = ['manual', 'net_savings'] as const satisfies readonly GoalFunding[];

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  name: string;
  target: string;
  /** '' for no date. */
  target_date: string;
  funding: GoalFunding;
  since: string;
}

function valuesOf(goal: Goal | null, today: string): FormValues {
  return {
    name: goal?.name ?? '',
    target: goal ? toInput(goal.target_minor, goal.currency) : '',
    target_date: goal?.target_date ?? '',
    funding: goal?.funding ?? 'manual',
    since: goal?.since ?? today,
  };
}

function bodyOf(values: FormValues, currency: string): GoalInput {
  return {
    name: values.name.trim(),
    target_minor: toMinor(values.target, currency) ?? 0,
    target_date: values.target_date || null,
    funding: values.funding,
    since: values.since,
  };
}

/** Add or change a goal, in a dialog. A new goal is sent with one key however often it is
 *  saved; an edit is sent with the revision it started from, and if the goal has moved on since
 *  (money added on another device), the user can reload it. */
export function GoalForm({
  goal,
  onClose,
  onReload,
}: {
  goal: Goal | null;
  onClose: () => void;
  /** The goal had changed elsewhere and the user asked for the latest. */
  onReload: () => void;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const user = useSession((state) => state.user);
  const today = todayIn(user?.timezone);
  const [key] = useState(() => crypto.randomUUID());
  const save = useSaveGoal();
  const form = useForm<FormValues>({ defaultValues: valuesOf(goal, today) });
  const funding = useWatch({ control: form.control, name: 'funding' });
  const { errors } = form.formState;
  const currency = goal?.currency ?? user?.base_currency;
  if (!currency) return null;
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({ body: bodyOf(values, currency), key, editing: goal ?? undefined })
      .catch(() => null); // shown from save.error
    if (!saved) return;
    toast(t(goal ? 'goals.saved' : 'goals.added', { name: saved.name }), { tone: 'success' });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(goal ? 'goals.form.editTitle' : 'goals.form.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure === 'VERSION_CONFLICT' ? (
          <Alert tone="danger">
            <span className="flex flex-wrap items-center justify-between gap-3">
              {t('goals.form.conflict')}
              <Button variant="secondary" onClick={onReload}>
                {t('goals.form.reload')}
              </Button>
            </span>
          </Alert>
        ) : (
          failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>
        )}

        <TextField
          label={t('goals.form.name')}
          hint={t('goals.form.nameHint')}
          maxLength={60}
          autoComplete="off"
          error={errors.name?.message}
          {...form.register('name', {
            validate: (value) => value.trim() !== '' || t('goals.form.nameError'),
          })}
        />
        <TextField
          label={t('goals.form.target', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.target?.message}
          {...form.register('target', {
            validate: (value) => (toMinor(value, currency) ?? 0) > 0 || t('goals.form.targetError'),
          })}
        />
        <TextField
          type="date"
          label={t('goals.form.date')}
          hint={t('goals.form.dateHint')}
          {...form.register('target_date')}
        />

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('goals.form.funding')}</legend>
          <div className="flex flex-wrap gap-2">
            {FUNDINGS.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('funding')}
                />
                {t(`goals.form.fundings.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {funding === 'net_savings' && (
          <TextField
            type="date"
            label={t('goals.form.since')}
            hint={t('goals.form.sinceHint')}
            error={errors.since?.message}
            {...form.register('since', {
              validate: (value) => value !== '' || t('goals.form.sinceError'),
            })}
          />
        )}

        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t('goals.form.save')}
        </Button>
      </form>
    </Dialog>
  );
}
