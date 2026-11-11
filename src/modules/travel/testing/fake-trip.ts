import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { addDays } from '@/core/utils/dates';
import { errorEnvelope, server } from '@/test/msw';

type Schemas = components['schemas'];
type Trip = Schemas['TravelTripOut'];
type Activity = Schemas['TravelActivityOut'];
type Item = Schemas['TravelChecklistOut'];
type Overview = Schemas['TravelOverviewOut'];
type RecordChange = Schemas['RecordChange'];
type Flag = Schemas['TravelFlag'];
type Booking = Schemas['TravelBookingOut'];
type Expense = Schemas['TravelExpenseOut'];
type Budget = Schemas['TravelBudgetOut'];
type TripEvent = Schemas['TravelEventOut'];

export const NOW = new Date('2026-11-06T06:00:00Z');
/** Today in Goa (the test user's own time zone, as the trip names none): its second day. */
export const TODAY = '2026-11-06';
const AT = '2026-11-01T10:00:00Z';

export const OPTIONS: Schemas['TravelOptions'] = {
  activity_kinds: ['sightseeing', 'beach', 'food', 'other'],
  max_trip_days: 120,
  max_destinations: 20,
  max_travellers: 20,
  max_interests: 20,
  premium_available: false,
  bags: ['check_in', 'cabin', 'handbag', 'day_bag', 'toiletry', 'electronics'],
  max_item_quantity: 99,
  expense_categories: ['food', 'other'],
};

