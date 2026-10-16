import { ChevronLeft, ChevronRight, Download, FileBarChart, Printer } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Button, EmptyState, LoadError, Skeleton, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { useSaveReportCsv } from '@/modules/expenses/export-csv';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';
import { PriceChange } from '@/modules/expenses/price-change';
import { shiftMonth, useMonthlyReport, type MonthlyReport } from '@/modules/expenses/reports-api';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * A month on one page, made to print: the browser's "Save as PDF" makes the PDF (D5), so Tamil
 * and Hindi are shaped right without fonts on the server. The same figures download as CSV.
 */
export function ReportPage() {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const [params, setParams] = useSearchParams();
  const thisMonth = todayIn(useSession((state) => state.user?.timezone)).slice(0, 7);
  const asked = params.get('month') ?? '';
  const month = MONTH.test(asked) && asked <= thisMonth ? asked : thisMonth;
  const report = useMonthlyReport(month);
  const saveCsv = useSaveReportCsv();
  const label = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    displayDate(`${month}-01`),
  );

  function go(delta: number) {
    setParams({ month: shiftMonth(month, delta) }, { replace: true });
  }

  return (
    <div className="space-y-6 print:space-y-4 print:text-black">
      <header className="space-y-3">
        <Link
          to={paths.overview}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline print:hidden"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t('report.back')}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('report.title', { month: label })}
            </h1>
            <p className="mt-1 text-muted print:hidden">{t('report.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="secondary"
              aria-label={t('report.previous')}
              onClick={() => {
                go(-1);
              }}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <Button
              variant="secondary"
              aria-label={t('report.next')}
              disabled={month >= thisMonth}
              onClick={() => {
                go(1);
              }}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.print();
              }}
            >
              <Printer aria-hidden="true" className="size-4" />
              {t('report.print')}
            </Button>
            <Button
              variant="secondary"
              disabled={saveCsv.isPending}
              onClick={() => {
                saveCsv.mutate(month, {
                  onSuccess: (name) => toast(t('report.downloaded', { name }), { tone: 'success' }),
                  onError: (error) =>
                    toast(tError(errorKey(failureCode(error) ?? 'UNKNOWN')), { tone: 'danger' }),
                });
              }}
            >
              <Download aria-hidden="true" className="size-4" />
              {t('report.csv')}
            </Button>
          </div>
        </div>
      </header>

      {report.isPending ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : report.isError ? (
        <LoadError onRetry={() => void report.refetch()}>{t('report.loadError')}</LoadError>
      ) : report.data.summary.count === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title={t('report.emptyTitle', { month: label })}
          body={t('report.emptyBody')}
        />
      ) : (
        <ReportBody report={report.data} />
      )}
    </div>
  );
}

function ReportBody({ report }: { report: MonthlyReport }) {
  const { t, i18n } = useTranslation(NS);
  const book = useCategoryBook();
  const { summary } = report;
  const money = (amount: number) => formatMoney(amount, summary.currency, i18n.language);
  const pct = (value: number) =>
    `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value)}%`;
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      displayDate(value),
    );
  const category = (id: string) => book.nameOf(book.find(id));
  const tiles = [
    ['spent', summary.spent_minor, summary.spent_change_pct],
    ['received', summary.received_minor, summary.received_change_pct],
    ['kept', summary.net_minor, null],
  ] as const;

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {tiles.map(([name, amount, change]) => (
          <div
            key={name}
            className="rounded-3xl border border-border bg-glass p-4 shadow-sm print:border-black/20 print:shadow-none"
          >
            <dt className="text-sm text-muted">{t(`report.${name}`)}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{money(amount)}</dd>
            <dd className="mt-1 text-sm text-muted">
              {name === 'kept'
                ? summary.savings_rate_pct !== null &&
                  t('report.savingsRate', { pct: pct(summary.savings_rate_pct) })
                : change !== null && <PriceChange pct={change} />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        {t('report.comparedWith', {
          from: day(summary.previous.start),
          to: day(summary.previous.end),
        })}
      </p>

      <ReportTable
        title={t('report.categories')}
        headings={[
          t('report.category'),
          t('report.amount'),
          t('report.share'),
          t('report.before'),
          t('report.change'),
        ]}
        rows={report.categories.map((item) => [
          category(item.category_id),
          money(item.amount_minor),
          pct(item.share_pct),
          money(item.previous_minor),
          <PriceChange key="change" pct={item.change_pct} />,
        ])}
      />
      {report.income.length > 0 && (
        <ReportTable
          title={t('report.income')}
          headings={[t('report.category'), t('report.amount'), t('report.share')]}
          rows={report.income.map((item) => [
            category(item.category_id),
            money(item.amount_minor),
            pct(item.share_pct),
          ])}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {report.merchants.length > 0 && (
          <ReportTable
            title={t('report.places')}
            headings={[t('report.place'), t('report.amount'), t('report.share')]}
            rows={report.merchants.map((item) => [
              item.merchant,
              money(item.amount_minor),
              pct(item.share_pct),
            ])}
          />
        )}
        {report.people.length > 0 && (
          <ReportTable
            title={t('report.people')}
            headings={[t('report.person'), t('report.amount'), t('report.share')]}
            rows={report.people.map((item) => [
              item.name ?? t('report.nobody'),
              money(item.amount_minor),
              pct(item.share_pct),
            ])}
          />
        )}
      </div>
      <ReportTable
        title={t('report.largest')}
        headings={[t('report.day'), t('report.what'), t('report.category'), t('report.amount')]}
        textColumns={3}
        rows={report.largest.map((entry) => [
          day(entry.date),
          entry.title,
          category(entry.category_id),
          money(entry.amount_minor),
        ])}
      />
    </>
  );
}

/** A titled table of the report, scrolling within itself on phones; never split across pages. */
function ReportTable({
  title,
  headings,
  rows,
  textColumns = 1,
}: {
  title: string;
  headings: string[];
  rows: ReactNode[][];
  /** Columns of words, first; the rest are figures, set right. */
  textColumns?: number;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="break-inside-avoid space-y-2">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-3xl border border-border print:overflow-visible print:border-black/20">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted print:bg-transparent">
            <tr>
              {headings.map((heading, index) => (
                <th
                  key={heading}
                  scope="col"
                  className={`px-3 py-2 font-medium ${index >= textColumns ? 'text-right' : ''}`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((cells, row) => (
              <tr key={row}>
                {cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`px-3 py-2 ${index >= textColumns ? 'text-right whitespace-nowrap tabular-nums' : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
