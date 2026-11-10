import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

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
import { moduleView, resetModuleState, testModules } from '@/test/msw';
import { renderApp } from '@/test/render';

let state: TripState;
let sent: Sent[];

beforeAll(async () => {
  await import('@/modules/travel/travel-layout');
  await import('@/modules/travel/trips-page');
  await import('@/modules/travel/trip-pages');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state = {
    trip: tripOf(),
    activities: [
      activityOf({
        id: 'breakfast',
        title: 'Breakfast at the shack',
        start_time: '08:30',
        confirmed: true,
      }),
      activityOf({
        id: 'kayak',
        title: 'Kayaking',
        kind: 'beach',
        start_time: '10:00',
        location: 'Baga beach',
        estimated_cost_minor: 150_000,
        position: 1,
      }),
      // Later on the day, though it starts earlier: a day's order is the person's.
      activityOf({ id: 'walk', title: 'Sunset walk', start_time: '07:00', position: 2 }),
      activityOf({ id: 'fort', title: 'Fort visit', day: '2026-11-07', confirmed: true }),
    ],
    items: [
      itemOf({ id: 'vest', title: 'Life jacket', activity_id: 'kayak', day: TODAY }),
      itemOf({
        id: 'drybag',
        title: 'Dry bag',
        activity_id: 'kayak',
        day: TODAY,
        state: 'completed',
      }),
    ],
    suggestions: [],
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

describe('a trip', () => {
  it('opens from its card, with its sections as tabs', async () => {
    const { user, router } = renderApp('/m/travel/trips');
    await user.click(await screen.findByRole('link', { name: 'Goa with friends' }));

    const tabs = await screen.findByRole('navigation', { name: 'Sections of “Goa with friends”' });
    expect(router.state.location.pathname).toBe('/m/travel/trips/goa');
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Overview', 'Itinerary', 'Prepare', 'Packing', 'Budget', 'Bookings', 'History']);
    expect(within(tabs).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows how it stands, what is next and the mode, which changes alone', async () => {
    const { user } = renderApp('/m/travel/trips/goa');

    expect(await screen.findByText('Day 2 of 5')).toBeInTheDocument();
    // No tasks: no figure at all.
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText(/^Next: add activities\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Do it now' })).toHaveAttribute(
      'href',
      '/m/travel/trips/goa/itinerary',
    );
    const ahead = screen.getByRole('region', { name: 'Coming up next' });
    expect(within(ahead).getByRole('link', { name: /Breakfast at the shack/ })).toHaveAttribute(
      'href',
      `/m/travel/trips/goa/itinerary?day=${TODAY}`,
    );

    const settings = screen.getByRole('region', { name: 'Trip settings' });
    expect(within(settings).getByText('This trip is in Static.')).toBeInTheDocument();
    expect(within(settings).getByRole('radio', { name: 'Premium' })).toBeDisabled();
    const save = within(settings).getByRole('button', { name: 'Save the mode' });
    expect(save).toBeDisabled();
    await user.click(within(settings).getByRole('radio', { name: 'Basic AI' }));
    await user.click(save);

    expect(await screen.findByText('The trip is now in Basic AI.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: '/v1/travel/trips/goa',
        body: { mode: 'basic', revision_no: 1 },
      }),
    ]);
    expect(await within(settings).findByText('This trip is in Basic AI.')).toBeInTheDocument();
  });

  it('never calls a trip with no tasks ready: it says to add what is to do', async () => {
    state.overview = {
      readiness: null,
      next_action: { action: 'add_tasks', reason: 'no_tasks', params: {} },
    };
    renderApp('/m/travel/trips/goa');

    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText(/^Next: add what's to do\./).parentElement).toHaveTextContent(
      "Next: add what's to do. Nothing is on its lists yet.",
    );
    expect(screen.getByRole('link', { name: 'Do it now' })).toHaveAttribute(
      'href',
      '/m/travel/trips/goa/prepare',
    );
    const open = screen.getByRole('region', { name: 'Still open' });
    expect(within(open).getByText('Bookings not confirmed').nextElementSibling).toHaveTextContent(
      '0',
    );
  });

  it.each([
    // The first day still holding some of it opens.
    ['2026-11-08', '/m/travel/trips/goa/prepare?when=2026-11-08'],
    // Only the whole trip's list is left: Prepare as it is, where that list is.
    [null, '/m/travel/trips/goa/prepare'],
  ])('opens what is left of the checklist where it is (day %s)', async (day, href) => {
    state.overview = {
      next_action: {
        action: 'finish_checklist',
        reason: 'checklist_open',
        params: { open: 1, day },
      },
    };
    renderApp('/m/travel/trips/goa');

    expect(await screen.findByText(/^Next: finish the checklist\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Do it now' })).toHaveAttribute('href', href);
  });

  it('says what the trip is, and changes it as of its revision, travellers keeping their ids', async () => {
    state.trip = tripOf({
      travellers: [{ id: 'asha', name: 'Asha', passport_country: 'India', dietary: 'Vegetarian' }],
    });
    const { user } = renderApp('/m/travel/trips/goa');
    const about = await screen.findByRole('region', { name: 'About the trip' });
    expect(within(about).getByText('Asha (passport: India; food: Vegetarian)')).toBeVisible();

    await user.click(within(about).getByRole('button', { name: 'Edit the trip' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Goa with friends”' });
    const save = within(dialog).getByRole('button', { name: 'Save the changes' });
    expect(save).toBeDisabled();
    // What was given of her is shown already, to change.
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Country they live in (optional)' }),
      'UAE',
    );
    fireEvent.change(within(dialog).getByLabelText('Last day'), {
      target: { value: '2026-11-10' },
    });
    await user.click(save);

    expect(await screen.findByText('“Goa with friends” is saved.')).toBeInTheDocument();
    expect(writes().at(-1)).toMatchObject({
      method: 'PATCH',
      path: '/v1/travel/trips/goa',
      body: {
        end_date: '2026-11-10',
        revision_no: 1,
        travellers: [
          {
            id: 'asha',
            name: 'Asha',
            passport_country: 'India',
            residence_country: 'UAE',
            passport_expiry: null,
            dietary: 'Vegetarian',
            accessibility: null,
          },
        ],
      },
    });
    expect(
      await within(about).findByText('Asha (passport: India; lives in UAE; food: Vegetarian)'),
    ).toBeVisible();
  });

  it('keeps what more is said of a traveller open while it is cleared', async () => {
    state.trip = tripOf({ travellers: [{ id: 'asha', name: 'Asha', dietary: 'Vegetarian' }] });
    const { user } = renderApp('/m/travel/trips/goa');
    const about = await screen.findByRole('region', { name: 'About the trip' });
    await user.click(within(about).getByRole('button', { name: 'Edit the trip' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Goa with friends”' });
    const more = within(dialog).getByText('More about them (optional)').closest('details');
    // Open already, as she gave some of it.
    expect(more).toHaveAttribute('open');

    await user.clear(within(dialog).getByRole('textbox', { name: 'Food needs (optional)' }));
    // Nothing of it is left, and still it stays open round what is being typed.
    expect(more).toHaveAttribute('open');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Food needs (optional)' }),
      'Vegan',
    );
    expect(within(dialog).getByRole('textbox', { name: 'Food needs (optional)' })).toHaveValue(
      'Vegan',
    );
    expect(more).toHaveAttribute('open');
  });

  it('deletes the trip once asked, with a moment to bring it back', async () => {
    const { user, router } = renderApp('/m/travel/trips/goa');
    const about = await screen.findByRole('region', { name: 'About the trip' });
    await user.click(within(about).getByRole('button', { name: 'Delete the trip' }));
    const asking = await screen.findByRole('dialog', { name: 'Delete “Goa with friends”?' });
    expect(within(asking).getByText(/you can bring it back straight after/)).toBeVisible();
    await user.click(within(asking).getByRole('button', { name: 'Delete it' }));

    expect(await screen.findByText('Deleted “Goa with friends”.')).toBeInTheDocument();
    // What a person waits for: My Trips in its place, and no question left over it (while one is
    // up, the page behind it takes no pointer).
    expect(await screen.findByRole('list', { name: 'My trips' })).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/m/travel/trips');
    expect(state.deleted).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(await screen.findByText('“Goa with friends” is back in your trips.')).toBeVisible();
    expect(state.deleted).toBe(false);
    expect(writes().map(({ method, path }) => [method, path])).toEqual([
      ['DELETE', '/v1/travel/trips/goa'],
      ['POST', '/v1/travel/trips/goa/undelete'],
    ]);
  });
});

describe('the itinerary', () => {
  it("draws today's activities as a timeline in the day's order, each opening to its details", async () => {
    const { user, container } = renderApp('/m/travel/trips/goa/itinerary');

    const plan = await screen.findByRole('list', { name: /^Plan for Friday, November 6, 2026/ });
    const entries = within(plan).getAllByRole('listitem');
    expect(entries.map((entry) => within(entry).getAllByRole('button')[0]?.textContent)).toEqual([
      expect.stringContaining('Breakfast at the shack'),
      expect.stringContaining('Kayaking'),
      expect.stringContaining('Sunset walk'),
    ]);
    const [breakfast, kayaking] = entries as [HTMLElement, HTMLElement, HTMLElement];
    expect(screen.queryByText('Fort visit')).not.toBeInTheDocument();
    expect(within(breakfast).getByText('Confirmed')).toBeInTheDocument();
    expect(within(kayaking).getByText('Estimate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Day 2/ })).toHaveAttribute('aria-pressed', 'true');
    expect(await axe(container)).toHaveNoViolations();

    const kayak = within(kayaking).getByRole('button', { name: /Kayaking/ });
    expect(kayak).toHaveAttribute('aria-expanded', 'false');
    expect(within(kayaking).queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    await user.click(kayak);
    expect(kayak).toHaveAttribute('aria-expanded', 'true');
    expect(within(kayaking).getByText('₹1,500')).toBeVisible();
    expect(within(kayaking).getByRole('button', { name: 'Skip' })).toBeVisible();

    // Another day, from the strip.
    await user.click(screen.getByRole('button', { name: /^Day 3/ }));
    expect(await screen.findByText('Fort visit')).toBeInTheDocument();
    expect(screen.queryByText('Kayaking')).not.toBeInTheDocument();
  });

  it('moves an activity up, sending the whole day in its new order, and says where it went', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Sunset walk/ }));
    await user.click(screen.getByRole('button', { name: 'Move up' }));

    expect(await screen.findByText('“Sunset walk” is now number 2 of 3.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        path: '/v1/travel/trips/goa/activities/reorder',
        body: { day: TODAY, activity_ids: ['breakfast', 'walk', 'kayak'] },
      }),
    ]);
    const plan = screen.getByRole('list', { name: /^Plan for/ });
    expect(
      within(plan)
        .getAllByRole('listitem')
        .map((entry) => within(entry).getAllByRole('button')[0]?.textContent),
    ).toEqual([
      expect.stringContaining('Breakfast'),
      expect.stringContaining('Sunset walk'),
      expect.stringContaining('Kayaking'),
    ]);
  });

  it("takes back exactly the move it answered, though the moved one's own place stayed", async () => {
    // A replacement shares the place of what it replaced: the day's places aren't 0, 1, 2 …
    state.activities.splice(2, 0, activityOf({ id: 'boat', title: 'Boat tour', position: 1 }));
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Sunset walk/ }));
    await user.click(screen.getByRole('button', { name: 'Move up' }));

    expect(await screen.findByText('“Sunset walk” is now number 3 of 4.')).toBeInTheDocument();
    // Only the boat tour's place changed: the walk's own stayed at 2.
    expect(state.activities.map(({ id, position }) => [id, position])).toEqual([
      ['breakfast', 0],
      ['kayak', 1],
      ['boat', 3],
      ['walk', 2],
      ['fort', 0],
    ]);
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(
      await screen.findByText('Taken back: everything it changed is as it was.'),
    ).toBeInTheDocument();
    expect(writes().at(-1)?.path).toBe('/v1/travel/events/event-1/undo');
    expect(state.activities.find((each) => each.id === 'boat')?.position).toBe(1);
  });

  it("says why a move's undo is refused, though the itinerary has been left", async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Sunset walk/ }));
    await user.click(screen.getByRole('button', { name: 'Move up' }));
    expect(await screen.findByText('“Sunset walk” is now number 2 of 3.')).toBeInTheDocument();

    // On to the overview: the itinerary that made the move is gone.
    const tabs = screen.getByRole('navigation', { name: 'Sections of “Goa with friends”' });
    await user.click(within(tabs).getByRole('link', { name: 'Overview' }));
    expect(await screen.findByRole('region', { name: 'About the trip' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /^Plan for/ })).not.toBeInTheDocument();

    // Meanwhile the day changed again elsewhere.
    state.refuseUndo = 'TRAVEL_UNDO_STALE';
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByText("Something it touched has changed since, so it can't be undone."),
    ).toBeInTheDocument();
    expect(writes().at(-1)?.path).toBe('/v1/travel/events/event-1/undo');
  });

  it('skips an activity: the preview first, written only once applied, then what changed with an undo', async () => {
    // A suggestion ticked done: still as its rule words it, so named in the app's words.
    state.items.push(
      itemOf({
        id: 'towel',
        title: 'Beach towel',
        activity_id: 'kayak',
        day: TODAY,
        state: 'completed',
        source: 'rule',
        suggestion_key: 'activity:kayak:towel',
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Skip' }));

    const dialog = await screen.findByRole('dialog', { name: 'Skip “Kayaking”' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Why (optional)' }), 'Too windy');
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));

    expect(
      await within(dialog).findByText('Nothing has changed yet. This is what it would do.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Change “Kayaking”')).toBeInTheDocument();
    expect(within(dialog).getByText('Status: Planned → Skipped')).toBeInTheDocument();
    expect(within(dialog).getByText('Change “Life jacket”')).toBeInTheDocument();
    expect(within(dialog).getByText('State: Not started → Not needed')).toBeInTheDocument();
    expect(
      within(dialog).getByText('“Kayaking” is an estimate that may no longer stand.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("“Dry bag” is done, so it's kept.")).toBeInTheDocument();
    expect(within(dialog).getByText("“Towel” is done, so it's kept.")).toBeInTheDocument();
    // Asked about, and nothing written.
    expect(writes()).toEqual([
      expect.objectContaining({
        path: '/v1/travel/activities/kayak/change',
        body: { action: 'skip', apply: false, revision_no: 1, actual_note: 'Too windy' },
      }),
    ]);
    expect(state.activities[1]?.status).toBe('planned');

    await user.click(within(dialog).getByRole('button', { name: 'Make the change' }));
    expect(await screen.findByRole('dialog', { name: 'What changed?' })).toBeInTheDocument();
    expect(screen.getByText('Changed “Kayaking”')).toBeInTheDocument();
    expect(writes().at(-1)?.body).toEqual({
      action: 'skip',
      apply: true,
      revision_no: 1,
      actual_note: 'Too windy',
    });
    expect(state.activities[1]?.status).toBe('skipped');
    expect(state.items[0]?.state).toBe('not_applicable');
    expect(state.items[1]?.state).toBe('completed');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByText('Taken back: everything it changed is as it was.'),
    ).toBeInTheDocument();
    expect(writes().at(-1)?.path).toBe('/v1/travel/events/event-1/undo');
    expect(state.activities[1]?.status).toBe('planned');
    expect(state.items[0]?.state).toBe('not_started');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('adds an activity to the chosen day, once however often Save is pressed', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: 'Add an activity' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Add an activity on Nov 6, 2026',
    });
    await user.type(within(dialog).getByRole('textbox', { name: 'What' }), 'Fish thali');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Kind' }), 'food');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Estimated cost in INR (optional)' }),
      '450',
    );
    await user.dblClick(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Fish thali” is on the plan.')).toBeInTheDocument();
    const added = writes().filter((each) => each.path === '/v1/travel/trips/goa/activities');
    expect(added).toHaveLength(1);
    expect(added[0]?.key).toBeTruthy();
    expect(added[0]?.body).toEqual({
      title: 'Fish thali',
      kind: 'food',
      start_time: null,
      duration_minutes: null,
      location: null,
      transport: null,
      notes: null,
      estimated_cost_minor: 45_000,
      confirmed: false,
      day: TODAY,
    });
    expect(await screen.findByRole('button', { name: /Fish thali/ })).toBeInTheDocument();
  });

  it('offers the latest when the activity changed elsewhere, never overwriting it', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Kayaking”' });
    // Meanwhile, on another device.
    Object.assign(state.activities[1] ?? {}, { title: 'Kayak tour', revision_no: 2 });

    const name = within(dialog).getByRole('textbox', { name: 'What' });
    await user.clear(name);
    await user.type(name, 'Kayaking at dawn');
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(within(dialog).getByRole('button', { name: 'Make the change' }));

    expect(
      await within(dialog).findByText(/This was changed somewhere else since you opened it/),
    ).toBeInTheDocument();
    expect(state.activities[1]?.title).toBe('Kayak tour');
    await user.click(within(dialog).getByRole('button', { name: 'Reload' }));

    const fresh = await screen.findByRole('dialog', { name: 'Edit “Kayak tour”' });
    const again = within(fresh).getByRole('textbox', { name: 'What' });
    expect(again).toHaveValue('Kayak tour');
    await user.type(again, ' at dawn');
    await user.click(within(fresh).getByRole('button', { name: 'See what this changes' }));
    await user.click(within(fresh).getByRole('button', { name: 'Make the change' }));
    expect(await screen.findByText('“Kayak tour at dawn” is saved.')).toBeInTheDocument();
    expect(writes().at(-1)?.body).toMatchObject({ title: 'Kayak tour at dawn', revision_no: 2 });
  });

  it('shows what an edit changes before making it, and offers to take it back', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Kayaking”' });
    expect(within(dialog).getByRole('button', { name: 'See what this changes' })).toBeDisabled();

    const getting = within(dialog).getByRole('textbox', { name: 'Getting there (optional)' });
    await user.type(getting, 'Scooter');
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));

    expect(
      within(dialog).getByText('Nothing has changed yet. This is what it would do.'),
    ).toBeVisible();
    expect(within(dialog).getByText('Getting there: none → Scooter')).toBeInTheDocument();
    expect(writes()).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(within(dialog).getByRole('textbox', { name: 'Getting there (optional)' })).toHaveValue(
      'Scooter',
    );
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(within(dialog).getByRole('button', { name: 'Make the change' }));

    expect(await screen.findByText('“Kayaking” is saved.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({ method: 'PATCH', path: '/v1/travel/activities/kayak' }),
    ]);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByText('Taken back: everything it changed is as it was.'),
    ).toBeInTheDocument();
    // The very event the edit answered, nothing looked for.
    expect(writes().at(-1)?.path).toBe('/v1/travel/events/event-1/undo');
    expect(state.activities.find((each) => each.id === 'kayak')?.transport).toBeNull();
  });

  it('says why an undo is refused, though the form that made the change has gone', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Kayaking”' });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Getting there (optional)' }),
      'Bus',
    );
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(within(dialog).getByRole('button', { name: 'Make the change' }));
    expect(await screen.findByText('“Kayaking” is saved.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Meanwhile it changed again elsewhere.
    state.refuseUndo = 'TRAVEL_UNDO_STALE';
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByText("Something it touched has changed since, so it can't be undone."),
    ).toBeInTheDocument();
    expect(state.activities.find((each) => each.id === 'kayak')?.transport).toBe('Bus');
  });

  it('has nothing to make of an edit that leaves everything as it is saved', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Kayaking”' });
    // A space typed after the name is no new name.
    await user.type(within(dialog).getByRole('textbox', { name: 'What' }), ' ');
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));

    expect(
      within(dialog).getByText("This is just as it's saved, so there's nothing to change."),
    ).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Make the change' })).toBeDisabled();
    expect(writes()).toEqual([]);
  });

  it('says plainly when the server found nothing to change, with nothing to undo', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Kayaking”' });
    // The same change made elsewhere already, as of the same revision.
    Object.assign(state.activities[1] ?? {}, { transport: 'Scooter' });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Getting there (optional)' }),
      'Scooter',
    );
    await user.click(within(dialog).getByRole('button', { name: 'See what this changes' }));
    await user.click(within(dialog).getByRole('button', { name: 'Make the change' }));

    expect(
      await screen.findByText(
        "Nothing changed: it was already that way, so there's nothing to undo.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('“Kayaking” is saved.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('removes an activity added by mistake, with a moment to take it back', async () => {
    const { user } = renderApp('/m/travel/trips/goa/itinerary');
    await user.click(await screen.findByRole('button', { name: /Kayaking/ }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Removed “Kayaking”.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Kayaking/ })).not.toBeInTheDocument();
    });
    expect(writes().at(-1)).toMatchObject({
      method: 'DELETE',
      path: '/v1/travel/activities/kayak',
    });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('button', { name: /Kayaking/ })).toBeInTheDocument();
  });
});
