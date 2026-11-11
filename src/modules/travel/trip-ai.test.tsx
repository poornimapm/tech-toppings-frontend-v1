import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { AgentRun, ClientAction } from '@/core/agents/queries';
import { travelKeys } from '@/modules/travel/api';
import type { DayPlan } from '@/modules/travel/checklist-api';
import {
  activityOf,
  fakeTrip,
  itemOf,
  NOW,
  TODAY,
  tripOf,
  type Sent,
  type TripState,
} from '@/modules/travel/testing/fake-trip';
import {
  backgroundRun,
  errorEnvelope,
  moduleView,
  resetModuleState,
  serveCancel,
  serveRun,
  server,
  testModules,
  testUser,
} from '@/test/msw';
import { renderApp } from '@/test/render';

let state: TripState;
let sent: Sent[];

beforeAll(async () => {
  await import('@/modules/travel/travel-layout');
  await import('@/modules/travel/trip-pages');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state = {
    trip: tripOf({ mode: 'basic' }),
    activities: [
      activityOf({ id: 'breakfast', title: 'Breakfast at the shack', start_time: '08:30' }),
      activityOf({ id: 'kayak', title: 'Kayaking', kind: 'beach', position: 1 }),
    ],
    items: [itemOf({ id: 'vest', title: 'Life jacket', activity_id: 'kayak', day: TODAY })],
    // The rules' suggestions: the kayaking's own, and another activity's.
    suggestions: [
      itemOf({
        id: 'towel',
        title: 'Towel',
        activity_id: 'kayak',
        day: TODAY,
        source: 'rule',
        suggestion_key: 'activity:kayak:towel',
      }),
      itemOf({
        id: 'shoes',
        title: 'Comfortable walking shoes',
        activity_id: 'breakfast',
        day: TODAY,
        source: 'rule',
        suggestion_key: 'activity:breakfast:walking_shoes',
      }),
    ],
  };
  sent = fakeTrip(state);
  resetModuleState([
    ...testModules,
    moduleView('travel', testModules.length, { status: 'beta', available: true }),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

const writes = () => sent.filter((each) => each.method !== 'GET');
const paths = () => writes().map((each) => each.path);

/** A run of the travel agent that ended with `action` (its draft), as the server keeps it. */
const drafted = (skill: string, action: ClientAction, changes: Partial<AgentRun> = {}) =>
  backgroundRun({
    skill,
    status: 'completed',
    stages: ['understanding', 'reading', 'drafting', 'checking', 'done'],
    client_actions: [action],
    message: 'Here is a draft.',
    ...changes,
  });

const DAY: ClientAction = {
  tool: 'travel_day_draft',
  arguments: {
    trip_id: 'goa',
    day: TODAY,
    activities: [
      { title: 'Spice farm', kind: 'sightseeing', start_time: '11:00' },
      { title: 'Seafood lunch', kind: 'food' },
    ],
  },
};
const ITEMS: ClientAction = {
  tool: 'travel_items_draft',
  arguments: {
    trip_id: 'goa',
    activity_id: 'kayak',
    items: [{ title: 'Phone pouch', bag: 'day_bag', quantity: 1 }, { title: 'Sun hat' }],
  },
};
const change = (args: Record<string, unknown>): ClientAction => ({
  tool: 'travel_change_draft',
  arguments: { trip_id: 'goa', activity_id: 'kayak', change: args },
});
/** What a run says when AI can't run for the reason given. */
const unavailable = (reason: AgentRun['reason']) =>
  backgroundRun({ status: 'unavailable', mode: null, reason, stages: ['understanding', 'done'] });

type User = ReturnType<typeof renderApp>['user'];

/** The itinerary's kayaking, open to what can be done with it. */
const openKayaking = async (user: User) => {
  await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
};
/** The person's words, put in the box at once (typed key by key, a long sentence is slow here). */
const say = async (user: User, box: HTMLElement, words: string) => {
  await user.click(box);
  await user.paste(words);
};

/** Each AI action: where it is, the button that opens it (none: it is on the page), the words it
 *  needs, the button that asks, and the way by hand it offers. */
const ACTIONS = [
  {
    name: 'Draft this day',
    path: 'itinerary',
    open: 'Draft this day',
    words: "Anything you'd like that day? (optional)",
    ask: 'Draft the day',
    manual: 'Or add activities yourself with “Add an activity”.',
  },
  {
    name: 'Prepare with AI',
    path: 'prepare',
    open: 'Prepare with AI: Kayaking',
    words: null,
    ask: 'Draft the list',
    manual: 'Or add items yourself with “Add an item” in Prepare.',
  },
  {
    name: 'Tell it what changed',
    path: 'prepare',
    open: 'Tell it what changed: Kayaking',
    words: 'In your words',
    ask: 'Draft the change',
    manual: 'Or use Mark done, Skip, Replace or Reschedule on the Itinerary yourself.',
  },
  {
    name: 'Ask about this trip',
    path: '',
    open: null,
    words: 'Your question',
    ask: 'Ask',
    manual: "Or look through the trip's sections yourself.",
  },
];

describe.each(ACTIONS)('$name', ({ path, open, words, ask, manual }) => {
  it('shows its stages, stops the run on Cancel, and says why it can’t run, with Retry and the way by hand', async () => {
    serveRun(backgroundRun({ stages: ['understanding', 'reading'] }));
    const cancelled = serveCancel();
    const { user } = renderApp(['/m/travel/trips/goa', path].filter(Boolean).join('/'));
    if (open) await user.click(await screen.findByRole('button', { name: open }));
    if (words) await say(user, await screen.findByRole('textbox', { name: words }), 'Some words');
    const button = await screen.findByRole('button', { name: ask });
    await user.click(button);

    const progress = await screen.findByRole('list', { name: 'Progress' });
    expect(within(progress).getByText('Reading your records')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument();
    // Back where it was asked from, and the run stopped on the server too.
    expect(words ? screen.getByRole('textbox', { name: words }) : button).toHaveFocus();
    await waitFor(() => {
      expect(cancelled).toEqual(['run-1']);
    });

    serveRun(unavailable('providers_failed'));
    await user.click(button);
    expect(
      await screen.findByText(
        "The assistant can't help with that right now. The AI service isn't answering right now.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(manual)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    // Only asked: nothing written, and nothing more stopped.
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist', '/v1/travel/trips/goa/assist']);
    expect(cancelled).toEqual(['run-1']);
  });
});

describe('Basic AI on a trip', () => {
  // On a trip in Static, none of it is offered.
  it.each([
    ['the overview', ''],
    ['the itinerary', 'itinerary'],
    ['Prepare', 'prepare'],
  ])('is offered nowhere on %s of a trip in Static', async (_where, path) => {
    state.trip.mode = 'static';
    const { user } = renderApp(['/m/travel/trips/goa', path].filter(Boolean).join('/'));
    if (path === '') {
      expect(await screen.findByRole('region', { name: 'Trip settings' })).toBeInTheDocument();
    } else if (path === 'itinerary') {
      await openKayaking(user);
      expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
    } else {
      const link = { name: 'Open this day in the itinerary' };
      expect(await screen.findByRole('link', link)).toBeVisible();
      expect(screen.getAllByText(/Kayaking/).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('region', { name: 'Ask about this trip' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Draft this day|with AI|what changed/ }),
    ).not.toBeInTheDocument();
  });

  it('shows a drafted day in the usual preview, after the day’s own, with nothing added yet', async () => {
    serveRun(drafted('plan-day', DAY));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    const dialog = await screen.findByRole('dialog', { name: 'Draft Fri, Nov 6' });
    expect(within(dialog).getByText(/You check them before anything is added/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Draft the day' }));

    expect(await within(dialog).findByText('Add “Spice farm”')).toBeInTheDocument();
    expect(within(dialog).getByText('Add “Seafood lunch”')).toBeInTheDocument();
    expect(within(dialog).getByText('Time: 11:00 AM')).toBeInTheDocument();
    expect(
      within(dialog).getByText('A draft is ready. Check it, then add it or cancel.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/These go after what the day already holds/)).toBeVisible();
    expect(paths()).toEqual([
      '/v1/travel/trips/goa/assist',
      '/v1/travel/trips/goa/activities/draft', // the preview, which writes nothing
    ]);
    expect(state.activities).toHaveLength(2);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('adds a drafted day only when applied, naming its run, as one change to undo', async () => {
    serveRun(drafted('plan-day', DAY));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    const wish = { name: "Anything you'd like that day? (optional)" };
    await say(user, await screen.findByRole('textbox', wish), 'A slow morning');
    await user.click(screen.getByRole('button', { name: 'Draft the day' }));
    await user.click(await screen.findByRole('button', { name: 'Add 2 activities' }));

    const done = await screen.findByRole('dialog', { name: 'What changed?' });
    expect(within(done).getByText('Added “Spice farm”')).toBeInTheDocument();
    expect(within(done).getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    const { activities } = DAY.arguments;
    expect(writes().map(({ path, body }) => ({ path, body }))).toEqual([
      {
        path: '/v1/travel/trips/goa/assist',
        body: { task: 'day', day: TODAY, text: 'A slow morning', locale: 'en' },
      },
      {
        path: '/v1/travel/trips/goa/activities/draft',
        body: { day: TODAY, activities, apply: false, ai_run_id: 'run-1' },
      },
      {
        path: '/v1/travel/trips/goa/activities/draft',
        body: { day: TODAY, activities, apply: true, ai_run_id: 'run-1' },
      },
    ]);
    await user.click(within(done).getByRole('button', { name: 'Done' }));

    // After the day's own, in the draft's order.
    const plan = await screen.findByRole('list', { name: /^Plan for/ });
    await waitFor(() => {
      expect(within(plan).getAllByRole('listitem')).toHaveLength(4);
    });
    const order = ['Breakfast at the shack', 'Kayaking', 'Spice farm', 'Seafood lunch'];
    const text = plan.textContent;
    expect(order.map((title) => text.indexOf(title))).toEqual(
      order.map((title) => text.indexOf(title)).sort((a, b) => a - b),
    );
  });

  it('writes nothing when the draft is cancelled', async () => {
    serveRun(drafted('plan-day', DAY));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));
    const dialog = await screen.findByRole('dialog', { name: 'Draft Fri, Nov 6' });
    await within(dialog).findByText('Add “Spice farm”');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(paths()).toEqual([
      '/v1/travel/trips/goa/assist',
      '/v1/travel/trips/goa/activities/draft', // the preview, which writes nothing
    ]);
    expect(writes().at(-1)?.body).toMatchObject({ apply: false });
    expect(state.activities).toHaveLength(2);
  });

  it('says why a day can’t be drafted, with Retry and the way by hand', async () => {
    serveRun(unavailable('quota'));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));

    expect(
      await screen.findByText(
        "The assistant can't help with that right now. Today's AI limit is used up. It resets tomorrow.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Or add activities yourself with “Add an activity”.'),
    ).toBeInTheDocument();
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist']);

    serveRun(drafted('plan-day', DAY));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Add “Spice farm”')).toBeInTheDocument();
  });

  it('says so when its run can’t be used to apply the draft, and keeps the draft', async () => {
    serveRun(drafted('plan-day', DAY));
    server.use(
      http.post('*/api/v1/travel/trips/:id/activities/draft', async ({ request }) => {
        const body = (await request.json()) as { apply: boolean };
        return body.apply
          ? HttpResponse.json(errorEnvelope('TRAVEL_AI_RUN_INVALID', 'refused'), { status: 422 })
          : HttpResponse.json({
              what_changed: [
                { entity: 'activity', op: 'add', record_id: null, title: 'Spice farm', fields: [] },
              ],
              needs_review: [],
              kept: [],
              days: [TODAY],
              event_id: null,
            });
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));
    await user.click(await screen.findByRole('button', { name: 'Add 1 activity' }));

    const dialog = screen.getByRole('dialog', { name: 'Draft Fri, Nov 6' });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      "That AI draft can't be used here any more. Ask again, or do it by hand.",
    );
    expect(within(dialog).getByText('Add “Spice farm”')).toBeInTheDocument();
    expect(state.activities).toHaveLength(2);
  });

  it('prepares an activity with AI: the assistant’s suggestions, previewed, then added with its run', async () => {
    serveRun(drafted('activity-checklist', ITEMS));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await openKayaking(user);
    await user.click(screen.getByRole('button', { name: 'Prepare with AI' }));
    const dialog = await screen.findByRole('dialog', { name: 'Prepare for “Kayaking”' });
    await user.click(within(dialog).getByRole('button', { name: 'Draft the list' }));

    expect(await within(dialog).findByText('Add “Phone pouch”')).toBeInTheDocument();
    expect(within(dialog).getByText('Bag: Day bag')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/These are the assistant's suggestions for this activity/),
    ).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Add 2 suggestions' }));
    expect(await screen.findByRole('dialog', { name: 'What changed?' })).toBeInTheDocument();
    const items = ITEMS.arguments.items;
    expect(writes().map(({ path, body }) => ({ path, body }))).toEqual([
      {
        path: '/v1/travel/trips/goa/assist',
        body: { task: 'activity', activity_id: 'kayak', locale: 'en' },
      },
      {
        path: '/v1/travel/trips/goa/checklist/assist',
        body: { activity_id: 'kayak', items, apply: false, ai_run_id: 'run-1' },
      },
      {
        path: '/v1/travel/trips/goa/checklist/assist',
        body: { activity_id: 'kayak', items, apply: true, ai_run_id: 'run-1' },
      },
    ]);
    expect(state.items.map((each) => [each.title, each.source])).toEqual([
      ['Life jacket', 'user'],
      ['Phone pouch', 'assistant'],
      ['Sun hat', 'assistant'],
    ]);
  });

  it('shows the assistant’s items on the lists as AI suggestions', async () => {
    state.items.push(
      itemOf({
        id: 'pouch',
        title: 'Phone pouch',
        activity_id: 'kayak',
        day: TODAY,
        source: 'assistant',
        suggestion_key: 'ai:kayak:phone_pouch',
      }),
    );
    renderApp('/m/travel/trips/goa/prepare');
    const list = await screen.findByRole('list', { name: 'To do that day' });
    const [vest, pouch] = within(list).getAllByRole('listitem') as [HTMLElement, HTMLElement];
    expect(pouch).toHaveTextContent('Phone pouch');
    expect(within(pouch).getByText('AI suggestion')).toBeInTheDocument();
    // An item of the person's own is no suggestion.
    expect(within(vest).queryByText('AI suggestion')).not.toBeInTheDocument();
  });

  it('offers the activity’s rule suggestions instead when AI can’t run, labelled as such', async () => {
    serveRun(
      backgroundRun({
        skill: 'activity-checklist',
        status: 'completed',
        mode: 'static',
        reason: 'consent',
        message_code: 'activity-checklist.rules',
        message_params: { trip_id: 'goa', activity_id: 'kayak', day: TODAY },
        stages: ['understanding', 'done'],
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    await user.click(await screen.findByRole('button', { name: 'Prepare with AI: Kayaking' }));
    const dialog = await screen.findByRole('dialog', { name: 'Prepare for “Kayaking”' });
    await user.click(within(dialog).getByRole('button', { name: 'Draft the list' }));

    expect(
      await within(dialog).findByText(
        "The assistant can't help with that right now. AI is off for your account. Here are " +
          "the app's own suggestions for this kind of activity instead: by rule, not by AI.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Turn on the AI assistant' })).toBeVisible();
    // Only the kayaking's own, worded by the app.
    expect(await within(dialog).findByText('Add “Towel”')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/These come from the app's own rules for this kind of activity/),
    ).toBeVisible();
    expect(within(dialog).queryByText(/walking shoes/)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add 1 suggestion' }));

    expect(await screen.findByRole('dialog', { name: 'What changed?' })).toBeInTheDocument();
    expect(writes().map(({ path, body }) => ({ path, body }))).toEqual([
      {
        path: '/v1/travel/trips/goa/assist',
        body: { task: 'activity', activity_id: 'kayak', locale: 'en' },
      },
      {
        path: '/v1/travel/trips/goa/checklist/suggest',
        body: { activity_id: 'kayak', packing: false, apply: false },
      },
      {
        path: '/v1/travel/trips/goa/checklist/suggest',
        body: { activity_id: 'kayak', packing: false, apply: true },
      },
    ]);
  });

  it('says so when the app has no suggestions of its own either, with Retry and the way by hand', async () => {
    serveRun(
      backgroundRun({
        skill: 'activity-checklist',
        status: 'completed',
        mode: 'static',
        reason: 'no_provider',
        message_code: 'activity-checklist.no_rules',
        message_params: { trip_id: 'goa', activity_id: 'kayak', day: TODAY },
        stages: ['understanding', 'done'],
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    await user.click(await screen.findByRole('button', { name: 'Prepare with AI: Kayaking' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the list' }));

    expect(
      await screen.findByText(
        "The assistant can't help with that right now. AI isn't set up on this server. The " +
          'app has no suggestions of its own for this kind of activity.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Or add items yourself with “Add an item” in Prepare.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist']);
  });

  it('opens the change dialog filled in from what the person said, and applies it naming the run', async () => {
    serveRun(drafted('update-trip', change({ action: 'skip', actual_note: 'It rained' })));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await openKayaking(user);
    await user.click(screen.getByRole('button', { name: 'Tell it what changed' }));
    const asking = await screen.findByRole('dialog', { name: 'What happened with “Kayaking”?' });
    const words = within(asking).getByRole('textbox', { name: 'In your words' });
    // Words are needed first.
    await user.click(within(asking).getByRole('button', { name: 'Draft the change' }));
    expect(paths()).toEqual([]);
    await say(user, words, 'We skipped it, it rained');
    await user.click(within(asking).getByRole('button', { name: 'Draft the change' }));

    const dialog = await screen.findByRole('dialog', { name: 'Skip “Kayaking”' });
    expect(
      within(dialog).getByText('Drafted from your words. Check it, then see what it changes.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'Why (optional)' })).toHaveValue(
      'It rained',
    );
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(await within(dialog).findByRole('button', { name: 'Make the change' }));

    expect(await screen.findByRole('dialog', { name: 'What changed?' })).toBeInTheDocument();
    const body = { action: 'skip', revision_no: 1, ai_run_id: 'run-1', actual_note: 'It rained' };
    expect(writes().map(({ path, body }) => ({ path, body }))).toEqual([
      {
        path: '/v1/travel/trips/goa/assist',
        body: {
          task: 'change',
          activity_id: 'kayak',
          text: 'We skipped it, it rained',
          locale: 'en',
        },
      },
      { path: '/v1/travel/activities/kayak/change', body: { ...body, apply: false } },
      { path: '/v1/travel/activities/kayak/change', body: { ...body, apply: true } },
    ]);
  });

  it('fills in a move to another day and time, and writes nothing when closed', async () => {
    serveRun(
      drafted(
        'update-trip',
        change({ action: 'reschedule', new_day: '2026-11-07', new_start_time: '15:00' }),
      ),
    );
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    await user.click(await screen.findByRole('button', { name: 'Tell it what changed: Kayaking' }));
    const words = await screen.findByRole('textbox', { name: 'In your words' });
    await say(user, words, 'Moved to tomorrow at 3');
    await user.click(screen.getByRole('button', { name: 'Draft the change' }));

    const dialog = await screen.findByRole('dialog', { name: 'Reschedule “Kayaking”' });
    expect(within(dialog).getByRole('combobox', { name: 'Move to' })).toHaveValue('2026-11-07');
    expect(within(dialog).getByLabelText('New time (optional)')).toHaveValue('15:00');
    expect(await axe(document.body)).toHaveNoViolations();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist']);
  });

  it('answers a question in the assistant’s words, never vouched for, with a way to the section it is about', async () => {
    serveRun(
      backgroundRun({
        skill: 'ask-trip',
        status: 'completed',
        stages: ['understanding', 'reading', 'done'],
        message: 'Kayaking is planned for Friday, after breakfast.',
        client_actions: [
          { tool: 'travel_open', arguments: { trip_id: 'goa', section: 'itinerary', day: TODAY } },
        ],
      }),
    );
    const { user, container } = renderApp('/m/travel/trips/goa');
    const card = await screen.findByRole('region', { name: 'Ask about this trip' });
    expect(
      within(card).getByText(
        "It answers from this trip's plan, lists and budget. It can't know the weather, prices, " +
          'opening hours or entry rules.',
      ),
    ).toBeVisible();
    await say(
      user,
      within(card).getByRole('textbox', { name: 'Your question' }),
      'When is the kayaking?',
    );
    await user.click(within(card).getByRole('button', { name: 'Ask' }));

    expect(
      await within(card).findByText('Kayaking is planned for Friday, after breakfast.'),
    ).toBeInTheDocument();
    // Its words, not the trip's records: nothing checks them, so the page never says they are.
    expect(within(card).getByText('The assistant says:')).toBeInTheDocument();
    expect(
      within(card).getByText(
        "It answers from this trip's records and can be wrong: the trip's sections are the record.",
      ),
    ).toBeInTheDocument();
    expect(within(card).queryByText(/own records/)).not.toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Open Itinerary for Fri, Nov 6' }),
    ).toHaveAttribute('href', `/m/travel/trips/goa/itinerary?day=${TODAY}`);
    expect(writes()).toEqual([
      expect.objectContaining({
        path: '/v1/travel/trips/goa/assist',
        body: { task: 'ask', text: 'When is the kayaking?', locale: 'en' },
      }),
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('says why a question can’t be answered, offering to turn AI on where that is why', async () => {
    serveRun(unavailable('consent'));
    let consented = false;
    server.use(
      http.patch('*/api/v1/me', () => {
        consented = true;
        serveRun(backgroundRun({ status: 'completed', message: 'Two activities, both today.' }));
        return HttpResponse.json({ ...testUser, ai_consent: true });
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa');
    const card = await screen.findByRole('region', { name: 'Ask about this trip' });
    await say(user, within(card).getByRole('textbox', { name: 'Your question' }), 'What is on?');
    await user.click(within(card).getByRole('button', { name: 'Ask' }));

    expect(
      await within(card).findByText(
        "The assistant can't help with that right now. AI is off for your account.",
      ),
    ).toBeInTheDocument();
    expect(
      within(card).getByText("Or look through the trip's sections yourself."),
    ).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Turn on the AI assistant' }));
    expect(await within(card).findByText('Two activities, both today.')).toBeInTheDocument();
    expect(consented).toBe(true);
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist', '/v1/travel/trips/goa/assist']);
  });

  it('says so beside the button when AI can’t be turned on', async () => {
    serveRun(unavailable('consent'));
    server.use(
      http.patch('*/api/v1/me', () =>
        HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'failed'), { status: 500 }),
      ),
    );
    const { user } = renderApp('/m/travel/trips/goa');
    const card = await screen.findByRole('region', { name: 'Ask about this trip' });
    await say(user, within(card).getByRole('textbox', { name: 'Your question' }), 'What is on?');
    await user.click(within(card).getByRole('button', { name: 'Ask' }));
    const turnOn = await within(card).findByRole('button', { name: 'Turn on the AI assistant' });
    await user.click(turnOn);

    expect(await within(card).findByText('The server ran into an error.')).toBeInTheDocument();
    expect(turnOn).toBeEnabled();
    expect(paths()).toEqual(['/v1/travel/trips/goa/assist']); // not asked again
  });

  it('shows the trip’s real mode when it left Basic AI elsewhere, and offers no AI on it', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    state.trip.mode = 'static'; // switched on another device
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));

    expect(
      await screen.findByText(
        'AI help is only for a trip in Basic AI. Switch the trip to it in its settings, or go on by hand.',
      ),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Draft this day' })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Static')).toBeInTheDocument(); // the trip's badge
    await openKayaking(user);
    expect(screen.queryByRole('button', { name: /with AI|what changed/ })).not.toBeInTheDocument();
  });

  it('keeps a change that moved the activity to another day open, with Undo, and opens nothing by itself after', async () => {
    serveRun(drafted('update-trip', change({ action: 'reschedule', new_day: '2026-11-07' })));
    const { user, queryClient } = renderApp('/m/travel/trips/goa/prepare');
    await user.click(await screen.findByRole('button', { name: 'Tell it what changed: Kayaking' }));
    await say(user, await screen.findByRole('textbox', { name: 'In your words' }), 'Moved to Sat');
    await user.click(screen.getByRole('button', { name: 'Draft the change' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reschedule “Kayaking”' });
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(await within(dialog).findByRole('button', { name: 'Make the change' }));

    const done = await screen.findByRole('dialog', { name: 'What changed?' });
    // Today's plan, asked for again, no longer holds it: what changed stays, with Undo.
    await waitFor(() => {
      const plan = queryClient.getQueryData<DayPlan>(travelKeys.prepare('goa', 'today'));
      expect(plan?.activities.map((each) => each.id)).toEqual(['breakfast']);
    });
    expect(screen.getByRole('dialog', { name: 'What changed?' })).toBe(done);
    expect(within(done).getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    await user.click(within(done).getByRole('button', { name: 'Done' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Or a day of the trip' }),
      '2026-11-07',
    );
    expect(
      await screen.findByRole('button', { name: 'Tell it what changed: Kayaking' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('takes a day’s draft refused as added already as added: the day is asked for again, and only Close is left', async () => {
    serveRun(drafted('plan-day', DAY));
    const spice = activityOf({ id: 'spice', title: 'Spice farm', position: 2 });
    server.use(
      http.post('*/api/v1/travel/trips/:id/activities/draft', async ({ request }) => {
        const body = (await request.json()) as { apply: boolean };
        if (body.apply) {
          // The first add went through, but its answer never came: this is it tried again.
          state.activities.push(spice);
          return HttpResponse.json(
            errorEnvelope('TRAVEL_AI_DRAFT_APPLIED', 'refused', { ai_run_id: 'run-1' }),
            { status: 409 },
          );
        }
        return HttpResponse.json({
          what_changed: [
            { entity: 'activity', op: 'add', record_id: null, title: 'Spice farm', fields: [] },
          ],
          needs_review: [],
          kept: [],
          days: [TODAY],
          event_id: null,
        });
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));
    await user.click(await screen.findByRole('button', { name: 'Add 1 activity' }));

    const dialog = screen.getByRole('dialog', { name: 'Draft Fri, Nov 6' });
    expect(
      await within(dialog).findByText(
        'This draft was added to the day already. To add it again, undo that in History first.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /^Add/ })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    const plan = await screen.findByRole('list', { name: /^Plan for/ });
    await waitFor(() => {
      expect(within(plan).getByText('Spice farm')).toBeInTheDocument();
    });
  });

  it('adds a drafted cost, said in the trip’s currency’s main unit, in minor units', async () => {
    state.trip.currency = 'JPY'; // no smaller unit: 1500 yen is 1500
    const costly: ClientAction = {
      tool: 'travel_day_draft',
      arguments: {
        trip_id: 'goa',
        day: TODAY,
        activities: [{ title: 'Spice farm', kind: 'sightseeing', estimated_cost: 1500 }],
      },
    };
    serveRun(drafted('plan-day', costly));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Draft this day' }));
    await user.click(await screen.findByRole('button', { name: 'Draft the day' }));

    const dialog = await screen.findByRole('dialog', { name: 'Draft Fri, Nov 6' });
    expect(await within(dialog).findByText('Estimated cost: ¥1,500')).toBeInTheDocument();
    expect(writes().at(-1)?.body).toEqual({
      day: TODAY,
      activities: [{ title: 'Spice farm', kind: 'sightseeing', estimated_cost_minor: 1500 }],
      apply: false,
      ai_run_id: 'run-1',
    });
  });
});
