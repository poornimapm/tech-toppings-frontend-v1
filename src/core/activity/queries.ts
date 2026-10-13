import { api, unwrap } from '@/core/api/client';
import { usePages } from '@/core/api/use-pages';

/** What the user has done, newest first. */
export function useActivity() {
  return usePages(['user', 'activity'], (page) =>
    unwrap(api.GET('/v1/activity', { params: { query: { page } } })),
  );
}
