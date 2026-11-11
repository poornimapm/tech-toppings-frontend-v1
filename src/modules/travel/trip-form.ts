import type { FieldPath } from 'react-hook-form';

import { toInput, toMinor } from '@/core/utils/money';
import type { Pace, Trip, TripInput, TripMode, TripType } from '@/modules/travel/api';
import { tripToday } from '@/modules/travel/trip-words';

/** One traveller as typed. `id` is theirs on a saved trip, '' for one added here. */
export interface TravellerValues {
  id: string;
  name: string;
  passport_country: string;
  residence_country: string;
  passport_expiry: string;
  dietary: string;
  accessibility: string;
}

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
export interface TripValues {
  title: string;
  destinations: { name: string; country: string; timezone: string }[];
  departure_city: string;
  start_date: string;
  end_date: string;
  travellers: TravellerValues[];
  trip_type: TripType;
  pace: Pace;
  currency: string;
  budget: string;
  interests: string;
  notes: string;
  remind_prepare: boolean;
  mode: TripMode;
}

/** The guided steps, in order; the last is the check before saving. */
export const STEPS = ['place', 'people', 'style', 'mode', 'review'] as const;
export type Step = (typeof STEPS)[number];

/** What each step asks for: checked before moving on from it. */
export const STEP_FIELDS: Record<Step, FieldPath<TripValues>[]> = {
  place: ['title', 'destinations', 'departure_city', 'start_date', 'end_date'],
  people: ['travellers'],
  style: ['trip_type', 'pace', 'currency', 'budget', 'interests', 'notes'],
  mode: ['mode'],
  review: [],
};

/** As long as the API lets these be (the backend module's schemas.py). */
export const LIMITS = {
  name: 120,
  place: 80,
  interest: 40,
  notes: 1000,
  need: 200,
  /** What is typed for AI help (travel.yaml `assist.max_chars`). */
  assist: 1000,
} as const;

export const TRIP_TYPES: TripType[] = [
  'solo',
  'friends',
  'family',
  'honeymoon',
  'business',
  'adventure',
  'other',
];
export const PACES: Pace[] = ['relaxed', 'balanced', 'packed'];

/** The time zones this browser knows (IANA names, as the API checks them); none if it can't
 *  list them, and then the trip's today is the person's own. */
export const TIME_ZONES =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

/** What more a traveller may say of themselves, past their name and passport country. */
export const TRAVELLER_DETAILS = [
  'residence_country',
  'passport_expiry',
  'dietary',
  'accessibility',
] as const;

export const blankPlace = () => ({ name: '', country: '', timezone: '' });
export const blankTraveller = (name = ''): TravellerValues => ({
  id: '',
  name,
  passport_country: '',
  residence_country: '',
  passport_expiry: '',
  dietary: '',
  accessibility: '',
});

/** A new trip as the form starts it: nothing about it is assumed, not even who is going. Its
 *  money is in the person's own currency until they choose another. */
export function blankTrip(currency: string): TripValues {
  return {
    title: '',
    destinations: [blankPlace()],
    departure_city: '',
    start_date: '',
    end_date: '',
    travellers: [],
    trip_type: 'other',
    pace: 'balanced',
    currency,
    budget: '',
    interests: '',
    notes: '',
    remind_prepare: false,
    mode: 'static',
  };
}

/** A saved trip as the form shows it, to change. */
export function valuesOf(trip: Trip): TripValues {
  return {
    title: trip.title,
    destinations: trip.destinations.map(({ name, country, timezone }) => ({
      name,
      country,
      timezone: timezone ?? '',
    })),
    departure_city: trip.departure_city ?? '',
    start_date: trip.start_date,
    end_date: trip.end_date,
    travellers: trip.travellers.map((person) => ({
      id: person.id,
      name: person.name,
      passport_country: person.passport_country ?? '',
      residence_country: person.residence_country ?? '',
      passport_expiry: person.passport_expiry ?? '',
      dietary: person.dietary ?? '',
      accessibility: person.accessibility ?? '',
    })),
    trip_type: trip.trip_type,
    pace: trip.pace,
    currency: trip.currency,
    budget: trip.budget_minor === null ? '' : toInput(trip.budget_minor, trip.currency),
    interests: trip.interests.join(', '),
    notes: trip.notes ?? '',
    remind_prepare: trip.remind_prepare,
    mode: trip.mode,
  };
}

/** "beaches, food,, museums " -> ["beaches", "food", "museums"]. */
export function interestsOf(text: string): string[] {
  return text
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean);
}

/** Whether a reminder the day before the trip still has a day to come on: only while the trip's
 *  own today (its first destination's, else the person's `own` zone) is before its first day, as
 *  the server's rule. With no first day chosen yet, nothing says it can't. */
export function canRemind(
  values: { start_date: string; destinations: readonly { timezone: string }[] },
  own: string | undefined,
): boolean {
  // A zone the form leaves blank ('') is none: then the trip's today is the person's own.
  const zone = values.destinations[0]?.timezone;
  const today = tripToday({ destinations: [{ timezone: zone === '' ? null : zone }] }, own);
  return values.start_date === '' || today < values.start_date;
}

/** The reminder as it is saved: asked for, and still with a day to come on. What is shown and
 *  what is sent both follow it, from whichever step the dates last changed. */
export const remindOf = (values: TripValues, own: string | undefined) =>
  values.remind_prepare && canRemind(values, own);

/** A blank optional field is no value. */
const given = (text: string) => text.trim() || null;

/** The trip as the API takes it; `own` is the person's time zone (for the reminder's rule). */
export function bodyOf(values: TripValues, own: string | undefined): TripInput {
  return {
    title: values.title.trim(),
    destinations: values.destinations.map((place) => ({
      name: place.name.trim(),
      country: place.country.trim(),
      timezone: place.timezone || null,
    })),
    departure_city: given(values.departure_city),
    start_date: values.start_date,
    end_date: values.end_date,
    trip_type: values.trip_type,
    pace: values.pace,
    currency: values.currency,
    budget_minor: values.budget.trim() ? toMinor(values.budget, values.currency) : null,
    mode: values.mode,
    interests: interestsOf(values.interests),
    notes: given(values.notes),
    remind_prepare: remindOf(values, own),
    // A saved traveller keeps their id, so what names them (an item, a cost) still does.
    travellers: values.travellers.map((person) => ({
      ...(person.id ? { id: person.id } : {}),
      name: person.name.trim(),
      passport_country: given(person.passport_country),
      residence_country: given(person.residence_country),
      passport_expiry: person.passport_expiry || null,
      dietary: given(person.dietary),
      accessibility: given(person.accessibility),
    })),
  };
}
