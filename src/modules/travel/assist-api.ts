import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import type { Language } from '@/core/i18n';
import { tripPath } from '@/modules/travel/api';

type Schemas = components['schemas'];
/** One of a trip's AI tasks (day, activity, change, ask), with what it needs. */
export type TripAssist = Omit<Schemas['TravelAssistIn'], 'locale'>;
export type DraftedActivity = Schemas['DraftedActivity'];
export type DraftedItem = Schemas['DraftedItem'];

/** A trip not made yet, in the person's words (describe-trip): answered at once (202) with the
 *  background run's id. Its draft fills the planning steps; nothing is saved by it. */
export const describeTrip = (text: string, locale: Language) =>
  unwrap(api.POST('/v1/travel/assist', { body: { text, locale } }));

/** AI help on a trip in Basic AI, answered at once (202) with the background run's id. The run
 *  writes nothing: its draft is applied, or not, by the person. */
export const assistTrip = (tripId: string, task: TripAssist, locale: Language) =>
  unwrap(
    api.POST('/v1/travel/trips/{trip_id}/assist', {
      ...tripPath(tripId),
      body: { ...task, locale },
    }),
  );

/** A day's drafted activities, after the day's own: a preview until `apply`, then one change
 *  that takes them all back. `ai_run_id` names the run that drafted them. */
export const draftDay = (tripId: string, body: Schemas['TravelDayDraftIn']) =>
  unwrap(api.POST('/v1/travel/trips/{trip_id}/activities/draft', { ...tripPath(tripId), body }));

/** An activity's drafted items, as the assistant's suggestions: a preview until `apply`. */
export const assistItems = (tripId: string, body: Schemas['TravelChecklistAssistIn']) =>
  unwrap(api.POST('/v1/travel/trips/{trip_id}/checklist/assist', { ...tripPath(tripId), body }));
