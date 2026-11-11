import type { ClientAction } from '@/core/agents/queries';
import { toInput } from '@/core/utils/money';
import { fieldsOf, listOf, minorOf, oneOf, textOf } from '@/modules/travel/ai-drafts';
import { PACES, TIME_ZONES, TRIP_TYPES, type TripValues } from '@/modules/travel/trip-form';

/** describe-trip's client tool: a trip as the person described it, for the planning steps. */
export const TRIP_DRAFT = 'travel_trip_draft';

/** What a description fills in: always where and when, the rest only if it was said. Who
 *  travels, notes, the mode and the reminder are never in it: they stay the person's own. */
export type TripDraft = Pick<TripValues, 'title' | 'destinations' | 'start_date' | 'end_date'> &
  Partial<
    Pick<TripValues, 'departure_city' | 'trip_type' | 'pace' | 'currency' | 'budget' | 'interests'>
  >;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY = /^[A-Z]{3}$/;

/** A time zone as this browser names it among those it offers ("Asia/Kolkata" may be its
 *  "Asia/Calcutta"), or '' for one it doesn't know. */
function zoneOf(name: string): string {
  try {
    const zone = new Intl.DateTimeFormat('en', { timeZone: name }).resolvedOptions().timeZone;
    return TIME_ZONES.includes(zone) ? zone : '';
  } catch {
    return ''; // none given, or no such zone
  }
}

/**
 * The planning steps' fields out of a describe-trip draft, or null without where and when. Its
 * shape comes from an AI, so nothing is taken for granted: what is missing or odd is left out,
 * and the form keeps what it had. A kind or pace at the draft's default (other, balanced) means
 * nothing was said of it; a budget is in its currency's main unit, as it was said, and one with
 * no currency is in the form's `currency`.
 */
export function tripDraftOf(action: ClientAction, currency: string): TripDraft | null {
  const trip = fieldsOf(action.arguments.trip);
  const destinations = listOf(trip.destinations)
    .map(fieldsOf)
    .map((place) => ({
      name: textOf(place.name),
      country: textOf(place.country),
      timezone: zoneOf(textOf(place.timezone)),
    }))
    .filter((place) => place.name && place.country);
  const title = textOf(trip.title);
  const start = textOf(trip.start_date);
  const end = textOf(trip.end_date);
  if (!title || !destinations.length || !DAY.test(start) || !DAY.test(end)) return null;

  const draft: TripDraft = { title, destinations, start_date: start, end_date: end };
  const departure = textOf(trip.departure_city);
  if (departure) draft.departure_city = departure;
  const type = oneOf(TRIP_TYPES, trip.trip_type);
  if (type && type !== 'other') draft.trip_type = type;
  const pace = oneOf(PACES, trip.pace);
  if (pace && pace !== 'balanced') draft.pace = pace;
  const money = textOf(trip.currency);
  if (CURRENCY.test(money)) draft.currency = money;
  const budgetIn = draft.currency ?? currency;
  const budget = minorOf(trip.budget, budgetIn);
  if (budget !== null) draft.budget = toInput(budget, budgetIn);
  const interests = listOf(trip.interests).map(textOf).filter(Boolean);
  if (interests.length) draft.interests = interests.join(', ');
  return draft;
}
