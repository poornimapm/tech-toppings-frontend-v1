import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { toInput, toMinor } from '@/core/utils/money';
import { Button, Dialog, TextField, toast } from '@/design-system';
import { useEditTrip, useTrip } from '@/modules/travel/api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';

/** The trip's budget in its own currency, set, changed or emptied (no budget), as of the
 *  revision seen: changed elsewhere since, the latest is offered instead. */
export function BudgetForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  const { refetch } = useTrip(trip.id);
  const edit = useEditTrip();
  const sending = useRef(false);
  const { currency } = trip;
  const form = useForm({
    defaultValues: {
      amount: trip.budget_minor === null ? '' : toInput(trip.budget_minor, currency),
    },
  });
  const { errors, isDirty } = form.formState;

  const send = async ({ amount }: { amount: string }) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const budget_minor = amount.trim() ? toMinor(amount, currency) : null;
    const saved = await edit
      .mutateAsync({ id: trip.id, body: { budget_minor, revision_no: trip.revision_no } })
      .catch(() => null);
    if (!saved) {
      sending.current = false; // shown from edit.error, and can be tried again
      return;
    }
    toast(t('budgetForm.saved'), { tone: 'success' });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('budgetForm.title')}
    >
      <UnsavedGuard dirty={isDirty && !edit.isSuccess} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(send)(event)}
      >
        <Failure
          error={edit.error}
          onReload={() => {
            edit.reset();
            void refetch();
          }}
        />
        <TextField
          label={t('budgetForm.amount', { currency })}
          hint={t('budgetForm.hint')}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) =>
              value.trim() === '' || toMinor(value, currency) !== null || t('budgetForm.error'),
          })}
        />
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={edit.isPending || edit.isSuccess}
        >
          {t('budgetForm.save')}
        </Button>
      </form>
    </Dialog>
  );
}
