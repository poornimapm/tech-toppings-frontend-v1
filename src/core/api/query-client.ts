import { QueryClient } from '@tanstack/react-query';

import { isTransient } from '@/core/api/api-error';

const MAX_TRANSIENT_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry only failures that a retry can fix (network, cold start); never 4xx.
        retry: (failureCount, error) => isTransient(error) && failureCount < MAX_TRANSIENT_RETRIES,
      },
    },
  });
}
