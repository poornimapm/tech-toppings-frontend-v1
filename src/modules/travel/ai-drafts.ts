import type { ClientAction } from '@/core/agents/queries';
import { minorDigits } from '@/core/utils/money';
import type { Trip } from '@/modules/travel/api';
import type { DraftedActivity, DraftedItem } from '@/modules/travel/assist-api';
import type { ChangeValues } from '@/modules/travel/change-dialog';
import type { Activity, ChangeAction } from '@/modules/travel/plan-api';
import { daysIn } from '@/modules/travel/trip-words';

// The client tools whose actions carry a trip's AI drafts, one per task, and the one that opens a
// section of the trip (ask-trip's).
export const DAY_DRAFT = 'travel_day_draft';
export const ITEMS_DRAFT = 'travel_items_draft';
export const CHANGE_DRAFT = 'travel_change_draft';
export const OPEN = 'travel_open';

export const textOf = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
export const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
export const fieldsOf = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
export const oneOf = <T extends string>(choices: readonly T[], value: unknown): T | undefined =>
  choices.find((choice) => choice === value);
/** An amount an AI gave in the currency's main unit (as people say it, and as the AI is told it),
 *  in minor units as the app sends money, rounded half up as the server's own check of the draft
 *  rounds it (250.5 JPY is 251); null for what isn't an amount. */
export function minorOf(value: unknown, currency: string): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const minor = Math.round(value * 10 ** minorDigits(currency));
  return Number.isSafeInteger(minor) ? minor : null;
}

const TIME = /^\d{2}:\d{2}$/;
const CHANGES: readonly ChangeAction[] = ['done', 'skip', 'replace', 'reschedule'];
const SECTIONS = [
  'overview',
  'itinerary',
  'prepare',
  'packing',
  'budget',
  'bookings',
  'history',
] as const;
type Section = (typeof SECTIONS)[number];

/** Only the fields a draft may carry, from objects that name something: what an AI hands over is
 *  never taken for granted, and the preview checks the rest as it checks the person's own. */
function picked<T>(value: unknown, fields: readonly (keyof T & string)[]): T[] | null {
  const kept = listOf(value)
    .map(fieldsOf)
    .filter((each) => textOf(each.title))
    .map((each) =>
      Object.fromEntries(fields.filter((name) => name in each).map((name) => [name, each[name]])),
    );
  return kept.length ? (kept as T[]) : null;
}

/** The draft's arguments, when it is for this trip (and, given, this activity). */
function argumentsFor(action: ClientAction, tripId: string, activityId?: string) {
  const args = action.arguments;
  const mine =
    args.trip_id === tripId && (activityId === undefined || args.activity_id === activityId);
  return mine ? args : null;
}

/** An activity as plan-day drafts it: its cost, if any, in the trip's currency's main unit. */
type AiActivity = Omit<DraftedActivity, 'estimated_cost_minor'> & { estimated_cost?: unknown };

/** plan-day's activities for the day asked about, as the preview takes them (a cost in minor
 *  units), or null. */
export function dayDraftOf(
  action: ClientAction,
  trip: Pick<Trip, 'id' | 'currency'>,
  day: string,
): DraftedActivity[] | null {
  const args = argumentsFor(action, trip.id);
  if (args?.day !== day) return null;
  const drafted = picked<AiActivity>(args.activities, [
    'title',
    'kind',
    'start_time',
    'duration_minutes',
    'location',
    'transport',
    'notes',
    'estimated_cost',
  ]);
  return (
    drafted?.map(({ estimated_cost, ...activity }) => {
      const cost = minorOf(estimated_cost, trip.currency);
      return cost === null ? activity : { ...activity, estimated_cost_minor: cost };
    }) ?? null
  );
}

/** activity-checklist's items for the activity asked about, or null. */
export function itemsDraftOf(action: ClientAction, tripId: string, activityId: string) {
  const args = argumentsFor(action, tripId, activityId);
  return args && picked<DraftedItem>(args.items, ['title', 'bag', 'quantity']);
}

/** A change as update-trip drafted it, for the change dialog to open with. */
interface ChangeDraft {
  action: ChangeAction;
  values: Partial<ChangeValues>;
}

/**
 * update-trip's change to the activity asked about, as the change dialog's fields, or null. What
 * the dialog couldn't offer (a kind it doesn't list, a day outside the trip, a time it can't read)
 * is left for the person to choose.
 */
export function changeDraftOf(
  action: ClientAction,
  { trip, activity, kinds }: { trip: Trip; activity: Activity; kinds: readonly string[] },
): ChangeDraft | null {
  const change = fieldsOf(argumentsFor(action, trip.id, activity.id)?.change);
  const what = oneOf(CHANGES, change.action);
  if (!what) return null;
  const values: Partial<ChangeValues> = { note: textOf(change.actual_note) };
  const instead = fieldsOf(change.new_activity);
  if (what === 'replace') {
    values.title = textOf(instead.title);
    const kind = oneOf(kinds, instead.kind);
    if (kind) values.kind = kind;
    const time = textOf(instead.start_time);
    if (TIME.test(time)) values.time = time;
  }
  if (what === 'reschedule') {
    const day = oneOf(daysIn(trip), change.new_day);
    if (day) values.day = day;
    const time = textOf(change.new_start_time);
    if (TIME.test(time)) values.new_time = time;
  }
  return { action: what, values };
}

/** A section of the trip to open (and its day, for the itinerary or Prepare). */
interface Opened {
  section: Exclude<Section, 'overview'>;
  day: string | null;
}

/** ask-trip's section to open from the trip's Overview, or null (the Overview itself is open). */
export function openedOf(action: ClientAction, trip: Trip): Opened | null {
  const args = argumentsFor(action, trip.id);
  const section = oneOf(SECTIONS, args?.section);
  if (!section || section === 'overview') return null;
  return { section, day: oneOf(daysIn(trip), args?.day) ?? null };
}

/** Where an opened section is, from the trip's Overview. */
export function pathOf({ section, day }: Opened): string {
  if (section === 'itinerary' && day) return `itinerary?day=${day}`;
  if (section === 'prepare' && day) return `prepare?when=${day}`;
  return section;
}
