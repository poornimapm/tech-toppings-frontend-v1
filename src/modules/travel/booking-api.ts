import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { travelKeys, tripPath, useTravelChange } from '@/modules/travel/api';

type Schemas = components['schemas'];
export type Booking = Schemas['TravelBookingOut'];
export type BookingInput = Schemas['TravelBookingIn'];
export type BookingPatch = Schemas['TravelBookingPatch'];
export type BookingKind = Schemas['BookingKind'];

const bookingPath = (booking_id: string) => ({ params: { path: { booking_id } } });

/** A booking someone checked with whoever it is with; the rest are as entered or read. */
export const isChecked = (booking: Booking) =>
  booking.status === 'confirmed' || booking.status === 'verified';

/** A trip's bookings as the person entered them: those with no time first, then as they start
 *  (the server's order). */
export function useBookings(tripId: string) {
  return useQuery({
    queryKey: travelKeys.bookings(tripId),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/bookings', tripPath(tripId))),
  });
}

/** A new booking, sent with one key however often it is tried. */
export function useAddBooking(tripId: string) {
  return useTravelChange(({ body, key }: { body: BookingInput; key: string }) =>
    unwrap(
      api.POST('/v1/travel/trips/{trip_id}/bookings', {
        ...tripPath(tripId),
        body,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  );
}

/** An edit, as of the revision seen: changed elsewhere since, it's refused (VERSION_CONFLICT). */
export function useEditBooking() {
  return useTravelChange(({ id, body }: { id: string; body: BookingPatch }) =>
    unwrap(api.PATCH('/v1/travel/bookings/{booking_id}', { ...bookingPath(id), body })),
  );
}

/** Removed, unless an activity still links to it (TRAVEL_BOOKING_IN_USE); its history event
 *  takes it back. */
export function useRemoveBooking() {
  return useTravelChange((id: string) =>
    unwrap(api.DELETE('/v1/travel/bookings/{booking_id}', bookingPath(id))),
  );
}
