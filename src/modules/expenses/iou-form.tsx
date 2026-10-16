import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { formatMoney, toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { CHOICE } from '@/modules/expenses/choice';
import { NS } from '@/modules/expenses/i18n';
import {
  useIouSummary,
  useSaveIou,
  type Iou,
  type IouDirection,
  type IouInput,
} from '@/modules/expenses/ious-api';
import { useLoanWords } from '@/modules/expenses/loan-words';

const DIRECTIONS = ['lent', 'borrowed'] as const satisfies readonly IouDirection[];

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  direction: IouDirection;
  counterparty: string;
  amount: string;
  date: string;
  /** '' for none. */
  due_on: string;
  note: string;
}

function valuesOf(iou: Iou | null, person: string, today: string): FormValues {
  return {
    direction: iou?.direction ?? 'lent',
    counterparty: iou?.counterparty ?? person,
    amount: iou ? toInput(iou.amount_minor, iou.currency) : '',
    date: iou?.date ?? today,
    due_on: iou?.due_on ?? '',
    note: iou?.note ?? '',
  };
}

function bodyOf(values: FormValues, currency: string): IouInput {
  return {
    counterparty: values.counterparty.trim(),
    direction: values.direction,
    amount_minor: toMinor(values.amount, currency) ?? 0,
    date: values.date,
    due_on: values.due_on || null,
    note: values.note.trim() || null,
  };
}

/** Note a loan, or change one, in a dialog. A new loan is sent with one key however often it is
 *  saved; a change is sent with the revision it started from, and if the loan has moved on since
 *  (a payment on another device), the user can reload it. People already known are offered as
 *  the name is typed, so "Ravi" stays one person. */
export function IouForm({
  iou,
  person = '',
  onClose,
  onReload,
  onSaved = (said) => toast(said, { tone: 'success' }),
}: {
  iou: Iou | null;
  /** A new loan with someone already known: their name, filled in. */
  person?: string;
  onClose: () => void;
  /** The loan had changed elsewhere and the user asked for the latest. */
  onReload?: () => void;
  /** Says it was saved: a toast, unless the dialog sits on another that hides toasts. */
  onSaved?: (said: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const user = useSession((state) => state.user);
  const today = todayIn(user?.timezone);
  const [key] = useState(() => crypto.randomUUID());
  const peopleId = useId();
  const people = useIouSummary().data?.people ?? [];
  const save = useSaveIou();
  const words = useLoanWords();
  const form = useForm<FormValues>({ defaultValues: valuesOf(iou, person, today) });
  const { errors } = form.formState;
  const currency = iou?.currency ?? user?.base_currency;
  if (!currency) return null;
  const failure = failureCode(save.error);
  const paid = iou?.settled_minor ?? 0;

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({ body: bodyOf(values, currency), key, editing: iou ?? undefined })
      .catch(() => null); // shown from save.error
    if (!saved) return;
    onSaved(words.saved(saved));
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(iou ? 'loans.form.editTitle' : 'loans.form.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure === 'VERSION_CONFLICT' && onReload ? (
          <Alert tone="danger">
            <span className="flex flex-wrap items-center justify-between gap-3">
              {t('loans.form.conflict')}
              <Button variant="secondary" onClick={onReload}>
                {t('loans.form.reload')}
              </Button>
            </span>
          </Alert>
        ) : (
          failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>
        )}

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('loans.form.direction')}</legend>
          <div className="flex flex-wrap gap-2">
            {DIRECTIONS.map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('direction')}
                />
                {t(`loans.form.directions.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label={t('loans.form.person')}
          maxLength={60}
          autoComplete="off"
          list={peopleId}
          error={errors.counterparty?.message}
          {...form.register('counterparty', {
            validate: (value) => value.trim() !== '' || t('loans.form.personError'),
          })}
        />
        <datalist id={peopleId}>
          {people.map((known) => (
            <option key={known.key} value={known.name} />
          ))}
        </datalist>
        <TextField
          label={t('loans.form.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => {
              const amount = toMinor(value, currency) ?? 0;
              if (amount <= 0) return t('loans.form.amountError');
              return (
                amount >= paid ||
                t('loans.form.belowPaid', { amount: formatMoney(paid, currency, i18n.language) })
              );
            },
          })}
        />
        <TextField
          type="date"
          label={t('loans.form.date')}
          max={today}
          error={errors.date?.message}
          {...form.register('date', {
            validate: (value) => (value !== '' && value <= today) || t('loans.form.dateError'),
          })}
        />
        <TextField
          type="date"
          label={t('loans.form.due')}
          hint={t('loans.form.dueHint')}
          error={errors.due_on?.message}
          {...form.register('due_on', {
            validate: (value, values) =>
              value === '' || value >= values.date || t('loans.form.dueError'),
          })}
        />
        <TextField
          label={t('loans.form.note')}
          maxLength={1000}
          autoComplete="off"
          {...form.register('note')}
        />

        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t('loans.form.save')}
        </Button>
      </form>
    </Dialog>
  );
}
