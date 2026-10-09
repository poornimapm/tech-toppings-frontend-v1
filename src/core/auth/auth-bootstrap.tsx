import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { isTransient } from '@/core/api/api-error';
import { backoffDelay } from '@/core/api/server-status';
import { userKeys } from '@/core/auth/queries';
import { refreshSession } from '@/core/auth/session';
import { useSession } from '@/core/auth/session-store';

const MAX_BOOTSTRAP_RETRIES = 6;

/**
 * Restores the session once at startup by exchanging the refresh cookie. While the free
 * backend wakes up (transient errors) it keeps trying; a definite "no session" (401) means
 * signed out. Also drops cached data of a previous account when the user changes.
 */
export function AuthBootstrap() {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id ?? null);
  const previousUserId = useRef(userId);

  const bootstrap = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: refreshSession,
    retry: (failures, error) => isTransient(error) && failures < MAX_BOOTSTRAP_RETRIES,
    retryDelay: backoffDelay,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (bootstrap.isError && useSession.getState().status === 'unknown') {
      useSession.getState().clear();
    }
  }, [bootstrap.isError]);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      queryClient.removeQueries({ queryKey: userKeys.all });
      previousUserId.current = userId;
    }
  }, [queryClient, userId]);

  return null;
}
