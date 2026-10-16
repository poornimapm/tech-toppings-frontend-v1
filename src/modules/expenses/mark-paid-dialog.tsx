import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { useMarkPaid, type Rule } from '@/modules/expenses/bills-api';
import { NS } from '@/modules/expenses/i18n';

interface FormValues {
  amount: string;
  date: string;
}

/** Mark a bill's due date paid, in a dialog: the usual amount is filled in, today the day. The
 *  server adds its entry once per due date, so sending it twice is harmless. */
export function MarkPaidDialog({ rule, onClose }: { rule: Rule; onClose: () => void }) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const today = todayIn(useSession((state) => state.user?.timezone));
  const pay = useMarkPaid();
  const { currency, template } = rule;
  const form = useForm<FormValues>({
    defaultValues: { amount: toInput(template.amount_minor, currency), date: today },
  });
  const { errors } = form.formState;
  const failure = failureCode(pay.error);
  const due = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
    displayDate(rule.next_run),
  );

  const submit = form.handleSubmit(async (values) => {
    const done = await pay
      .mutateAsync({
        id: rule.id,
        due_on: rule.next_run,
        amount_minor: toMinor(values.amount, currency) ?? 0,
        date: values.date,
      })
      .catch(() => null); // shown from pay.error
    if (!done) return;
    const said = done.replayed ? 'bills.pay.already' : 'bills.pay.done';
    toast(t(said, { title: template.title }), { tone: 'success' });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('bills.pay.title', { title: template.title })}
      description={t('bills.pay.due', { date: due })}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <TextField
          label={t('bills.pay.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => (toMinor(value, currency) ?? 0) > 0 || t('bills.pay.amountError'),
          })}
        />
        <TextField
          type="date"
          label={t('bills.pay.date')}
          max={today}
          error={errors.date?.message}
          {...form.register('date', {
            validate: (value) => (value !== '' && value <= today) || t('bills.pay.dateError'),
          })}
        />
        <Button type="submit" className="w-full" disabled={pay.isPending}>
          {t('bills.pay.save')}
        </Button>
      </form>
    </Dialog>
  );
}
