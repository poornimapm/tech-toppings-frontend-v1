import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';

export type MonthlyReport = components['schemas']['MonthlyReportOut'];

/** A month (YYYY-MM) on one page: totals against the month before, where it went. */
export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: [...userKeys.all, 'expenses', 'report', month] as const,
    queryFn: () =>
      unwrap(api.GET('/v1/expenses/reports/monthly', { params: { query: { month } } })),
  });
}

/** The month (YYYY-MM) `delta` months from `month`. */
export function shiftMonth(month: string, delta: number): string {
  const [year = 0, number = 1] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, number - 1 + delta, 1));
  return shifted.toISOString().slice(0, 7);
}
