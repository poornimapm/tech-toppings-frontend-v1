import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';

type Schemas = components['schemas'];
export type WidgetView = Schemas['WidgetView'];
export type KpiData = Schemas['Kpi'];
export type SeriesData = Schemas['Series'];
export type ItemsData = Schemas['Items'];

export interface DashboardQuery {
  from: string;
  to: string;
  /** Admins only: figures across all users (aggregates, no individual records). */
  allUsers: boolean;
}

/** Widgets for a period. While a new period loads, the previous one stays on screen. */
export function useDashboard({ from, to, allUsers }: DashboardQuery) {
  return useQuery({
    queryKey: ['user', 'dashboard', allUsers ? 'all' : 'mine', from, to] as const,
    queryFn: () => {
      const options = { params: { query: { from, to } } };
      return unwrap(
        allUsers ? api.GET('/v1/admin/dashboard', options) : api.GET('/v1/dashboard', options),
      );
    },
    placeholderData: keepPreviousData,
    // Figures move with everything the user does, so each visit asks again.
    staleTime: 0,
  });
}
