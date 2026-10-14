import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { formatMoney } from '@/core/utils/money';

export interface BarItem {
  key: string;
  label: string;
  /** Shown before the label (a category's emoji). */
  icon?: ReactNode;
  amount_minor: number;
  /** A line under the label ("25.9% · 3 entries"). */
  detail?: string;
  /** Where the row leads: the list of what makes up the amount. */
  to?: string;
}

/**
 * Amounts as horizontal bars, largest first, each a link to what it is made of. One hue: the
 * bars compare sizes, and every bar has its amount written beside it.
 */
export function BarList({
  items,
  currency,
  language,
  label,
}: {
  items: readonly BarItem[];
  currency: string;
  language: string;
  label: string;
}) {
  const largest = Math.max(1, ...items.map((item) => item.amount_minor));
  return (
    <ul role="list" aria-label={label} className="space-y-1">
      {items.map((item) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span className="truncate font-medium">{item.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatMoney(item.amount_minor, currency, language)}
              </span>
            </span>
            <span aria-hidden="true" className="mt-1.5 block h-2 rounded-full bg-border/50">
              <span
                className="block h-2 rounded-full bg-chart"
                style={{ width: `${String(Math.max(2, (item.amount_minor / largest) * 100))}%` }}
              />
            </span>
            {item.detail && <span className="mt-1 block text-xs text-muted">{item.detail}</span>}
          </>
        );
        return (
          <li key={item.key}>
            {item.to ? (
              <Link
                to={item.to}
                className="block rounded-xl px-2 py-2 transition-colors hover:bg-surface/80"
              >
                {body}
              </Link>
            ) : (
              <div className="px-2 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