export function tripOf(changes: Partial<Trip> = {}): Trip {
  return {
    id: 'goa',
    title: 'Goa with friends',
    destinations: [{ name: 'Goa', country: 'India', timezone: null }],
    departure_city: null,
    start_date: '2026-11-05',
    end_date: '2026-11-09',
    trip_type: 'friends',
    pace: 'balanced',
    budget_minor: null,
    currency: 'INR',
    mode: 'static',
    interests: [],
    notes: null,
    remind_prepare: false,
    travellers: [],
    phase: 'active',
    revision_no: 1,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

export function activityOf(changes: Partial<Activity> & { id: string; title: string }): Activity {
  return {
    trip_id: 'goa',
    day: TODAY,
    start_time: null,
    duration_minutes: null,
    kind: 'sightseeing',
    location: null,
    transport: null,
    notes: null,
    estimated_cost_minor: null,
    confirmed: false,
    booking_id: null,
    position: 0,
    status: 'planned',
    actual_note: null,
    revision_no: 1,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

export function itemOf(changes: Partial<Item> & { id: string; title: string }): Item {
  return {
    trip_id: 'goa',
    day: null,
    activity_id: null,
    traveller_id: null,
    state: 'not_started',
    source: 'user',
    edited: false,
    // As the server says it: a suggestion is one until it is renamed.
    as_suggested: changes.source === 'rule',
    bag: null,
    quantity: 1,
    suggestion_key: null,
    revision_no: 1,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

export function bookingOf(changes: Partial<Booking> & { id: string; title: string }): Booking {
  return {
    trip_id: 'goa',
    kind: 'hotel',
    reference: null,
    starts_at: null,
    ends_at: null,
    location: null,
    notes: null,
    link: null,
    status: 'entered',
    revision_no: 1,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

export function expenseOf(changes: Partial<Expense> & { id: string; title: string }): Expense {
  return {
    trip_id: 'goa',
    activity_id: null,
    kind: 'actual',
    category: 'food',
    amount_minor: 0,
    currency: 'INR',
    day: null,
    paid_by: null,
    shared_with: [],
    revision_no: 1,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

/** A budget as the server works it out: tests give the figures they need. */
export function budgetOf(changes: Partial<Budget> = {}): Budget {
  return {
    currency: 'INR',
    budget_minor: null,
    estimated_minor: 0,
    actual_minor: 0,
    remaining_minor: null,
    categories: [],
    unconverted: [],
    balances: [],
    settlements: [],
    ...changes,
  };
}

export function eventOf(changes: Partial<TripEvent> & { id: string; kind: string }): TripEvent {
  return {
    trip_id: 'goa',
    at: AT,
    summary: {},
    changes: [],
    undoable: true,
    undone_at: null,
    source: 'manual',
    ai_run_id: null,
    ...changes,
  };
}

/** The trip as the fake server keeps it; tests set it up, then read what the page did. */
export interface TripState {
  trip: Trip;
  activities: Activity[];
  items: Item[];
  /** What a request to suggest would add (each once, by its key). */
  suggestions: Item[];
  overview?: Partial<Overview>;
  /** The checklist's ticks find no network. */
  down?: boolean;
  bookings?: Booking[];
  expenses?: Expense[];
  /** What the budget answers: the server's sums, so the test's to give. */
  budget?: Budget;
  /** Changes made before the test, older than any it makes. */
  history?: TripEvent[];
  /** Undoing one of those, or of the test's, is refused with this code (something it touched
   *  changed since). */
  refuseUndo?: string;
  /** The trip is deleted (it answers 404 until brought back). */
  deleted?: boolean;
  /** The trip's activities can't be loaded (the server fails them). */
  activitiesFail?: boolean;
}

/** A request the page made: its method, path (with query) and body. */
export interface Sent {
  method: string;
  path: string;
  body: unknown;
  key: string | null;
}

interface Event {
  kind: string;
  summary: Record<string, unknown>;
  changes: RecordChange[];
  /** What takes it back; none for an undo, which can't be undone. */
  revert?: () => void;
  undone?: boolean;
  /** The AI run whose draft it applied: the event then says AI made it. */
  aiRunId?: unknown;
}

const json = HttpResponse.json.bind(HttpResponse);
const refuse = (status: number, code: string) => json(errorEnvelope(code, 'refused'), { status });
/** What a change sends besides the revision it was made on. */
const fieldsOf = (body: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(body).filter(([name]) => name !== 'revision_no'));
const timeline = (activities: Activity[]) =>
  [...activities].sort((a, b) => a.day.localeCompare(b.day) || a.position - b.position);

/**
 * Travel's routes for one trip, against `state`: enough of the server to drive the pages. Every
 * write answers the event it recorded, which takes it back (`event_id`, a removal's whole answer):
 * none for a tick, a mode switched alone, or one that changes nothing, as the server's.
 */
export function fakeTrip(state: TripState): Sent[] {
  const sent: Sent[] = [];
  const events = new Map<string, Event>();
  let made = 0;
  const next = (prefix: string) => `${prefix}-${String((made += 1))}`;

  const log = async (request: Request) => {
    const url = new URL(request.url);
    const text = await request.clone().text();
    const body: unknown = text ? JSON.parse(text) : null;
    sent.push({
      method: request.method,
      path: url.pathname.replace(/^\/api/, '') + url.search,
      body,
      key: request.headers.get('Idempotency-Key'),
    });
    return body as Record<string, unknown>;
  };
  /** Whatever a change touches, as it was: taking it back puts it all back. */
  const snapshot = () => {
    const before = structuredClone({
      activities: state.activities,
      items: state.items,
      bookings: state.bookings,
      expenses: state.expenses,
    });
    return () => {
      Object.assign(state, before);
    };
  };
  const remember = (
    kind: string,
    changes: RecordChange[],
    revert?: () => void,
    summary: Record<string, unknown> = {},
    aiRunId: unknown = null,
  ) => {
    const id = next('event');
    events.set(id, { kind, summary, changes, revert, aiRunId });
    return id;
  };
  /** One record made or removed, as its change says it. */
  const one = (entity: string, op: RecordChange['op'], record: { id: string; title: string }) => [
    { entity, op, record_id: record.id, title: record.title, day: null, fields: [] },
  ];
  const activity = (id: unknown) => state.activities.find((each) => each.id === id);
  /** A move to another day or time, as the server answers it (its items stay where they are). */
  const reschedule = (found: Activity, body: Record<string, unknown>) => {
    const day = typeof body.new_day === 'string' ? body.new_day : found.day;
    const time = typeof body.new_start_time === 'string' ? body.new_start_time : found.start_time;
    const fields = [
      ...(day === found.day ? [] : [{ field: 'day', old: found.day, new: day }]),
      ...(time === found.start_time
        ? []
        : [{ field: 'start_time', old: found.start_time, new: time }]),
    ];
    const what_changed: RecordChange[] = [
      { entity: 'activity', op: 'set', record_id: found.id, title: found.title, day, fields },
    ];
    const answer = {
      what_changed,
      needs_review: [],
      kept: [],
      days: [...new Set([found.day, day])],
    };
    if (!body.apply) return json({ ...answer, event_id: null });
    const revert = snapshot();
    Object.assign(found, { day, start_time: time, revision_no: found.revision_no + 1 });
    const summary = { title: found.title, day };
    const id = remember('activity_rescheduled', what_changed, revert, summary, body.ai_run_id);
    return json({ ...answer, event_id: id });
  };
  const item = (id: unknown) => state.items.find((each) => each.id === id);
  const booking = (id: unknown) => state.bookings?.find((each) => each.id === id);
  const expense = (id: unknown) => state.expenses?.find((each) => each.id === id);

  server.use(
    http.get('*/api/v1/travel/options', () => json(OPTIONS)),
    http.get('*/api/v1/travel/trips', () =>
      json({ items: [state.trip], page: 1, page_size: 20, total: 1, has_next: false }),
    ),
    http.get('*/api/v1/travel/trips/:id', () =>
      state.deleted ? refuse(404, 'NOT_FOUND') : json(state.trip),
    ),
    // A mode switched alone records nothing, as the server's: there is nothing to undo.
    http.patch('*/api/v1/travel/trips/:id', async ({ request }) => {
      const body = await log(request);
      if (body.revision_no !== state.trip.revision_no) return refuse(409, 'VERSION_CONFLICT');
      const before = structuredClone(state.trip);
      const moded = Object.keys(fieldsOf(body)).every((name) => name === 'mode');
      Object.assign(state.trip, fieldsOf(body), { revision_no: state.trip.revision_no + 1 });
      const revert = () => {
        state.trip = before;
      };
      const summary = { title: state.trip.title };
      return json({
        ...state.trip,
        event_id: moded ? null : remember('trip_edited', [], revert, summary),
      });
    }),
    http.delete('*/api/v1/travel/trips/:id', async ({ request }) => {
      await log(request);
      state.deleted = true;
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/v1/travel/trips/:id/undelete', async ({ request }) => {
      await log(request);
      const back = state.deleted ? remember('trip_restored', [], undefined, {}) : null;
      state.deleted = false;
      return json({ ...state.trip, event_id: back });
    }),
    http.get('*/api/v1/travel/trips/:id/overview', () =>
      json({
        trip_id: state.trip.id,
        today: TODAY,
        phase: 'active',
        days_to_start: -1,
        day_number: 2,
        trip_days: 5,
        next_activities: timeline(state.activities).filter((each) => each.status === 'planned'),
        pending: { checklist: 0, packing: 0, bookings: 0 },
        readiness: null,
        next_action: { action: 'add_activities', reason: 'no_activities', params: {} },
        ...state.overview,
      } satisfies Overview),
    ),
    http.get('*/api/v1/travel/trips/:id/activities', () =>
      state.activitiesFail ? refuse(500, 'INTERNAL_ERROR') : json(timeline(state.activities)),
    ),
    http.post('*/api/v1/travel/trips/:id/activities', async ({ request }) => {
      const body = await log(request);
      const day = state.activities.filter((each) => each.day === body.day);
      const revert = snapshot();
      const added = activityOf({
        ...(body as Partial<Activity>),
        id: next('activity'),
        title: String(body.title),
        position: day.length,
      });
      state.activities.push(added);
      const recorded = remember('activity_added', one('activity', 'add', added), revert, {
        title: added.title,
      });
      return json({ ...added, event_id: recorded }, { status: 201 });
    }),
    // As the server's: only those whose place changes are written, and the event (none if
    // nothing moved) is answered with every activity of the day.
    http.post('*/api/v1/travel/trips/:id/activities/reorder', async ({ request }) => {
      const body = (await log(request)) as { day: string; activity_ids: string[] };
      const revert = snapshot();
      const moved: Activity[] = [];
      body.activity_ids.forEach((id, position) => {
        const found = activity(id);
        if (!found || found.position === position) return;
        Object.assign(found, { position, revision_no: found.revision_no + 1 });
        moved.push(found);
      });
      const changes = moved.flatMap((each) => one('activity', 'set', each));
      const recorded = moved.length
        ? remember('activities_reordered', changes, revert, { day: body.day })
        : null;
      const day = timeline(state.activities).filter((each) => each.day === body.day);
      return json(day.map((each) => ({ ...each, event_id: recorded })));
    }),
    // An edit that changes nothing records nothing, as the server's.
    http.patch('*/api/v1/travel/activities/:id', async ({ request, params }) => {
      const body = await log(request);
      const found = activity(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (body.revision_no !== found.revision_no) return refuse(409, 'VERSION_CONFLICT');
      const asked = Object.entries(fieldsOf(body));
      if (asked.every(([name, value]) => found[name as keyof Activity] === value)) {
        return json({ ...found, event_id: null });
      }
      const revert = snapshot();
      Object.assign(found, fieldsOf(body), { revision_no: found.revision_no + 1 });
      const recorded = remember('activity_edited', one('activity', 'set', found), revert, {
        title: found.title,
      });
      return json({ ...found, event_id: recorded });
    }),
    http.delete('*/api/v1/travel/activities/:id', async ({ request, params }) => {
      await log(request);
      const found = activity(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      const revert = snapshot();
      state.activities = state.activities.filter((each) => each !== found);
      const recorded = remember('activity_deleted', one('activity', 'remove', found), revert, {
        title: found.title,
      });
      return json({ event_id: recorded });
    }),
    // Done or skipped (a replacement too), as the server does it: the activity's own items stand
    // down unless they are the person's own work, and an estimate is listed for review.
    http.post('*/api/v1/travel/activities/:id/change', async ({ request, params }) => {
      const body = await log(request);
      const found = activity(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (body.revision_no !== found.revision_no) return refuse(409, 'VERSION_CONFLICT');
      if (body.action === 'reschedule') return reschedule(found, body);
      const away = body.action !== 'done';
      const status = away ? 'skipped' : 'done';
      const tied = away ? state.items.filter((each) => each.activity_id === found.id) : [];
      const own = (each: Item) => each.state === 'completed' || each.edited;
      // A suggestion still as its rule words it says so by its key (a tick keeps it so).
      const kept: Flag[] = tied.filter(own).map((each) => ({
        entity: 'checklist',
        record_id: each.id,
        title: each.title,
        reason: each.state === 'completed' ? 'completed' : 'edited',
        suggestion_key: each.as_suggested ? each.suggestion_key : null,
      }));
      const standing = tied.filter((each) => !own(each));
      const needs_review: Flag[] =
        away && found.estimated_cost_minor !== null
          ? [{ entity: 'activity', record_id: found.id, title: found.title, reason: 'estimate' }]
          : [];
      const what_changed: RecordChange[] = [
        {
          entity: 'activity',
          op: 'set',
          record_id: found.id,
          title: found.title,
          day: found.day,
          fields: [{ field: 'status', old: 'planned', new: status }],
        },
        ...standing.map((each) => ({
          entity: 'checklist',
          op: 'set' as const,
          record_id: each.id,
          title: each.title,
          day: each.day,
          fields: [{ field: 'state', old: each.state, new: 'not_applicable' }],
        })),
      ];
      const answer = { what_changed, needs_review, kept, days: [found.day] };
      if (!body.apply) return json({ ...answer, event_id: null });
      const revert = snapshot();
      Object.assign(found, {
        status,
        actual_note: body.actual_note ?? null,
        revision_no: found.revision_no + 1,
      });
      for (const each of standing) {
        Object.assign(each, { state: 'not_applicable', revision_no: each.revision_no + 1 });
      }
      const summary = { title: found.title, day: found.day };
      const id = remember(`activity_${status}`, what_changed, revert, summary, body.ai_run_id);
      return json({ ...answer, event_id: id });
    }),
    // AI help, on a trip in Basic AI only (as the server checks it): the run's answers are the
    // test's to serve (`serveRun`).
    http.post('*/api/v1/travel/trips/:id/assist', async ({ request }) => {
      await log(request);
      if (state.trip.mode !== 'basic') {
        return json(errorEnvelope('TRAVEL_AI_OFF', 'refused', { mode: state.trip.mode }), {
          status: 409,
        });
      }
      return json({ run_id: next('run') }, { status: 202 });
    }),
    // A day's draft goes after the day's own, as one change.
    http.post('*/api/v1/travel/trips/:id/activities/draft', async ({ request }) => {
      const body = (await log(request)) as {
        day: string;
        activities: Partial<Activity>[];
        apply: boolean;
        ai_run_id?: string;
      };
      const first = state.activities.filter((each) => each.day === body.day).length;
      const drafted = body.activities.map((each, place) =>
        activityOf({
          ...each,
          id: next('activity'),
          title: String(each.title),
          day: body.day,
          position: first + place,
        }),
      );
      const what_changed: RecordChange[] = drafted.map((each) => ({
        entity: 'activity',
        op: 'add',
        record_id: body.apply ? each.id : null,
        title: each.title,
        day: each.day,
        fields: [
          { field: 'kind', new: each.kind },
          ...(each.start_time ? [{ field: 'start_time', new: each.start_time }] : []),
          ...(each.estimated_cost_minor === null
            ? []
            : [{ field: 'estimated_cost_minor', new: each.estimated_cost_minor }]),
        ],
      }));
      const answer = { what_changed, needs_review: [], kept: [], days: [body.day] };
      if (!body.apply) return json({ ...answer, event_id: null });
      const revert = snapshot();
      state.activities.push(...drafted);
      const summary = { day: body.day, count: drafted.length };
      const id = remember('day_drafted', what_changed, revert, summary, body.ai_run_id);
      return json({ ...answer, event_id: id });
    }),
    // An activity's AI items, as the assistant's suggestions: one already there isn't added again.
    http.post('*/api/v1/travel/trips/:id/checklist/assist', async ({ request }) => {
      const body = (await log(request)) as {
        activity_id: string;
        items: { title: string; bag?: Item['bag']; quantity?: number }[];
        apply: boolean;
        ai_run_id?: string;
      };
      const found = activity(body.activity_id);
      if (!found) return refuse(422, 'TRAVEL_ACTIVITY_UNKNOWN');
      const taken = new Set(state.items.map((each) => each.suggestion_key));
      const fresh = body.items
        .map((each) =>
          itemOf({
            id: next('item'),
            title: each.title,
            day: found.day,
            activity_id: found.id,
            bag: each.bag ?? null,
            quantity: each.quantity ?? 1,
            source: 'assistant',
            suggestion_key: `ai:${found.id}:${each.title.toLowerCase().replaceAll(' ', '_')}`,
          }),
        )
        .filter((each) => !taken.has(each.suggestion_key));
      const what_changed: RecordChange[] = fresh.map((each) => ({
        entity: 'checklist',
        op: 'add',
        record_id: body.apply ? each.id : null,
        title: each.title,
        day: each.day,
        fields: [
          ...(each.bag ? [{ field: 'bag', new: each.bag }] : []),
          { field: 'quantity', new: each.quantity },
          { field: 'suggestion_key', new: each.suggestion_key },
        ],
      }));
      const answer = { what_changed, needs_review: [], kept: [], days: [], more: false };
      if (!body.apply) return json({ ...answer, event_id: null });
      const revert = snapshot();
      state.items.push(...fresh);
      const summary = { count: fresh.length, title: found.title, day: found.day };
      const id = remember('checklist_ai_suggested', what_changed, revert, summary, body.ai_run_id);
      return json({ ...answer, event_id: id });
    }),
    // Newest first: those the test made, then those it started with.
    http.get('*/api/v1/travel/trips/:id/events', () => {
      const made = [...events].reverse().map(([id, event]) => ({
        id,
        trip_id: state.trip.id,
        at: NOW.toISOString(),
        kind: event.kind,
        summary: event.summary,
        changes: event.changes,
        undoable: Boolean(event.revert) && !event.undone,
        undone_at: event.undone ? NOW.toISOString() : null,
        source: event.aiRunId ? 'ai' : 'manual',
        ai_run_id: event.aiRunId ?? null,
      }));
      const items = [...made, ...(state.history ?? [])];
      return json({ items, page: 1, page_size: 20, total: items.length, has_next: false });
    }),
    // An undo is an event too, and can't itself be undone.
    http.post('*/api/v1/travel/events/:id/undo', async ({ request, params }) => {
      await log(request);
      const id = String(params.id);
      const event = events.get(id);
      const earlier = state.history?.find((each) => each.id === id);
      if ((earlier ?? event) && state.refuseUndo) return refuse(409, state.refuseUndo);
      if (earlier?.undoable) {
        Object.assign(earlier, { undoable: false, undone_at: NOW.toISOString() });
      } else if (event?.revert && !event.undone) {
        event.revert();
        event.undone = true;
      } else {
        return refuse(409, 'TRAVEL_UNDO_DONE');
      }
      const undid = event ?? { kind: earlier?.kind ?? '', summary: earlier?.summary ?? {} };
      const summary = { ...undid.summary, undid: undid.kind, event_id: id };
      return json({
        id: remember('undo', [], undefined, summary),
        trip_id: state.trip.id,
        at: NOW.toISOString(),
        kind: 'undo',
        summary,
        changes: [],
        undoable: false,
        undone_at: null,
        source: 'manual', // an undo is the person's own, whatever it took back
        ai_run_id: null,
      });
    }),
    http.get('*/api/v1/travel/trips/:id/checklist', () => json(state.items)),
    http.post('*/api/v1/travel/trips/:id/checklist', async ({ request }) => {
      const body = await log(request);
      const revert = snapshot();
      const added = itemOf({
        ...(body as Partial<Item>),
        id: next('item'),
        title: String(body.title),
      });
      state.items.push(added);
      const recorded = remember('checklist_added', one('checklist', 'add', added), revert, {
        title: added.title,
      });
      return json({ ...added, event_id: recorded }, { status: 201 });
    }),
    // A tick records no event, as the server's: only an edit can be undone.
    http.patch('*/api/v1/travel/checklist/:id', async ({ request, params }) => {
      if (state.down) return HttpResponse.error();
      const body = await log(request);
      const found = item(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (body.revision_no && body.revision_no !== found.revision_no) {
        return refuse(409, 'VERSION_CONFLICT');
      }
      const tick = Object.keys(fieldsOf(body)).every((name) => name === 'state');
      const revert = snapshot();
      // Any change makes it the person's own; only a new name makes it their words too.
      const renamed = 'title' in body ? { as_suggested: false } : {};
      Object.assign(found, fieldsOf(body), renamed, {
        edited: true,
        revision_no: found.revision_no + 1,
      });
      const summary = { title: found.title };
      const recorded = tick
        ? null
        : remember('checklist_edited', one('checklist', 'set', found), revert, summary);
      return json({ ...found, event_id: recorded });
    }),
    http.delete('*/api/v1/travel/checklist/:id', async ({ request, params }) => {
      await log(request);
      const found = item(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      const revert = snapshot();
      state.items = state.items.filter((each) => each !== found);
      const removed: RecordChange = {
        entity: 'checklist',
        op: 'remove',
        record_id: found.id,
        title: found.title,
        day: found.day,
        fields: [],
      };
      const summary = { title: found.title, day: found.day };
      return json({ event_id: remember('checklist_removed', [removed], revert, summary) });
    }),
    http.post('*/api/v1/travel/trips/:id/checklist/suggest', async ({ request }) => {
      const body = await log(request);
      const taken = new Set(state.items.map((each) => each.suggestion_key));
      const fresh = state.suggestions.filter(
        (each) =>
          !taken.has(each.suggestion_key) &&
          (!body.packing || each.bag !== null) &&
          (!body.activity_id || each.activity_id === body.activity_id),
      );
      const what_changed: RecordChange[] = fresh.map((each) => ({
        entity: 'checklist',
        op: 'add',
        record_id: body.apply ? each.id : null,
        title: each.title,
        day: each.day,
        fields: [
          ...(each.bag ? [{ field: 'bag', new: each.bag }] : []),
          { field: 'quantity', new: each.quantity },
          { field: 'suggestion_key', new: each.suggestion_key },
        ],
      }));
      const answer = { what_changed, needs_review: [], kept: [], days: [], more: false };
      if (!body.apply) return json({ ...answer, event_id: null });
      const revert = snapshot();
      state.items.push(...fresh);
      const summary = { count: fresh.length, packing: body.packing, day: body.day ?? null };
      const id = remember('checklist_suggested', what_changed, revert, summary);
      return json({ ...answer, event_id: id });
    }),
    http.get('*/api/v1/travel/trips/:id/bookings', () => json(state.bookings ?? [])),
    http.post('*/api/v1/travel/trips/:id/bookings', async ({ request }) => {
      const body = await log(request);
      const revert = snapshot();
      const added = bookingOf({
        ...(body as Partial<Booking>),
        id: next('booking'),
        title: String(body.title),
      });
      state.bookings = [...(state.bookings ?? []), added];
      const summary = { title: added.title };
      const recorded = remember('booking_added', one('booking', 'add', added), revert, summary);
      return json({ ...added, event_id: recorded }, { status: 201 });
    }),
    http.patch('*/api/v1/travel/bookings/:id', async ({ request, params }) => {
      const body = await log(request);
      const found = booking(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (body.revision_no !== found.revision_no) return refuse(409, 'VERSION_CONFLICT');
      const revert = snapshot();
      Object.assign(found, fieldsOf(body), { revision_no: found.revision_no + 1 });
      const summary = { title: found.title };
      const recorded = remember('booking_edited', one('booking', 'set', found), revert, summary);
      return json({ ...found, event_id: recorded });
    }),
    // Refused while an activity goes with it, as the server does.
    http.delete('*/api/v1/travel/bookings/:id', async ({ request, params }) => {
      await log(request);
      const found = booking(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (state.activities.some((each) => each.booking_id === found.id)) {
        return refuse(409, 'TRAVEL_BOOKING_IN_USE');
      }
      const revert = snapshot();
      state.bookings = state.bookings?.filter((each) => each !== found);
      const summary = { title: found.title };
      return json({
        event_id: remember('booking_removed', one('booking', 'remove', found), revert, summary),
      });
    }),
    http.get('*/api/v1/travel/trips/:id/expenses', () => json(state.expenses ?? [])),
    http.post('*/api/v1/travel/trips/:id/expenses', async ({ request }) => {
      const body = await log(request);
      const revert = snapshot();
      const added = expenseOf({
        ...(body as Partial<Expense>),
        id: next('expense'),
        title: String(body.title),
      });
      state.expenses = [...(state.expenses ?? []), added];
      const summary = { title: added.title };
      const recorded = remember('expense_added', one('expense', 'add', added), revert, summary);
      return json({ ...added, event_id: recorded }, { status: 201 });
    }),
    http.patch('*/api/v1/travel/expenses/:id', async ({ request, params }) => {
      const body = await log(request);
      const found = expense(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      if (body.revision_no !== found.revision_no) return refuse(409, 'VERSION_CONFLICT');
      const revert = snapshot();
      Object.assign(found, fieldsOf(body), { revision_no: found.revision_no + 1 });
      const summary = { title: found.title };
      const recorded = remember('expense_edited', one('expense', 'set', found), revert, summary);
      return json({ ...found, event_id: recorded });
    }),
    http.delete('*/api/v1/travel/expenses/:id', async ({ request, params }) => {
      await log(request);
      const found = expense(params.id);
      if (!found) return refuse(404, 'NOT_FOUND');
      const revert = snapshot();
      state.expenses = state.expenses?.filter((each) => each !== found);
      const summary = { title: found.title };
      return json({
        event_id: remember('expense_removed', one('expense', 'remove', found), revert, summary),
      });
    }),
    http.get('*/api/v1/travel/trips/:id/budget', () => json(state.budget ?? budgetOf())),
    http.get('*/api/v1/travel/trips/:id/prepare', ({ request }) => {
      const when = new URL(request.url).searchParams.get('when') ?? 'today';
      const day = when === 'tomorrow' ? addDays(TODAY, 1) : when === 'today' ? TODAY : when;
      const activities = timeline(state.activities).filter((each) => each.day === day);
      // Every day still holding an item to do, packing ones too, in order.
      const open = state.items.flatMap((each) =>
        each.day && (each.state === 'not_started' || each.state === 'in_progress')
          ? [each.day]
          : [],
      );
      return json({
        day,
        within_trip: state.trip.start_date <= day && day <= state.trip.end_date,
        activities,
        checklist: state.items.filter((each) => each.day === day),
        open_days: [...new Set(open)].sort((a, b) => a.localeCompare(b)),
        bookings: [],
        transport: activities
          .filter((each) => each.transport)
          .map(({ id, title, kind, start_time, location, transport }) => ({
            activity_id: id,
            title,
            kind,
            start_time,
            location,
            transport,
          })),
      });
    }),
  );
  return sent;
}
