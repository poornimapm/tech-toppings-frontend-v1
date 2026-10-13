import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { Skeleton } from '@/design-system';
import { useSummary, type EntryFilters } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';

/** Spent, received and what is left for everything the filters match, per currency. */
export function Totals({ filters, currency }: { filters: EntryFilters; currency: string }) {
  const { t, i18n } = useTranslation(NS);
  const summary = useSummary(filters);
  if (summary.isPending) return <Skeleton className="h-20 rounded-3xl" />;
  // Nothing yet still shows zeros in the user's own currency, rather than an empty space.
  const totals = summary.data?.length
    ? summary.data
    : [{ currency, expense_minor: 0, income_minor: 0, count: 0 }];

  return (
    <div className="space-y-2">
      {totals.map((total) => (
        <dl
          key={total.currency}
          className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border bg-glass py-4 text-center shadow-sm backdrop-blur-xl"
        >
          {(
            [
              ['spent', total.expense_minor],
              ['received', total.income_minor],
              ['net', total.income_minor - total.expense_minor],
            ] as const
          ).map(([name, minor]) => (
            <div key={name} className="px-2">
              <dt className="text-xs font-medium text-muted">{t(`summary.${name}`)}</dt>
              <dd className="mt-0.5 truncate text-lg font-semibold tracking-tight sm:text-2xl">
                {formatMoney(minor, total.currency, i18n.language)}
              </dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}
