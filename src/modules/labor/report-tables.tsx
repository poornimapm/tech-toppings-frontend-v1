import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Table } from '@/design-system';
import type { Report } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';

/** A report's figures: the totals, then by day, week or month, then by worker with what each is
 *  owed to the period's end. The owner's Reports page and the admin's view of a project. */
export function ReportTables({ report, currency }: { report: Report; currency: string }) {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const date = (day: string) =>
    displayDate(day).toLocaleDateString(i18n.language, { dateStyle: 'medium' });
  const number = 'text-right tabular-nums';

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['reports.days', String(report.total.days)],
            ['reports.earned', money(report.total.earned_minor)],
            ['reports.paid', money(report.total.paid_minor)],
            ['reports.owed', money(report.total.owed_minor)],
          ] as const
        ).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-surface p-3 print:border-black/20"
          >
            <dt className="text-xs text-muted">{t(key)}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <Table
        caption={t('reports.periods')}
        rows={report.periods}
        rowKey={(row) => row.start}
        columns={[
          {
            key: 'start',
            header: t(`reports.groups.${report.grouping}`, { defaultValue: report.grouping }),
            cell: (row) => date(row.start),
          },
          { key: 'full', header: t('mark.full'), cell: (row) => row.full, className: number },
          { key: 'half', header: t('mark.half'), cell: (row) => row.half, className: number },
          {
            key: 'absent',
            header: t('mark.absent'),
            cell: (row) => row.absent,
            className: number,
          },
          {
            key: 'earned',
            header: t('reports.earned'),
            cell: (row) => money(row.earned_minor),
            className: number,
          },
          {
            key: 'paid',
            header: t('reports.paid'),
            cell: (row) => money(row.paid_minor),
            className: number,
          },
        ]}
        empty={t('reports.empty')}
      />
      <Table
        caption={t('reports.workers')}
        rows={report.workers}
        rowKey={(row) => row.worker_id}
        columns={[
          {
            key: 'name',
            header: t('reports.worker'),
            cell: (row) => `${row.name} (${row.code})`,
          },
          { key: 'days', header: t('reports.days'), cell: (row) => row.days, className: number },
          {
            key: 'earned',
            header: t('reports.earned'),
            cell: (row) => money(row.earned_minor),
            className: number,
          },
          {
            key: 'paid',
            header: t('reports.paid'),
            cell: (row) => money(row.paid_minor),
            className: number,
          },
          {
            key: 'owed',
            header: t('reports.owedToDate'),
            cell: (row) => money(row.owed_to_date_minor),
            className: number,
          },
        ]}
        empty={t('reports.empty')}
      />
    </>
  );
}
