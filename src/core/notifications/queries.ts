import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import { usePages } from '@/core/api/use-pages';
import { env } from '@/core/config/env';

const all = ['user', 'notifications'] as const;

/** The user's notifications, newest first. */
export function useNotifications() {
  return usePages([...all, 'list'], (page) =>
    unwrap(api.GET('/v1/notifications', { params: { query: { page } } })),
  );
}

/** Unread count for the bell: the total of the unread filter, asking for a single item. */
export function useUnreadCount() {
  return useQuery({
    queryKey: [...all, 'unread'] as const,
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/v1/notifications', { params: { query: { unread: true, page_size: 1 } } }),
        )
      ).total,
    refetchInterval: env.notificationsPollMs,
  });
}

type Change = { read: string } | { remove: string } | { readAll: true };

/** Mark one read, remove one, or mark everything read; then refresh the list and the bell. */
export function useChangeNotifications() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (change: Change) => {
      if ('readAll' in change) return unwrap(api.POST('/v1/notifications/read-all'));
      const id = 'read' in change ? change.read : change.remove;
      const options = { params: { path: { notification_id: id } } };
      return unwrap(
        'read' in change
          ? api.POST('/v1/notifications/{notification_id}/read', options)
          : api.DELETE('/v1/notifications/{notification_id}', options),
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: all }),
  });
}
