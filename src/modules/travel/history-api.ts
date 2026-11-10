import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { travelKeys } from '@/modules/travel/api';

export type TripEvent = components['schemas']['TravelEventOut'];

/** What changed on a trip, newest first, a page at a time ("show more"). */
export function useEvents(tripId: string) {
  return usePages(travelKeys.events(tripId), (page) =>
    unwrap(
      api.GET('/v1/travel/trips/{trip_id}/events', {
        params: { path: { trip_id: tripId }, query: { page } },
      }),
    ),
  );
}
