import { Ban, HandCoins } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney, toInput, toMinor } from '@/core/utils/money';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  LoadError,
  Skeleton,
  TextField,
  toast,
} from '@/design-system';
import {
  failureCode,
  useAddPayment,
  useAllWorkers,
  useOptions,
  usePayments,
  useReport,
  useVoidPayment,
  type Payment,
  type Project,
  type Worker,
} from '@/modules/labor/api';
import { CHOICE } from '@/modules/labor/choice';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import { NoProject } from '@/modules/labor/labor-layout';
import { rowButton, rowName } from '@/modules/labor/row-label';
import { WorkerPhoto } from '@/modules/labor/worker-photo';

/** What each worker earned (worked out from their days) and what they were paid (money that
 *  changed hands), kept apart, with what is still owed; and every payment, voided ones too. */
export function PaymentsPage() {
  const { t, i18n } = useTranslation(NS);
  const { projectId, project } = useLabor();
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const workers = useAllWorkers(projectId);
  // Only each worker's figures to date are read here (every day up to today), so the period
  // itself is just today.
  const report = useReport(projectId, { from: today, to: today, group: 'day' });
  const payments = usePayments(projectId);
  const voiding = useVoidPayment();
  const [paying, setPaying] = useState<Worker | null>(null);
  const [toVoid, setToVoid] = useState<Payment | null>(null);

  if (!projectId) return <NoProject />;
  if (!project) return <Skeleton className="h-48 rounded-3xl" />;
  const closed = project.status === 'closed';
  const money = (minor: number) => formatMoney(minor, project.currency, i18n.language);
  const byWorker = new Map(report.data?.workers.map((row) => [row.worker_id, row]));
  const names = new Map(workers.data?.map((worker) => [worker.id, worker.name]));

  return (
    <div className="space-y-6">
      {closed && <Alert tone="info">{t('project.closedNote')}</Alert>}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('payments.balances')}</h2>
        <p className="text-sm text-muted">{t('payments.balancesHint')}</p>
        {workers.isPending || report.isPending ? (
          <Skeleton className="h-40 rounded-3xl" />
        ) : report.isError && !report.data ? (
          <LoadError onRetry={() => void report.refetch()}>{t('payments.loadError')}</LoadError>
        ) : (
          <ul role="list" aria-label={t('payments.balances')} className="space-y-2">
            {(workers.data ?? []).map((worker) => {
              const row = byWorker.get(worker.id);
              const owed = row?.owed_to_date_minor ?? 0;
              return (
                <li
                  key={worker.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                >
                  <WorkerPhoto project={projectId} worker={worker} />
                  <div className="min-w-0 flex-1">
                    <p id={rowName(worker.id)} className="truncate font-semibold">
                      {worker.name}
                    </p>
                    <p className="text-sm text-muted">
                      {t('payments.earnedPaid', {
                        earned: money(row?.earned_to_date_minor ?? 0),
                        paid: money(row?.paid_to_date_minor ?? 0),
                      })}
                    </p>
                  </div>
                  <p className={owed > 0 ? 'font-bold' : 'text-muted'}>
                    {owed >= 0
                      ? t('payments.owed', { amount: money(owed) })
                      : t('payments.ahead', { amount: money(-owed) })}
                  </p>
                  {!closed && (
                    <Button
                      className="min-h-11"
                      {...rowButton(`labor-pay-${worker.id}`, rowName(worker.id))}
                      onClick={() => {
                        setPaying(worker);
                      }}
                    >
                      <HandCoins aria-hidden="true" className="size-4" />
                      {t('payments.pay')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('payments.history')}</h2>
        {payments.isPending ? (
          <Skeleton className="h-32 rounded-3xl" />
        ) : (payments.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t('payments.none')}</p>
        ) : (
          <ul
            role="list"
            aria-label={t('payments.history')}
            className="divide-y divide-border rounded-2xl border border-border bg-surface"
          >
            {(payments.data ?? []).map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p
                    id={rowName(payment.id)}
                    className={
                      payment.voided_at ? 'font-semibold text-muted line-through' : 'font-semibold'
                    }
                  >
                    {money(payment.amount_minor)} · {names.get(payment.worker_id) ?? ''}
                  </p>
                  <p className="text-sm text-muted">
                    {[
                      displayDate(payment.day).toLocaleDateString(i18n.language, {
                        dateStyle: 'medium',
                      }),
                      payment.method
                        ? t(`methods.${payment.method}`, { defaultValue: payment.method })
                        : null,
                      payment.reference,
                      payment.voided_at
                        ? t('payments.voidedBecause', { reason: payment.void_reason ?? '' })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {payment.voided_at ? (
                  <Badge icon={<Ban aria-hidden="true" className="size-3" />}>
                    {t('payments.voided')}
                  </Badge>
                ) : (
                  !closed && (
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      {...rowButton(`labor-void-${payment.id}`, rowName(payment.id))}
                      onClick={() => {
                        setToVoid(payment);
                      }}
                    >
                      {t('payments.void')}
                    </Button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {paying && (
        <PaymentForm
          project={project}
          worker={paying}
          owed={byWorker.get(paying.id)?.owed_to_date_minor ?? 0}
          onClose={() => {
            setPaying(null);
          }}
        />
      )}
      {toVoid && (
        <VoidForm
          payment={toVoid}
          amount={money(toVoid.amount_minor)}
          busy={voiding.isPending}
          onVoid={(reason) => {
            voiding.mutate(
              { id: toVoid.id, reason },
              {
                onSuccess: () => {
                  toast(t('payments.voidedToast'), { tone: 'success' });
                  setToVoid(null);
                },
              },
            );
          }}
          onClose={() => {
            setToVoid(null);
          }}
        />
      )}
    </div>
  );
}

function PaymentForm({
  project,
  worker,
  owed,
  onClose,
}: {
  project: Project;
  worker: Worker;
  owed: number;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const options = useOptions();
  const pay = useAddPayment(project.id);
  // One key for this payment however often Save is pressed: it is kept once.
  const [key] = useState(() => crypto.randomUUID());
  const form = useForm({
    defaultValues: {
      amount: owed > 0 ? toInput(owed, project.currency) : '',
      day: today,
      method: 'cash',
      reference: '',
      note: '',
    },
  });
  const { errors } = form.formState;
  const failure = failureCode(pay.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await pay
      .mutateAsync({
        key,
        body: {
          worker_id: worker.id,
          amount_minor: toMinor(values.amount, project.currency) ?? 0,
          day: values.day,
          method: (values.method || null) as never,
          reference: values.reference.trim() || null,
          note: values.note.trim() || null,
        },
      })
      .catch(() => null);
    if (!saved) return;
    toast(
      t('payments.paid', {
        amount: formatMoney(saved.amount_minor, project.currency, i18n.language),
        name: worker.name,
      }),
      { tone: 'success' },
    );
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('payments.payTitle', { name: worker.name })}
      description={
        owed > 0
          ? t('payments.owed', { amount: formatMoney(owed, project.currency, i18n.language) })
          : undefined
      }
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <TextField
          label={t('payments.amount', { currency: project.currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) =>
              (toMinor(value, project.currency) ?? 0) > 0 || t('payments.amountError'),
          })}
        />
        <TextField
          type="date"
          label={t('payments.day')}
          max={today}
          error={errors.day?.message}
          {...form.register('day', {
            validate: (value) => (value !== '' && value <= today) || t('payments.dayError'),
          })}
        />
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('payments.method')}</legend>
          <div className="flex flex-wrap gap-2">
            {(options.data?.methods ?? []).map((method) => (
              <label key={method} className={CHOICE}>
                <input
                  type="radio"
                  value={method}
                  className="sr-only"
                  {...form.register('method')}
                />
                {t(`methods.${method}`, { defaultValue: method })}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label={t('payments.reference')}
          maxLength={80}
          autoComplete="off"
          {...form.register('reference')}
        />
        <TextField
          label={t('payments.note')}
          maxLength={300}
          autoComplete="off"
          {...form.register('note')}
        />
        <Button type="submit" className="min-h-12 w-full text-base" disabled={pay.isPending}>
          {t('payments.save')}
        </Button>
      </form>
    </Dialog>
  );
}

function VoidForm({
  payment,
  amount,
  busy,
  onVoid,
  onClose,
}: {
  payment: Payment;
  amount: string;
  busy: boolean;
  onVoid: (reason: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const form = useForm({ defaultValues: { reason: '' } });
  const { errors } = form.formState;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('payments.voidTitle', { amount })}
      description={t('payments.voidBody')}
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) =>
          void form.handleSubmit((values) => {
            if (!busy) onVoid(values.reason.trim());
          })(event)
        }
      >
        <TextField
          label={t('payments.voidReason')}
          maxLength={300}
          autoComplete="off"
          error={errors.reason?.message}
          {...form.register('reason', {
            validate: (value) => value.trim() !== '' || t('payments.voidReasonError'),
          })}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('payments.keep')}
          </Button>
          <Button type="submit" aria-disabled={busy || undefined} data-payment={payment.id}>
            {t('payments.void')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
