import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import { usePages } from '@/core/api/use-pages';

const all = ['user', 'reminders'] as const;
// The bell: a snooze or dismiss changes what it may list next.
const notifications = ['user', 'notifications'] as const;

/** The user's open reminders, soonest due first. Loading them also tells any that came due. */
export function useReminders() {
  return usePages([...all, 'list'], (page) =>
    unwrap(api.GET('/v1/reminders', { params: { query: { page } } })),
  );
}

type Change = { snooze: { id: string; days: number } } | { dismiss: string };

/** Snooze one for some days, or dismiss it; then refresh the reminders and the bell. */
export function useChangeReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (change: Change) =>
      'snooze' in change
        ? unwrap(
            api.POST('/v1/reminders/{reminder_id}/snooze', {
              params: { path: { reminder_id: change.snooze.id } },
              body: { days: change.snooze.days },
            }),
          )
        : unwrap(
            api.POST('/v1/reminders/{reminder_id}/dismiss', {
              params: { path: { reminder_id: change.dismiss } },
            }),
          ),
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: all }),
        client.invalidateQueries({ queryKey: notifications }),
      ]),
  });
}
