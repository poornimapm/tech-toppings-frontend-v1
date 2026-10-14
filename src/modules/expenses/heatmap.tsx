import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import type { AnalyticsOf } from '@/modules/expenses/analytics';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';

/** One hue from light to dark (sequential): more spent, darker. Zero is an empty cell. */
const STEPS = ['bg-chart/15', 'bg-chart/35', 'bg-chart/55', 'bg-chart/75', 'bg-chart'];
/** Day numbers on the darker steps use the contrasting ink. */
const DARK_FROM = 3;
const MONDAY = new Date(2024, 0, 1); // a Monday, to name the weekdays

/**
 * The span's days by week, Monday first, darker for more spent; each day opens its entries.
 * Every cell says its date and amount to screen readers, and the busiest weekday is written
 * out under the grid.
 */
export function Heatmap({ data }: { data: AnalyticsOf<'weekday-heatmap'> }) {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number) => formatMoney(minor, data.currency, i18n.language);
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
  const longWeekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' });
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });
  const amounts = data.weeks.flatMap((week) => week.days.map((day) => day?.amount_minor ?? 0));
  const largest = Math.max(1, ...amounts);
  const step = (minor: number) =>
    Math.min(STEPS.length - 1, Math.floor((minor / largest) * STEPS.length));
  const busiest = [...data.weekdays].sort((a, b) => b.average_minor - a.average_minor)[0];
  const nameOf = (index: number) => weekday.format(new Date(MONDAY.getTime() + index * 86_400_000));

  return (
    <div>
      <table className="w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">{t('overview.heatmap')}</caption>
        <thead>
          <tr>
            {Array.from({ length: 7 }, (_, index) => (
              <th key={index} scope="col" className="text-xs font-medium text-muted">
                {nameOf(index)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.weeks.map((week) => (
            <tr key={week.start}>
              {week.days.map((day, index) =>
                day ? (
                  <td key={day.date} className="p-0">
                    <Link
                      to={paths.list({ show: data.kind, from: day.date, to: day.date })}
                      aria-label={`${date.format(displayDate(day.date))}: ${money(day.amount_minor)}`}
                      title={`${date.format(displayDate(day.date))}: ${money(day.amount_minor)}`}
                      className={`flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition-transform hover:scale-105 ${
                        day.amount_minor
                          ? `${STEPS[step(day.amount_minor)] ?? ''} ${step(day.amount_minor) >= DARK_FROM ? 'text-primary-contrast' : 'text-text'}`
                          : 'border border-border text-muted'
                      }`}
                    >
                      {displayDate(day.date).getDate()}
                    </Link>
                  </td>
                ) : (
                  <td key={`${week.start}-${String(index)}`} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {busiest && busiest.average_minor > 0 ? (
          <p className="text-sm text-text">
            {t('overview.busiest', {
              day: longWeekday.format(new Date(MONDAY.getTime() + busiest.weekday * 86_400_000)),
              amount: money(busiest.average_minor),
            })}
          </p>
        ) : (
          <span />
        )}
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          {t('overview.less')}
          {STEPS.map((className) => (
            <span key={className} className={`size-3 rounded-sm ${className}`} />
          ))}
          {t('overview.more')}
        </span>
      </div>
    </div>
  );
}
