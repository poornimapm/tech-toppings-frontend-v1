import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { userKeys } from '@/core/auth/queries';

type Schemas = components['schemas'];
export type Trip = Schemas['TravelTripOut'];
export type TripInput = Schemas['TripIn'];
export type TripPatch = Schemas['TripPatch'];
export type TripMode = Schemas['TripMode'];
export type TripType = Schemas['TripType'];
export type TripPhase = Schemas['TripPhase'];
export type Pace = Schemas['Pace'];
export type Options = Schemas['TravelOptions'];
export type Overview = Schemas['TravelOverviewOut'];
export type NextAction = Schemas['TravelNextAction'];

const travelKey = [...userKeys.all, 'travel'] as const;
export const travelKeys = {
  all: travelKey,
  options: [...travelKey, 'options'] as const,
  trips: (filters: object) => [...travelKey, 'trips', filters] as const,
  trip: (id: string) => [...travelKey, 'trip', id] as const,
  overview: (id: string) => [...travelKey, 'overview', id] as const,
  activities: (id: string) => [...travelKey, 'activities', id] as const,
  checklist: (id: string) => [...travelKey, 'checklist', id] as const,
  /** Every day's plan of a trip; `prepare` is one of them. */
  plans: (id: string) => [...travelKey, 'prepare', id] as const,
  prepare: (id: string, when: string) => [...travelKey, 'prepare', id, when] as const,
  bookings: (id: string) => [...travelKey, 'bookings', id] as const,
  expenses: (id: string) => [...travelKey, 'expenses', id] as const,
  budget: (id: string) => [...travelKey, 'budget', id] as const,
  events: (id: string) => [...travelKey, 'events', id] as const,
  /** A preview of what would be added (suggestions, an AI draft). Outside `all`: the change being
   *  made mustn't ask for the preview again behind its back. */
  preview: (id: string, asked: object) => [...userKeys.all, 'travel-preview', id, asked] as const,
};

export const tripPath = (trip_id: string) => ({ params: { path: { trip_id } } });

/** A failure's code, for a form to say what went wrong. */
export function failureCode(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.code : 'UNKNOWN';
}

/** What the forms offer and check, and whether Premium may be saved: the server's, so the two
 *  never disagree. */
export function useOptions() {
  return useQuery({
    queryKey: travelKeys.options,
    queryFn: () => unwrap(api.GET('/v1/travel/options')),
    staleTime: Infinity,
  });
}

export interface TripFilters {
  phase?: TripPhase;
  page_size?: number;
}

/** The user's trips, a page at a time ("show more"): those ahead soonest first, past ones and
 *  all of them together latest first (the server's order). */
export function useTrips(filters: TripFilters = {}) {
  return usePages(travelKeys.trips(filters), (page) =>
    unwrap(api.GET('/v1/travel/trips', { params: { query: { page, ...filters } } })),
  );
}

/** A trip at a glance, on its own calendar: countdown, readiness and the next action. */
export function useOverview(id: string) {
  return useQuery({
    queryKey: travelKeys.overview(id),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/overview', tripPath(id))),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: travelKeys.trip(id),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}', tripPath(id))),
  });
}

/** A change to a trip's records: everything of Travel's is fresh after it (a change reaches the
 *  overview, the day's plan and the lists). Not awaited, so a dialog can close at once; failures
 *  are the caller's to show. */
export function useTravelChange<TInput, TResult>(
  run: (input: TInput) => Promise<TResult>,
  changes: (input: TInput) => boolean = () => true,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (_result, input) => {
      if (changes(input)) void client.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}

/** Only what is sent changes, as of the revision seen: changed elsewhere since, it's refused
 *  (VERSION_CONFLICT) for the page to reload. */
export function useEditTrip() {
  return useTravelChange(({ id, body }: { id: string; body: TripPatch }) =>
    unwrap(api.PATCH('/v1/travel/trips/{trip_id}', { ...tripPath(id), body })),
  );
}

/** Deleted with everything in it, its reminder too: kept, to be brought back (`useUndeleteTrip`).
 *  Everything of the user's is refreshed after, as the tile and the dashboard count trips. */
export function useDeleteTrip() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.DELETE('/v1/travel/trips/{trip_id}', tripPath(id))),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/** A deleted trip back, while the user has room for one more (else TRAVEL_TRIPS_FULL). */
export function useUndeleteTrip() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.POST('/v1/travel/trips/{trip_id}/undelete', tripPath(id))),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/** A new trip, sent with one key however often it is tried (a double tap plans it once).
 *  Everything of the user's is refreshed after (the tile and the dashboard count trips too);
 *  failures are the form's to show. */
export function useAddTrip() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: TripInput; key: string }) =>
      unwrap(api.POST('/v1/travel/trips', { body, headers: { 'Idempotency-Key': key } })),
    // Not awaited: the form leaves at once, and its lists refetch when shown.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
