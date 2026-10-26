import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { isTransient } from '@/core/api/api-error';
import { backoffDelay } from '@/core/api/server-status';
import { userKeys } from '@/core/auth/queries';
import { refreshSession } from '@/core/auth/session';
import { mayHaveSession, useSession } from '@/core/auth/session-store';

const MAX_BOOTSTRAP_RETRIES = 6;

/**
 * Restores the session once at startup by exchanging the refresh cookie. While the free
 * backend wakes up (transient errors) it keeps trying; a definite "no session" (401) means
 * signed out (refreshSession forgets this browser then). Any other failure (offline, a server
 * error) is signed out for now only: the next start tries the cookie again. A browser known to
 * be signed out (it signed out, or the server said so before) isn't asked about at all.
 * Also drops cached data of a previous account when the user changes.
 */
export function AuthBootstrap() {
  const queryClient = useQueryClient();
  const userId = useSession((state) => state.user?.id ?? null);
  const previousUserId = useRef(userId);
  const [restoring] = useState(mayHaveSession);

  const bootstrap = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: refreshSession,
    enabled: restoring,
    retry: (failures, error) => isTransient(error) && failures < MAX_BOOTSTRAP_RETRIES,
    retryDelay: backoffDelay,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if ((!restoring || bootstrap.isError) && useSession.getState().status === 'unknown') {
      useSession.getState().setAnonymous();
    }
  }, [bootstrap.isError, restoring]);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      queryClient.removeQueries({ queryKey: userKeys.all });
      previousUserId.current = userId;
    }
  }, [queryClient, userId]);

  return null;
}
