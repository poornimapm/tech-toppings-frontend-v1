import { addDays } from '@/core/utils/dates';

/** Periods the list can show. The first is the default. */
export const PERIODS = ['thisMonth', 'lastMonth', 'last90', 'allTime'] as const;
export type Period = (typeof PERIODS)[number];

export function toPeriod(value: string | null): Period {
  return PERIODS.find((period) => period === value) ?? PERIODS[0];
}

/** The days a period covers (both inclusive), given today's date; open-ended for all time. */
export function daysOf(period: Period, today: string): { from?: string; to?: string } {
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = addDays(monthStart, -1);
  const ranges: Record<Period, { from?: string; to?: string }> = {
    thisMonth: { from: monthStart, to: today },
    lastMonth: { from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd },
    last90: { from: addDays(today, -89), to: today },
    allTime: {},
  };
  return ranges[period];
}
