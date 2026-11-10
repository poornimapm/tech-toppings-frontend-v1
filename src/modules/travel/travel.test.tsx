import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { textFor } from '@/core/modules/module-text';
import type { Options, Overview, Trip, TripInput } from '@/modules/travel/api';
import manifest from '@/modules/travel/manifest';
import { errorEnvelope, moduleView, resetModuleState, server, testModules } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-11-06T06:00:00Z');
const TODAY = '2026-11-06';
const AT = '2026-11-01T10:00:00Z';
/** A traveller's details past their passport country, none given. */
const NOTHING_MORE = {
  residence_country: null,
  passport_expiry: null,
  dietary: null,
  accessibility: null,
};
const OPTIONS: Options = {
  activity_kinds: ['sightseeing', 'other'],
  max_trip_days: 120,
  max_destinations: 20,
  max_travellers: 20,
  max_interests: 20,
  premium_available: false,
  bags: ['check_in', 'cabin'],
  max_item_quantity: 99,
  expense_categories: ['food', 'other'],
};

let trips: Trip[];
let overviews: Map<string, Overview>;
let sent: { body: TripInput; key: string | null }[];
let refusal: { code: string; status: number } | null;

function trip(changes: Partial<Trip>): Trip {
  return {
    id: 'trip-1',
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

function overview(changes: Partial<Overview>): Overview {
  return {
    trip_id: 'trip-1',
    today: TODAY,
    phase: 'upcoming',
    days_to_start: 14,
    day_number: null,
    trip_days: 5,
    next_activities: [],
    pending: { checklist: 0, packing: 0, bookings: 0 },
    readiness: null,
    next_action: { action: 'add_activities', reason: 'no_activities', params: {} },
    ...changes,
  };
}

/** The module's routes, against trips kept here; the phase filter as the server's. */
function fakeApi() {
  server.use(
    http.get('*/api/v1/travel/options', () => HttpResponse.json(OPTIONS)),
    http.get('*/api/v1/travel/trips', ({ request }) => {
      const phase = new URL(request.url).searchParams.get('phase');
      const shown = trips.filter((one) => !phase || one.phase === phase);
      return HttpResponse.json({
        items: shown,
        page: 1,
        page_size: 20,
        total: shown.length,
        has_next: false,
      });
    }),
    http.get('*/api/v1/travel/trips/:id/overview', ({ params }) =>
      HttpResponse.json(
        overviews.get(String(params.id)) ?? overview({ trip_id: String(params.id) }),
      ),
    ),
    http.post('*/api/v1/travel/trips', async ({ request }) => {
      const body = (await request.json()) as TripInput;
      sent.push({ body, key: request.headers.get('Idempotency-Key') });
      if (refusal) {
        return HttpResponse.json(errorEnvelope(refusal.code, 'refused'), {
          status: refusal.status,
        });
      }
      const made = trip({
        ...body,
        id: `trip-${String(trips.length + 1)}`,
        currency: body.currency ?? 'INR',
        departure_city: body.departure_city ?? null,
        budget_minor: body.budget_minor ?? null,
        notes: body.notes ?? null,
        interests: body.interests ?? [],
        destinations: body.destinations.map((place) => ({
          ...place,
          timezone: place.timezone ?? null,
        })),
        travellers: (body.travellers ?? []).map((person, index) => ({
          ...person,
          id: `t${String(index + 1)}`,
        })),
        phase: 'upcoming',
      });
      trips = [...trips, made];
      // As the server's: with the event its making recorded.
      return HttpResponse.json({ ...made, event_id: `made-${made.id}` }, { status: 201 });
    }),
  );
}

beforeAll(async () => {
  await import('@/modules/travel/travel-layout');
  await import('@/modules/travel/home-page');
  await import('@/modules/travel/trips-page');
  await import('@/modules/travel/new-trip-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  trips = [];
  overviews = new Map();
  sent = [];
  refusal = null;
  fakeApi();
  resetModuleState([
    ...testModules,
    moduleView('travel', testModules.length, { status: 'beta', available: true }),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the travel manifest', () => {
  it('mounts the sections built so far under one frame', async () => {
    const frame = manifest.routes?.[0];
    expect(manifest.key).toBe('travel');
    const paths = (routes: typeof frame) =>
      routes?.children?.map((route) => (route.index ? '' : route.path));
    expect(paths(frame)).toEqual(['', 'trips', 'new', 'trips/:id']);
    // A trip's tabs: only the sections built so far.
    expect(paths(frame?.children?.at(-1))).toEqual([
      '',
      'itinerary',
      'prepare',
      'packing',
      'budget',
      'bookings',
      'history',
    ]);

    renderApp('/m/travel/trips');
    const tabs = await screen.findByRole('navigation', { name: 'Travel' });
    expect(within(tabs).getByRole('link', { name: 'My trips' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'My trips']);
  });

  it('words everything the server notes for it outside its pages', () => {
    const strings = textFor(manifest, 'en');
    const codes = [
      'travel.trip_added',
      'travel.trip_updated',
      'travel.trip_deleted',
      'travel.trip_restored',
      'travel.booking_added',
      'travel.expense_added',
      'travel.trip_active',
      'travel.trip_upcoming',
      'travel.prepare_due',
    ];
    expect(Object.keys(strings.feed ?? {}).sort()).toEqual(codes.sort());
    expect(strings.stats).toEqual({ items: 'trips ahead' });
    expect(strings.widgets).toEqual({ travel_next_trip: 'Next trip' });
    expect(strings.search).toEqual({ trip: 'Trip' });
  });
});

describe('Travel home', () => {
  it('says when no trip is ahead and offers to plan one, with no detectable accessibility violations', async () => {
    trips = [trip({ id: 'old', title: 'Ooty', phase: 'past' })];
    const { container } = renderApp('/m/travel');

    expect(await screen.findByText('No trips ahead. Plan your next one.')).toBeInTheDocument();
    expect(screen.getByText('Hi Asha, where to next?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plan a trip' })).toHaveAttribute(
      'href',
      '/m/travel/new',
    );
    expect(screen.queryByText('Ooty')).not.toBeInTheDocument();
    // No trip ahead: nothing to prepare or pack for, so no way in to it is offered.
    expect(screen.queryByRole('link', { name: /^Prepare tomorrow/ })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the trip under way and those coming up, each with its countdown, real readiness and next step', async () => {
    trips = [
      trip({ id: 'goa', title: 'Goa with friends', travellers: [] }),
      trip({
        id: 'kochi',
        title: 'Kochi',
        destinations: [{ name: 'Kochi', country: 'India', timezone: 'Asia/Kolkata' }],
        start_date: '2026-11-26',
        end_date: '2026-11-28',
        trip_type: 'other',
        mode: 'basic',
        phase: 'upcoming',
        travellers: [
          { id: 't1', name: 'Asha', passport_country: 'India' },
          { id: 't2', name: 'Ravi' },
        ],
      }),
    ];
    overviews.set(
      'goa',
      overview({
        trip_id: 'goa',
        phase: 'active',
        days_to_start: -1,
        day_number: 2,
        readiness: { completed: 1, applicable: 4, ratio: 0.25 },
        next_action: {
          action: 'prepare_today',
          reason: 'open_today',
          params: { day: TODAY, open: 3 },
        },
      }),
    );
    overviews.set('kochi', overview({ trip_id: 'kochi', days_to_start: 20, trip_days: 3 }));
    renderApp('/m/travel');

    const goa = await screen.findByRole('article', { name: 'Goa with friends' });
    expect(await within(goa).findByText('Day 2 of 5')).toBeInTheDocument();
    expect(within(goa).getByText('25% ready')).toBeInTheDocument();
    expect(within(goa).getByRole('meter', { name: 'Readiness' })).toHaveAttribute(
      'aria-valuetext',
      '25% ready: 1 of 4 tasks done',
    );
    expect(within(goa).getByText(/^Next: get ready for today\./).parentElement).toHaveTextContent(
      'Next: get ready for today. 3 tasks are still open for today.',
    );
    expect(within(goa).getByText('With friends')).toBeInTheDocument();
    expect(within(goa).getByText('No travellers added')).toBeInTheDocument();

    const kochi = screen.getByRole('article', { name: 'Kochi' });
    expect(await within(kochi).findByText('Starts in 20 days')).toBeInTheDocument();
    // No tasks: no figure at all, never a made-up one.
    expect(within(kochi).getByText('No tasks yet')).toBeInTheDocument();
    expect(within(kochi).queryByRole('meter')).not.toBeInTheDocument();
    expect(within(kochi).getByText('2 travellers')).toBeInTheDocument();
    expect(within(kochi).getByText('Basic AI')).toBeInTheDocument();
    expect(within(kochi).getByText(/^Next: add activities\./).parentElement).toHaveTextContent(
      'Next: add activities. Nothing is planned for it yet.',
    );
    expect(screen.getByRole('heading', { name: 'Under way' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
    // Quick ways in to the trip under way.
    const quick = screen.getByRole('region', { name: 'Quick actions' });
    expect(
      within(quick).getByRole('link', { name: 'Prepare tomorrow: Goa with friends' }),
    ).toHaveAttribute('href', '/m/travel/trips/goa/prepare?when=tomorrow');
    expect(within(quick).getByRole('link', { name: 'Packing: Goa with friends' })).toHaveAttribute(
      'href',
      '/m/travel/trips/goa/packing',
    );
  });

  it("says when the trips couldn't be loaded, and tries again", async () => {
    let failing = true;
    server.use(
      http.get('*/api/v1/travel/trips', () =>
        failing
          ? HttpResponse.json(errorEnvelope('UNKNOWN', 'down'), { status: 500 })
          : HttpResponse.json({ items: [], page: 1, page_size: 20, total: 0, has_next: false }),
      ),
    );
    const { user } = renderApp('/m/travel');

    expect(await screen.findByText("Your trips couldn't be loaded.")).toBeInTheDocument();
    failing = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No trips ahead. Plan your next one.')).toBeInTheDocument();
  });
});

describe('My trips', () => {
  it('lists every trip, and those of one phase kept in the address', async () => {
    trips = [
      trip({ id: 'goa', title: 'Goa with friends' }),
      trip({ id: 'ooty', title: 'Ooty', phase: 'past' }),
    ];
    const { user, router } = renderApp('/m/travel/trips');

    expect(await screen.findByRole('article', { name: 'Goa with friends' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Ooty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plan a trip' })).toHaveAttribute(
      'href',
      '/m/travel/new',
    );

    await user.click(screen.getByRole('button', { name: 'Past' }));
    await waitFor(() => {
      expect(screen.queryByRole('article', { name: 'Goa with friends' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('article', { name: 'Ooty' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?phase=past');

    await user.click(screen.getByRole('button', { name: 'Under way' }));
    await user.click(screen.getByRole('button', { name: 'Coming up' }));
    expect(await screen.findByText('No trips coming up.')).toBeInTheDocument();
  });
});

/** Fills the first step with a trip to Goa, 20 to 24 November. */
async function fillPlace(user: ReturnType<typeof renderApp>['user'], title = 'Goa with friends') {
  await user.type(await screen.findByRole('textbox', { name: /Trip name/ }), title);
  await user.type(screen.getByRole('textbox', { name: 'Place' }), 'Goa');
  await user.type(screen.getByRole('textbox', { name: 'Country' }), 'India');
  fireEvent.change(screen.getByLabelText('First day'), { target: { value: '2026-11-20' } });
  fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-11-24' } });
}

const next = (user: ReturnType<typeof renderApp>['user']) =>
  user.click(screen.getByRole('button', { name: 'Next' }));

/** On from the first step, through these, each as it shows. */
async function through(user: ReturnType<typeof renderApp>['user'], steps: string[]) {
  for (const step of steps) {
    await next(user);
    await screen.findByRole('heading', { name: step });
  }
}

describe('planning a trip', () => {
  it('asks each traveller for more only if they want it kept, and saves it as theirs', async () => {
    const { user } = renderApp('/m/travel/new');
    await fillPlace(user);
    await through(user, ["Who's going"]);
    await user.click(screen.getByRole('button', { name: 'Add someone' }));
    await user.keyboard('Meena');
    const more = screen.getByText('More about them (optional)');
    expect(more.closest('details')).not.toHaveAttribute('open'); // folded away until asked for
    await user.click(more);
    await user.type(
      screen.getByRole('textbox', { name: 'Country they live in (optional)' }),
      'UAE',
    );
    await user.type(screen.getByRole('textbox', { name: 'Food needs (optional)' }), 'Vegetarian');
    fireEvent.change(screen.getByLabelText('Passport valid until (optional)'), {
      target: { value: '2030-03-01' },
    });
    await through(user, ['Style and budget', 'How the app helps', 'Check and save']);

    expect(
      within(screen.getByRole('region', { name: "Who's going" })).getByText(
        'Meena (lives in UAE; passport valid until Mar 1, 2030; food: Vegetarian)',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save the trip' }));
    await waitFor(() => {
      expect(sent).toHaveLength(1);
    });
    expect(sent[0]?.body.travellers).toEqual([
      {
        name: 'Meena',
        passport_country: null,
        residence_country: 'UAE',
        passport_expiry: '2030-03-01',
        dietary: 'Vegetarian',
        accessibility: null,
      },
    ]);
  });

  it('turns the reminder off, and says why, for a trip that starts today', async () => {
    const { user } = renderApp('/m/travel/new');
    await fillPlace(user);
    fireEvent.change(screen.getByLabelText('First day'), { target: { value: TODAY } });
    await through(user, ["Who's going", 'Style and budget']);

    const remind = screen.getByRole('switch', { name: 'Remind me the day before it starts' });
    expect(remind).toBeDisabled();
    expect(remind).toHaveAttribute('aria-checked', 'false');
    expect(remind).toHaveAccessibleDescription(
      "It starts today or has started, so there's no day before it left to remind you on.",
    );
  });

  it('saves no reminder once the first day is moved to today from the check, and says why', async () => {
    const { user } = renderApp('/m/travel/new');
    await fillPlace(user);
    await through(user, ["Who's going", 'Style and budget']);
    await user.click(screen.getByRole('switch', { name: 'Remind me the day before it starts' }));
    await through(user, ['How the app helps', 'Check and save']);
    const style = () => screen.getByRole('region', { name: 'Style and budget' });
    expect(within(style()).getByText('The day before it starts')).toBeInTheDocument();

    // Straight there and back from the check: the style step is never shown on the way.
    await user.click(screen.getByRole('button', { name: 'Edit Where and when' }));
    fireEvent.change(await screen.findByLabelText('First day'), { target: { value: TODAY } });
    await user.click(screen.getByRole('button', { name: 'Back to the check' }));
    await screen.findByRole('heading', { name: 'Check and save' });

    expect(
      within(style()).getByText(
        "None · It starts today or has started, so there's no day before it left to remind you on.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save the trip' }));
    await waitFor(() => {
      expect(sent).toHaveLength(1);
    });
    expect(sent[0]?.body).toMatchObject({ start_date: TODAY, remind_prepare: false });
  });

  it('keeps what more is said of a traveller open while they type and clear it', async () => {
    const { user } = renderApp('/m/travel/new');
    await fillPlace(user);
    await through(user, ["Who's going"]);
    await user.click(screen.getByRole('button', { name: 'Add someone' }));
    await user.keyboard('Meena');
    const more = screen.getByText('More about them (optional)');
    await user.click(more);
    const country = screen.getByRole('textbox', { name: 'Country they live in (optional)' });
    await user.type(country, 'UAE');
    await user.clear(country);

    expect(more.closest('details')).toHaveAttribute('open');
    expect(country).toHaveValue('');
  });

  it('goes step by step, checks each step, and saves what was checked, once', async () => {
    const { user, router } = renderApp('/m/travel/new');

    expect(await screen.findByRole('heading', { name: 'Where and when' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    await next(user);
    expect(await screen.findByText('Give the trip a name.')).toBeInTheDocument();
    expect(screen.getByText('Say where.')).toBeInTheDocument();
    expect(screen.getByText('Say which country.')).toBeInTheDocument();
    expect(screen.getByText('Choose the first day.')).toBeInTheDocument();

    await fillPlace(user);
    fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-11-19' } });
    await next(user);
    expect(await screen.findByText('Choose a last day on or after the first.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-11-24' } });
    await next(user);

    const who = await screen.findByRole('heading', { name: "Who's going" });
    expect(who).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Add me (Asha)' }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Asha');
    await user.type(screen.getByRole('textbox', { name: /Passport country/ }), 'India');
    await user.click(screen.getByRole('button', { name: 'Add someone' }));
    // The new traveller's name is where the typing goes next.
    expect(screen.getAllByRole('textbox', { name: 'Name' }).at(-1)).toHaveFocus();
    await user.keyboard('Ravi');
    await next(user);

    expect(await screen.findByRole('heading', { name: 'Style and budget' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'With friends' }));
    await user.type(screen.getByRole('textbox', { name: 'Budget in INR (optional)' }), '25000');
    await user.type(screen.getByRole('textbox', { name: /Interests/ }), 'beaches, food');
    await user.click(screen.getByRole('switch', { name: 'Remind me the day before it starts' }));
    await next(user);

    expect(await screen.findByRole('heading', { name: 'How the app helps' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Basic AI' }));
    expect(screen.getByRole('radio', { name: 'Basic AI' })).toHaveAccessibleDescription(
      "AI help isn't active yet. Until a later update, a trip in Basic AI works exactly like Static.",
    );
    await next(user);

    expect(await screen.findByRole('heading', { name: 'Check and save' })).toBeInTheDocument();
    const place = screen.getByRole('region', { name: 'Where and when' });
    expect(within(place).getByText('Goa with friends')).toBeInTheDocument();
    expect(within(place).getByText('Goa, India')).toBeInTheDocument();
    expect(within(place).getByText(/Nov 20.*24, 2026 · 5 days/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: "Who's going" })).getByText(
        'Asha (passport: India), Ravi',
      ),
    ).toBeInTheDocument();
    const style = screen.getByRole('region', { name: 'Style and budget' });
    expect(within(style).getByText('₹25,000')).toBeInTheDocument();
    expect(within(style).getByText('beaches, food')).toBeInTheDocument();
    expect(within(style).getByText('The day before it starts')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'How the app helps' })).getByText('Basic AI'),
    ).toBeInTheDocument();

    // Back to one step to change it, then straight back to the check.
    await user.click(screen.getByRole('button', { name: 'Edit Where and when' }));
    const title = await screen.findByRole('textbox', { name: /Trip name/ });
    await user.clear(title);
    await user.type(title, 'Goa trip');
    await user.click(screen.getByRole('button', { name: 'Back to the check' }));
    expect(
      within(await screen.findByRole('region', { name: 'Where and when' })).getByText('Goa trip'),
    ).toBeInTheDocument();

    // A double tap plans it once.
    await user.dblClick(screen.getByRole('button', { name: 'Save the trip' }));
    expect(await screen.findByText('“Goa trip” is planned.')).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/m/travel');
    });
    expect(await screen.findByRole('article', { name: 'Goa trip' })).toBeInTheDocument();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.key).toBeTruthy();
    expect(sent[0]?.body).toEqual({
      title: 'Goa trip',
      destinations: [{ name: 'Goa', country: 'India', timezone: null }],
      departure_city: null,
      start_date: '2026-11-20',
      end_date: '2026-11-24',
      trip_type: 'friends',
      pace: 'balanced',
      currency: 'INR',
      budget_minor: 2_500_000,
      mode: 'basic',
      interests: ['beaches', 'food'],
      notes: null,
      remind_prepare: true,
      // Nothing more of them was given: none of it is sent as anything but nothing.
      travellers: [
        { name: 'Asha', passport_country: 'India', ...NOTHING_MORE },
        { name: 'Ravi', passport_country: null, ...NOTHING_MORE },
      ],
    });
  });

  it('never lets Premium be chosen: its card says so, and the trip stays Static', async () => {
    const { user, container } = renderApp('/m/travel/new');
    await fillPlace(user);
    await through(user, ["Who's going", 'Style and budget', 'How the app helps']);
    expect(await axe(container)).toHaveNoViolations();

    const premium = screen.getByRole('radio', { name: 'Premium' });
    expect(premium).toBeDisabled();
    expect(premium).toHaveAccessibleDescription("Not available yet, so it can't be chosen.");
    await user.click(premium);
    await user.click(screen.getByText("Not available yet, so it can't be chosen."));
    expect(premium).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Static' })).toBeChecked();
    expect(screen.getByText('Locked')).toBeInTheDocument();

    await next(user);
    await user.click(await screen.findByRole('button', { name: 'Save the trip' }));
    await waitFor(() => {
      expect(sent).toHaveLength(1);
    });
    expect(sent[0]?.body.mode).toBe('static');
  });

  it('says why the server refused the trip, on the check', async () => {
    refusal = { code: 'TRAVEL_TRIP_DATES_INVALID', status: 422 };
    const { user } = renderApp('/m/travel/new');
    await fillPlace(user);
    await through(user, ["Who's going", 'Style and budget', 'How the app helps']);
    await next(user);
    await user.click(await screen.findByRole('button', { name: 'Save the trip' }));

    expect(
      await screen.findByText('A trip ends on or after its first day, and can only be so long.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check and save' })).toBeInTheDocument();

    // Tried again, it goes with the same key: the server can't plan it twice.
    refusal = null;
    await user.click(screen.getByRole('button', { name: 'Save the trip' }));
    expect(await screen.findByText('“Goa with friends” is planned.')).toBeInTheDocument();
    expect(sent).toHaveLength(2);
    expect(sent[1]?.key).toBe(sent[0]?.key);
  });
});
