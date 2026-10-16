import type { UseQueryResult } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney, minorDigits } from '@/core/utils/money';
import { FilterChips, LoadError, Meter, Skeleton } from '@/design-system';
import { useAnalytics, type AnalyticsOf } from '@/modules/expenses/analytics';
import { BarList } from '@/modules/expenses/bar-list';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { ColumnChart } from '@/modules/expenses/column-chart';
import { Heatmap } from '@/modules/expenses/heatmap';
import { NS } from '@/modules/expenses/i18n';
import { InsightCard } from '@/modules/expenses/insight-card';
import { paths } from '@/modules/expenses/paths';
import { daysOf, type Period } from '@/modules/expenses/periods';
import { PriceChange } from '@/modules/expenses/price-change';
import { RunningChart } from '@/modules/expenses/running-chart';
import { SectionTabs } from '@/modules/expenses/section-tabs';

/** The spans the overview offers (all time has no "before" to compare with). */
const SPANS = ['thisMonth', 'lastMonth', 'last90'] as const satisfies readonly Period[];
const CARD = 'rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl';

/** A titled card that waits for its figures, says when they couldn't load, and when there
 *  is nothing to show. */
function Panel<T>({
  title,
  query,
  empty,
  children,
  className = '',
}: {
  title: string;
  query: UseQueryResult<T>;
  empty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
  className?: string;
}) {
  const { t } = useTranslation(NS);
  const id = `panel-${title.replace(/\W+/g, '-')}`;
  return (
    // min-w-0: in a grid, a chart may not widen its cell (it measures the cell to draw).
    <section aria-labelledby={id} className={`min-w-0 ${CARD} ${className}`}>
      <h2 id={id} className="mb-3 text-lg font-semibold">
        {title}
      </h2>
      {query.isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : query.isError ? (
        <LoadError onRetry={() => void query.refetch()}>{t('overview.loadError')}</LoadError>
      ) : empty?.(query.data) ? (
        <p className="text-muted">{t('overview.nothing')}</p>
      ) : (
        children(query.data)
      )}
    </section>
  );
}

function Figures({ summary }: { summary: AnalyticsOf<'summary'> }) {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number) => formatMoney(minor, summary.currency, i18n.language);
  const tiles: ['spent' | 'received' | 'net' | 'kept', string, ReactNode][] = [
    ['spent', money(summary.spent_minor), <PriceChange key="c" pct={summary.spent_change_pct} />],
    ['received', money(summary.received_minor), null],
    ['net', money(summary.net_minor), null],
    [
      'kept',
      summary.savings_rate_pct === null ? '—' : `${String(summary.savings_rate_pct)}%`,
      null,
    ],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(([name, value, extra]) => (
        <div key={name} className={CARD}>
          <dt className="text-sm text-muted">{t(`overview.figures.${name}`)}</dt>
          <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</dd>
          {extra && <dd className="mt-2">{extra}</dd>}
        </div>
      ))}
    </dl>
  );
}

