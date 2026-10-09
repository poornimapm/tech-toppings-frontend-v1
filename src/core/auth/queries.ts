import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';

/** Every query holding the signed-in user's data lives under ['user', ...] so it can be
 *  dropped in one call when the account changes. */
export const userKeys = {
  all: ['user'] as const,
  sessions: (page: number) => ['user', 'sessions', page] as const,
};

export const authConfigKey = ['auth', 'config'] as const;

/** Public sign-in configuration (registration mode, password policy, Google client id). */
export function useAuthConfig() {
  return useQuery({
    queryKey: authConfigKey,
    queryFn: () => unwrap(api.GET('/v1/auth/config')),
    staleTime: Infinity,
  });
}
