import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { todayIn } from '@/core/utils/dates';
import { formatMoney, toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { leftWhenTooMuch, useSettle, type Iou } from '@/modules/expenses/ious-api';
import { useLoanWords } from '@/modules/expenses/loan-words';

interface FormValues {
  amount: string;
  date: string;
  note: string;
}

/** Record money paid back on a loan, in a dialog: what is left is filled in, today the day. The
 *  form keeps one key however often it is sent, so a retry counts the payment once. */
export function SettleForm({
  iou,
  onClose,
  onSaved = (said) => toast(said, { tone: 'success' }),
}: {
  iou: Iou;
  onClose: () => void;
  /** Says it was saved: a toast, unless the dialog sits on another that hides toasts. */
  onSaved?: (said: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const today = todayIn(useSession((state) => state.user?.timezone));
  const [key] = useState(() => crypto.randomUUID());
  const settle = useSettle();
  const words = useLoanWords();
  const { currency, counterparty: person } = iou;
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const form = useForm<FormValues>({
    defaultValues: { amount: toInput(iou.outstanding_minor, currency), date: today, note: '' },
  });
  const { errors } = form.formState;
  const failure = failureCode(settle.error);
  const left = leftWhenTooMuch(settle.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await settle
      .mutateAsync({
        id: iou.id,
        key,
        amount_minor: toMinor(values.amount, currency) ?? 0,
        date: values.date,
        note: values.note.trim() || null,
      })
      .catch(() => null); // shown from settle.error
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
      title={t(`loans.payment.title.${iou.direction}`, { person })}
      description={t('loans.payment.left', {
        left: money(iou.outstanding_minor),
        amount: money(iou.amount_minor),
      })}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && (
          <Alert tone="danger">
            {left === null
              ? tError(errorKey(failure))
              : t('loans.payment.tooMuch', { amount: money(left) })}
          </Alert>
        )}
        <TextField
          label={t('loans.payment.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => {
              const amount = toMinor(value, currency) ?? 0;
              if (amount <= 0) return t('loans.payment.amountError');
              return (
                amount <= iou.outstanding_minor ||
                t('loans.payment.tooMuch', { amount: money(iou.outstanding_minor) })
              );
            },
          })}
        />
        <TextField
          type="date"
          label={t('loans.payment.date')}
          min={iou.date}
          max={today}
          error={errors.date?.message}
          {...form.register('date', {
            validate: (value) =>
              (value >= iou.date && value <= today) || t('loans.payment.dateError'),
          })}
        />
        <TextField
          label={t('loans.payment.note')}
          maxLength={1000}
          autoComplete="off"
          {...form.register('note')}
        />
        <Button type="submit" className="w-full" disabled={settle.isPending}>
          {t('loans.payment.save')}
        </Button>
      </form>
    </Dialog>
  );
}
