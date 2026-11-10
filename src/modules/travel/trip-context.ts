import { useOutletContext } from 'react-router';

import type { Options, Trip } from '@/modules/travel/api';

export interface TripContext {
  /** The trip every tab works on, as last loaded. */
  trip: Trip;
  /** What the forms offer and check (the server's). */
  options: Options;
}

export function useTripContext(): TripContext {
  return useOutletContext<TripContext>();
}
