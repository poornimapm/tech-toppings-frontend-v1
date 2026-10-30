import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { addDays, displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Badge, Dialog, LoadError, Skeleton } from '@/design-system';
import { useWorkerHistory, type Project, type Worker } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';

/** How far back a worker's history looks. */
const DAYS_BACK = 30;

/** A worker's last month: each day marked and what it earned, each payment, and the totals. */
export function WorkerHistory({
  project,
  worker,
  onClose,
}: {
  project: Project;
  worker: Worker;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const timezone = useSession((state) => state.user?.timezone);
  const to = todayIn(timezone);
  const history = useWorkerHistory(project.id, worker.id, addDays(to, 1 - DAYS_BACK), to);
  const money = (minor: number) => formatMoney(minor, project.currency, i18n.language);
  const date = (day: string) =>
    displayDate(day).toLocaleDateString(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('history.title', { name: worker.name })}
      description={t('history.period', { count: DAYS_BACK })}
    >
      {history.isPending ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : history.isError ? (
        <LoadError onRetry={() => void history.refetch()}>{t('history.loadError')}</LoadError>
      ) : (
        <div className="space-y-4">
          <p className="font-semibold">
            {t('payments.earnedPaid', {
              earned: money(history.data.earned_minor),
              paid: money(history.data.paid_minor),
            })}
          </p>
          <section className="space-y-1">
            <h3 className="text-sm font-medium text-muted">{t('history.days')}</h3>
            {history.data.days.length === 0 ? (
              <p className="text-sm">{t('history.noDays')}</p>
            ) : (
              <ul role="list" className="divide-y divide-border rounded-2xl border border-border">
                {history.data.days.map((mark) => (
                  <li key={mark.day} className="flex justify-between gap-3 p-2 text-sm">
                    <span>{date(mark.day)}</span>
                    <span>{t(`mark.${mark.status}`)}</span>
                    <span className="text-muted">
                      {t('workers.perDay', { amount: money(mark.rate_minor) })}
                    </span>
                    <span className="tabular-nums">{money(mark.amount_minor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-1">
            <h3 className="text-sm font-medium text-muted">{t('payments.history')}</h3>
            {history.data.payments.length === 0 ? (
              <p className="text-sm">{t('payments.none')}</p>
            ) : (
              <ul role="list" className="divide-y divide-border rounded-2xl border border-border">
                {history.data.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 p-2 text-sm"
                  >
                    <span>{date(payment.day)}</span>
                    {payment.voided_at && <Badge>{t('payments.voided')}</Badge>}
                    <span
                      className={
                        payment.voided_at ? 'text-muted tabular-nums line-through' : 'tabular-nums'
                      }
                    >
                      {money(payment.amount_minor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}
