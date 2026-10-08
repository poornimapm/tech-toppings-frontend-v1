import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api, unwrap } from '@/core/api/client';
import { env } from '@/core/config/env';

/**
 * Backend availability as the user experiences it. The free host sleeps when idle and needs
 * about a minute to wake, so "slow but still trying" is its own state ("waking").
 */
export type ServerStatus = 'checking' | 'waking' | 'online' | 'offline';

export interface ServerStatusOptions {
  /** Show "waking" once a health check has been pending this long. */
  wakeThresholdMs: number;
  /** Stop retrying (status "offline") after roughly this long. */
  maxWaitMs: number;
  /** Re-check interval while online. */
  pollMs: number;
  /** Delay before retry number `attempt` (0-based). */
  retryDelay?: (attempt: number) => number;
}

export const serverKeys = {
  health: ['server', 'health'] as const,
  readiness: ['server', 'readiness'] as const,
};

const MAX_RETRY_DELAY_MS = 5000;

/** Exponential backoff: 1s, 2s, 4s, then every 5s. */
export function backoffDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

/** How many retries fit into `maxWaitMs` with the given delay schedule. */
export function retriesWithin(maxWaitMs: number, delay: (attempt: number) => number): number {
  let retries = 0;
  let waited = 0;
  while (waited + delay(retries) <= maxWaitMs) {
    waited += delay(retries);
    retries += 1;
  }
  return retries;
}

export function deriveServerStatus(state: {
  isSuccess: boolean;
  isError: boolean;
  isSlow: boolean;
}): ServerStatus {
  if (state.isSuccess) return 'online';
  if (state.isError) return 'offline';
  return state.isSlow ? 'waking' : 'checking';
}

/** True once `active` has stayed true for `thresholdMs`; resets when it turns false. */
function useStaysTrueFor(active: boolean, thresholdMs: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => {
      setElapsed(true);
    }, thresholdMs);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, thresholdMs]);
  return active && elapsed;
}

const defaultOptions: ServerStatusOptions = {
  wakeThresholdMs: env.wakeThresholdMs,
  maxWaitMs: env.wakeMaxWaitMs,
  pollMs: env.healthPollMs,
};

export function useServerStatus(options: ServerStatusOptions = defaultOptions) {
  const delay = options.retryDelay ?? backoffDelay;
  const query = useQuery({
    queryKey: serverKeys.health,
    queryFn: () => unwrap(api.GET('/healthz')),
    retry: retriesWithin(options.maxWaitMs, delay),
    retryDelay: delay,
    staleTime: 0,
    refetchInterval: (current) => (current.state.status === 'success' ? options.pollMs : false),
  });
  const isSlow = useStaysTrueFor(query.isFetching && !query.isSuccess, options.wakeThresholdMs);
  const status = deriveServerStatus({
    isSuccess: query.isSuccess,
    isError: query.isError && !query.isFetching,
    isSlow,
  });

  return {
    status,
    health: query.data,
    retry: () => {
      void query.refetch();
    },
  };
}

/** Database readiness; only queried once the API itself answers. */
export function useReadiness(enabled: boolean, pollMs: number = env.healthPollMs) {
  return useQuery({
    queryKey: serverKeys.readiness,
    queryFn: () => unwrap(api.GET('/readyz')),
    enabled,
    retry: false,
    refetchInterval: pollMs,
  });
}
