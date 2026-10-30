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
  // What is owed is of every day up to the report's last one (payments made later aren't in it):
  // the day is said, and the total is the workers' own.
  const owedBy = t('reports.owedBy', { date: date(report.end) });
  const owed = report.workers.reduce((sum, row) => sum + row.owed_to_date_minor, 0);

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [t('reports.days'), String(report.total.days)],
          [t('reports.earned'), money(report.total.earned_minor)],
          [t('reports.paid'), money(report.total.paid_minor)],
          [owedBy, money(owed)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-surface p-3 print:border-black/20"
          >
            <dt className="text-xs text-muted">{label}</dt>
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
            header: owedBy,
            cell: (row) => money(row.owed_to_date_minor),
            className: number,
          },
        ]}
        empty={t('reports.empty')}
      />
    </>
  );
}
