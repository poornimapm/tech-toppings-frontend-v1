import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { todayIn } from '@/core/utils/dates';
import { toMinor } from '@/core/utils/money';
import { Button, Dialog, TextField } from '@/design-system';
import { CHOICE } from '@/modules/expenses/choice';
import { NS } from '@/modules/expenses/i18n';
import {
  kindOf,
  LOAN_KINDS,
  type IouDraft,
  type LoanAction,
  type LoanKind,
} from '@/modules/expenses/iou-capture';
import type { IouDirection } from '@/modules/expenses/ious-api';

interface FormValues {
  kind: LoanKind;
  counterparty: string;
  amount: string;
  date: string;
  due_on: string;
}

/**
 * Check a loan draft in a dialog: what happened, who, how much and when. "Done" puts it back on
 * the card as checked; saving it is still the card's Save.
 */
export function LoanDraftForm({
  loan,
  currency,
  onClose,
  onDone,
}: {
  loan: IouDraft;
  currency: string;
  onClose: () => void;
  onDone: (loan: IouDraft) => void;
}) {
  const { t } = useTranslation(NS);
  const today = todayIn(useSession((state) => state.user?.timezone));
  const form = useForm<FormValues>({
    defaultValues: {
      kind: kindOf(loan),
      counterparty: loan.counterparty,
      amount: loan.amount,
      date: loan.date,
      due_on: loan.due_on,
    },
  });
  const isNew = useWatch({ control: form.control, name: 'kind' }).startsWith('new');
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) => {
    const [action, direction] = values.kind.split('_') as [LoanAction, IouDirection];
    const counterparty = values.counterparty.trim();
    // The loan the assistant chose fits only while it is the same person and the same way round.
    const same = kindOf(loan) === values.kind && counterparty === loan.counterparty.trim();
    onDone({
      ...loan,
      action,
      direction,
      counterparty,
      amount: values.amount.trim(),
      date: values.date,
      due_on: action === 'new' ? values.due_on : '',
      iou_id: same ? loan.iou_id : '',
      uncertain: [],
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('capture.loan.form.title')}
      description={t('capture.draftsHint')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('capture.loan.form.kind')}</legend>
          <div className="flex flex-wrap gap-2">
            {LOAN_KINDS.map((value) => (
              <label key={value} className={CHOICE}>
                <input type="radio" value={value} className="sr-only" {...form.register('kind')} />
                {t(`capture.loan.kind.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label={t('capture.loan.form.person')}
          maxLength={60}
          autoComplete="off"
          error={errors.counterparty?.message}
          {...form.register('counterparty', {
            validate: (value) => value.trim() !== '' || t('capture.loan.form.personError'),
          })}
        />
        <TextField
          label={t('capture.loan.form.amount', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) =>
              (toMinor(value, currency) ?? 0) > 0 || t('capture.loan.form.amountError'),
          })}
        />
        <TextField
          type="date"
          label={t('capture.loan.form.date')}
          max={today}
          error={errors.date?.message}
          {...form.register('date', {
            validate: (value) =>
              (value !== '' && value <= today) || t('capture.loan.form.dateError'),
          })}
        />
        {isNew && (
          <TextField
            type="date"
            label={t('capture.loan.form.due')}
            error={errors.due_on?.message}
            {...form.register('due_on', {
              validate: (value, values) =>
                value === '' || value >= values.date || t('capture.loan.form.dueError'),
            })}
          />
        )}
        <Button type="submit" className="w-full">
          {t('capture.loan.form.done')}
        </Button>
      </form>
    </Dialog>
  );
}
