import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components, paths } from '@/core/api/schema';
import type { EntryKind } from '@/modules/expenses/api';

const PREFIX = '/v1/expenses/analytics/';
type Path = Extract<keyof paths, `${typeof PREFIX}${string}`>;
/** `summary`, `by-category`, `daily` ...: every analytics endpoint the server has. */
export type AnalyticsName = Path extends `${typeof PREFIX}${infer Name}` ? Name : never;
export type AnalyticsOf<N extends AnalyticsName> =
  paths[`${typeof PREFIX}${N}`]['get']['responses'][200]['content']['application/json'];
export type Insight = components['schemas']['InsightOut'];
export type InsightPeriod = components['schemas']['Period'];

/** The entries list's own filters (a chart drills into the list with them), and `date` for
 *  the forecast. */
export interface AnalyticsQuery {
  from?: string;
  to?: string;
  kind?: EntryKind;
  date?: string;
}

interface Answer {
  data?: unknown;
  error?: unknown;
  response: Response;
}
// One call for every analytics path: their answers are typed by AnalyticsOf.
const get = api.GET as unknown as (
  path: string,
  init: { params: { query: AnalyticsQuery } },
) => Promise<Answer>;

/** Under ['user', ...] so a saved entry (which refreshes everything of the user's) and signing
 *  out reach these too. */
const root = ['user', 'expenses'] as const;

export function useAnalytics<N extends AnalyticsName>(name: N, query: AnalyticsQuery) {
  return useQuery({
    queryKey: [...root, 'analytics', name, query] as const,
    queryFn: async () =>
      (await unwrap(get(`${PREFIX}${name}`, { params: { query } }))) as AnalyticsOf<N>,
  });
}

const insightKey = (period: InsightPeriod, date: string) =>
  [...root, 'insight', period, date] as const;

/** A week or month in facts, and its summary. The server keeps an AI summary while the facts
 *  don't change, so asking again is cheap; still, it isn't asked on every focus. */
export function useInsight(period: InsightPeriod, date: string) {
  return useQuery({
    queryKey: insightKey(period, date),
    queryFn: () =>
      unwrap(api.GET('/v1/expenses/insights', { params: { query: { period, date } } })),
    refetchOnWindowFocus: false,
  });
}

export function useRefreshInsight(period: InsightPeriod, date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(api.POST('/v1/expenses/insights/refresh', { params: { query: { period, date } } })),
    onSuccess: (insight) => {
      client.setQueryData(insightKey(period, date), insight);
    },
  });
}
