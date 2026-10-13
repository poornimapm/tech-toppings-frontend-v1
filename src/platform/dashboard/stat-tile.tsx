import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { KpiData } from '@/core/dashboard/queries';
import { AnimatedNumber } from '@/design-system';

/** One figure for the period, and how it moved against the period before. */
export function StatTile({ data, days }: { data: KpiData; days: number }) {
  const { t, i18n } = useTranslation();
  const currency = data.format === 'currency' ? data.currency : null;
  const previous = data.previous ?? null;
  const change = previous ? (data.value - previous) / previous : null;
  const Trend = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;

  return (
    <div>
      <AnimatedNumber
        value={data.value}
        currency={currency}
        locale={i18n.language}
        className="text-3xl font-semibold tracking-tight"
      />
      {previous !== null && (
        // Neutral ink: whether "up" is good depends on the figure, so colour claims nothing.
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Trend aria-hidden="true" className="size-4" />
          {change === null
            ? t('dashboard.previousNone', { count: days })
            : t('dashboard.previousChange', {
                count: days,
                change: new Intl.NumberFormat(i18n.language, {
                  style: 'percent',
                  signDisplay: 'exceptZero',
                  maximumFractionDigits: 0,
                }).format(change),
              })}
        </p>
      )}
    </div>
  );
}