function Forecast({ forecast }: { forecast: AnalyticsOf<'forecast'> }) {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number) => formatMoney(minor, forecast.currency, i18n.language);
  // An estimate in whole units: "₹3,635", not "₹3,635.29".
  const unit = 10 ** minorDigits(forecast.currency);
  const estimate = (minor: number) => money(Math.round(minor / unit) * unit);
  const end = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(
    displayDate(forecast.end),
  );
  const soFar = t('overview.forecast.soFar', { amount: money(forecast.spent_minor) });
  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold tracking-tight tabular-nums">
        {t('overview.forecast.heading', { amount: estimate(forecast.projected_minor), end })}
      </p>
      <Meter
        label={t('overview.forecast.title')}
        valueText={soFar}
        value={forecast.spent_minor}
        max={forecast.projected_minor}
      />
      <p className="text-sm text-muted">
        {[
          soFar,
          // A band only when the weeks differ: "between ₹2,285 and ₹2,285" says nothing.
          estimate(forecast.low_minor) !== estimate(forecast.high_minor) &&
            t('overview.forecast.band', {
              low: estimate(forecast.low_minor),
              high: estimate(forecast.high_minor),
            }),
          t('overview.forecast.previous', { amount: money(forecast.previous_month_minor) }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </div>
  );
}

/** The module's dashboard: how the period went, where it went, and where it is heading. Every
 *  chart opens the entries behind what was clicked, with the same total. */
export function OverviewPage() {
  const { t, i18n } = useTranslation(NS);
  const user = useSession((state) => state.user);
  const book = useCategoryBook();
  const [params, setParams] = useSearchParams();
  const span = SPANS.find((value) => value === params.get('period')) ?? SPANS[0];
  const today = todayIn(user?.timezone);
  const range = daysOf(span, today);
  const expense = { show: 'expense', from: range.from, to: range.to } as const;
  const summary = useAnalytics('summary', range);
  const daily = useAnalytics('daily', range);
  const running = useAnalytics('cumulative', range);
  const forecast = useAnalytics('forecast', {});
  const categories = useAnalytics('by-category', range);
  const people = useAnalytics('by-person', range);
  const places = useAnalytics('top-merchants', range);
  const products = useAnalytics('top-products', range);
  const heat = useAnalytics('weekday-heatmap', range);
  const net = useAnalytics('net', {});
  const unusual = useAnalytics('anomalies', range);
  const current = span === 'thisMonth';
  const language = i18n.language;
  const day = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });
  const month = new Intl.DateTimeFormat(language, { month: 'short', year: 'numeric' });
  const share = (pct: number, count: number) =>
    `${String(pct)}% · ${t('overview.entries', { count })}`;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('overview.title')}</h1>
          <p className="mt-1 text-muted">{t('overview.subtitle')}</p>
        </div>
        <SectionTabs />
        <FilterChips
          label={t('filters.period')}
          value={span}
          chips={SPANS.map((value) => ({ value, label: t(`filters.${value}`) }))}
          onChange={(value) => {
            setParams(value === SPANS[0] ? {} : { period: value }, { replace: true });
          }}
        />
      </header>

      <InsightCard date={range.to ?? today} />

      {summary.data ? (
        <Figures summary={summary.data} />
      ) : summary.isError ? (
        <LoadError onRetry={() => void summary.refetch()}>{t('overview.loadError')}</LoadError>
      ) : (
        <Skeleton className="h-28 rounded-3xl" />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t('overview.daily')}
          query={daily}
          empty={(data) => data.points.every((point) => point.amount_minor === 0)}
        >
          {(data) => (
            <ColumnChart
              name={t('overview.daily')}
              currency={data.currency}
              columns={data.points.map((point) => ({
                key: point.date,
                label: day.format(displayDate(point.date)),
                value: point.amount_minor,
                to: paths.list({ show: 'expense', from: point.date, to: point.date }),
              }))}
            />
          )}
        </Panel>
        <Panel title={t('overview.running')} query={running}>
          {(data) => (
            <RunningChart
              name={t('overview.running')}
              currency={data.currency}
              points={data.points}
              previous={data.previous_points}
              projection={
                current && forecast.data && forecast.data.days_left > 0
                  ? {
                      end: forecast.data.end,
                      total_minor: forecast.data.projected_minor,
                      days: forecast.data.days_left,
                    }
                  : undefined
              }
              labels={{
                now: t('overview.legend.now'),
                before: t('overview.legend.before'),
                heading: t('overview.legend.heading'),
              }}
            />
          )}
        </Panel>
      </div>

      {current && (
        <Panel title={t('overview.forecast.title')} query={forecast}>
          {(data) => <Forecast forecast={data} />}
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t('overview.byCategory')}
          query={categories}
          empty={(data) => data.items.length === 0}
        >
          {(data) => (
            <BarList
              label={t('overview.byCategory')}
              currency={data.currency}
              language={language}
              items={data.items.map((item) => {
                const category = book.find(item.category_id);
                return {
                  key: item.category_id,
                  icon: category?.icon,
                  label: book.nameOf(category),
                  amount_minor: item.amount_minor,
                  detail: share(item.share_pct, item.count),
                  to: paths.list({ ...expense, category: item.category_id }),
                };
              })}
            />
          )}
        </Panel>
        <Panel
          title={t('overview.byPerson')}
          query={people}
          empty={(data) => data.items.every((item) => item.name === null)}
        >
          {(data) => (
            <BarList
              label={t('overview.byPerson')}
              currency={data.currency}
              language={language}
              items={data.items.map((item) => ({
                key: item.name ?? '',
                label: item.name ?? t('overview.notNamed'),
                amount_minor: item.amount_minor,
                detail: share(item.share_pct, item.count),
                ...(item.name ? { to: paths.list({ ...expense, person: item.name }) } : {}),
              }))}
            />
          )}
        </Panel>
        <Panel
          title={t('overview.places')}
          query={places}
          empty={(data) => data.items.length === 0}
        >
          {(data) => (
            <BarList
              label={t('overview.places')}
              currency={data.currency}
              language={language}
              items={data.items.map((item) => ({
                key: item.merchant,
                label: item.merchant,
                amount_minor: item.amount_minor,
                detail: share(item.share_pct, item.count),
                to: paths.list({ ...expense, merchant: item.merchant }),
              }))}
            />
          )}
        </Panel>
        <Panel
          title={t('overview.products')}
          query={products}
          empty={(data) => data.items.length === 0}
        >
          {(data) => (
            <BarList
              label={t('overview.products')}
              currency={data.currency}
              language={language}
              items={data.items.map((item) => ({
                key: item.product_id,
                label: item.name,
                amount_minor: item.amount_minor,
                detail: t('overview.entries', { count: item.count }),
                to: paths.product(item.product_id),
              }))}
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('overview.heatmap')} query={heat}>
          {(data) => <Heatmap data={data} />}
        </Panel>
        <Panel
          title={t('overview.net')}
          query={net}
          empty={(data) => data.months.every((item) => item.count === 0)}
        >
          {(data) => (
            <ColumnChart
              name={t('overview.net')}
              currency={data.currency}
              below={{ above: t('overview.legend.kept'), below: t('overview.legend.over') }}
              columns={data.months.map((item) => ({
                key: item.month,
                label: month.format(displayDate(item.start)),
                value: item.net_minor,
                to: paths.list({ from: item.start, to: item.end }),
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel
        title={t('overview.unusual')}
        query={unusual}
        empty={(data) => data.items.length === 0}
      >
        {(data) => (
          <ul role="list" className="divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.entry_id} className="flex flex-wrap items-center gap-3 py-2">
                <TrendingUp aria-hidden="true" className="size-4 text-[var(--tt-accent-amber)]" />
                <Link
                  to={paths.entry(item.entry_id)}
                  className="min-w-40 flex-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
                <span className="text-sm text-muted">
                  {t('overview.usual', {
                    amount: formatMoney(item.amount_minor, data.currency, language),
                    times: item.times_usual,
                    usual: formatMoney(item.usual_minor, data.currency, language),
                    category: book.nameOf(book.find(item.category_id)),
                    date: day.format(displayDate(item.date)),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
