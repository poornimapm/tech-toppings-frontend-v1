import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { travelKeys, tripPath, useTravelChange } from '@/modules/travel/api';

type Schemas = components['schemas'];
export type Activity = Schemas['TravelActivityOut'];
export type ActivityInput = Schemas['TravelActivityIn'];
export type ActivityPatch = Schemas['TravelActivityPatch'];
export type ActivityFields = Schemas['ActivityFields'];
export type ActivityStatus = Schemas['ActivityStatus'];
export type ChangeAction = Schemas['ChangeAction'];
export type ChangeInput = Schemas['TravelChangeIn'];
export type ChangeResult = Schemas['TravelChangeOut'];
export type RecordChange = Schemas['RecordChange'];
export type Flag = Schemas['TravelFlag'];

const activityPath = (activity_id: string) => ({ params: { path: { activity_id } } });

/** Every activity of a trip, day by day and in each day's order (the server's). */
export function useActivities(tripId: string) {
  return useQuery({
    queryKey: travelKeys.activities(tripId),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/activities', tripPath(tripId))),
  });
}

/** A new activity, last in its day, sent with one key however often it is tried. */
export function useAddActivity(tripId: string) {
  return useTravelChange(({ body, key }: { body: ActivityInput; key: string }) =>
    unwrap(
      api.POST('/v1/travel/trips/{trip_id}/activities', {
        ...tripPath(tripId),
        body,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  );
}

/** An edit, as of the revision seen: changed elsewhere since, it's refused (VERSION_CONFLICT). */
export function useEditActivity() {
  return useTravelChange(({ id, body }: { id: string; body: ActivityPatch }) =>
    unwrap(api.PATCH('/v1/travel/activities/{activity_id}', { ...activityPath(id), body })),
  );
}

/** Off the plan: its own untouched items stand down with it, and its history event
 *  (activity_deleted) brings it all back. */
export function useRemoveActivity() {
  return useTravelChange((id: string) =>
    unwrap(api.DELETE('/v1/travel/activities/{activity_id}', activityPath(id))),
  );
}

/** A new order for one day: every activity of it, each once. The day the server answers takes
 *  its place in the trip's timeline at once, before the refetch. */
export function useReorder(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas['TravelReorderIn']) =>
      unwrap(
        api.POST('/v1/travel/trips/{trip_id}/activities/reorder', { ...tripPath(tripId), body }),
      ),
    onSuccess: (ordered, { day }) => {
      client.setQueryData<Activity[]>(
        travelKeys.activities(tripId),
        (all) =>
          all && [
            ...all.filter((each) => each.day < day),
            ...ordered,
            ...all.filter((each) => each.day > day),
          ],
      );
      void client.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}

/** Done, skipped, replaced or rescheduled: a preview that writes nothing until `apply`, then the
 *  change itself, with what it reached and the event that takes it back. */
export function useChangeActivity() {
  return useTravelChange(
    ({ id, body }: { id: string; body: ChangeInput }) =>
      unwrap(api.POST('/v1/travel/activities/{activity_id}/change', { ...activityPath(id), body })),
    ({ body }) => body.apply,
  );
}

/** One change taken back, if nothing it touched has changed since. */
export function useUndo() {
  return useTravelChange((event_id: string) =>
    unwrap(api.POST('/v1/travel/events/{event_id}/undo', { params: { path: { event_id } } })),
  );
}
