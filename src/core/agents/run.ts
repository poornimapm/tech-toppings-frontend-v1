import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import type { AgentRun } from '@/core/agents/queries';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';

export type RunStage = components['schemas']['RunStage'];

interface Follow {
  /** How often a running run is asked about, in ms. */
  every: number;
  /** How long it is followed at most, in ms. */
  limit: number;
}

/** Past the server's own limit (AGENT_RUN_TIMEOUT_SECONDS: 90 s by default, 120 s at most), so
 *  its answer comes first. */
const FOLLOW: Follow = { every: 1500, limit: 150_000 };

/** Outside ['user', 'agents']: refreshing the agents' availability mustn't ask for a run again. */
const runKey = (id: string) => [...userKeys.all, 'agent-run', id] as const;

/** Stops one of the person's running runs on the server: it makes no further AI call (so it takes
 *  no more of the day's AI use), and keeps what it made as `incomplete`. */
export const cancelRun = (run_id: string) =>
  unwrap(api.POST('/v1/agents/runs/{run_id}/cancel', { params: { path: { run_id } } }));

/**
 * Follows a background run (one answered 202 with its id): asked again every `every` ms while
 * it is `running`, never again once it has ended. Unmounted, given no id, or failing (a retry
 * is `refetch`), it stops. A run still running after `limit` ms reads as the server reads one
 * past its time: incomplete, reason `timeout`, and it is no longer asked about.
 */
export function useRun(id: string | null, { every, limit }: Follow = FOLLOW) {
  // When following began, per run: set on the first ask, so rendering stays pure.
  const since = useRef<{ id: string; at: number } | null>(null);
  return useQuery({
    queryKey: runKey(id ?? ''),
    queryFn: async (): Promise<AgentRun> => {
      const run_id = id ?? '';
      const run = await unwrap(
        api.GET('/v1/agents/runs/{run_id}', { params: { path: { run_id } } }),
      );
      if (since.current?.id !== run_id) since.current = { id: run_id, at: Date.now() };
      return run.status === 'running' && Date.now() - since.current.at >= limit
        ? { ...run, status: 'incomplete', reason: 'timeout' }
        : run;
    },
    enabled: id !== null,
    // An ended run doesn't change: it is never asked for again.
    staleTime: Infinity,
    refetchInterval: ({ state }) =>
      state.status === 'success' && state.data?.status === 'running' ? every : false,
  });
}
