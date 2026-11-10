import { onlineManager } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
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
  // The trip's pages load as one chunk (trip-loader.ts): all of it, before the first test.
  await import('@/modules/travel/trip-pages');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state = {
    trip: tripOf(),
    activities: [
      activityOf({
        id: 'beach',
        title: 'Calangute beach',
        kind: 'beach',
        start_time: '09:00',
        transport: 'Scooter',
      }),
    ],
    items: [
      itemOf({ id: 'cream', title: 'Sunscreen', day: TODAY, activity_id: 'beach' }),
      itemOf({ id: 'card', title: 'Forex card' }),
      itemOf({ id: 'tops', title: 'Tops', bag: 'check_in', quantity: 5, state: 'completed' }),
      itemOf({ id: 'socks', title: 'Socks', bag: 'check_in', quantity: 5 }),
      itemOf({ id: 'swim', title: 'Swimwear', bag: 'day_bag', state: 'in_progress' }),
      itemOf({ id: 'towel', title: 'Towel', bag: 'day_bag', state: 'not_applicable' }),
    ],
    suggestions: [
      itemOf({
        id: 'charger',
        title: 'Phone charger',
        bag: 'electronics',
        source: 'rule',
        suggestion_key: 'packing:phone_charger',
      }),
      itemOf({
        id: 'brush',
        title: 'Toothbrush and toothpaste',
        bag: 'toiletry',
        source: 'rule',
        suggestion_key: 'packing:toothbrush',
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
  onlineManager.setOnline(true);
});

const writes = () => sent.filter((each) => each.method !== 'GET');
const states = (group: HTMLElement) =>
  within(group)
    .getAllByRole('button')
    .map((button) => [button.textContent, button.getAttribute('aria-pressed')]);

describe('getting ready', () => {
  it("shows today's plan, its getting around and what is to do, today and for the whole trip", async () => {
    const { user, container } = renderApp('/m/travel/trips/goa/prepare');

    expect(await screen.findByRole('heading', { name: 'Friday, November 6, 2026' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Get me ready' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const plan = screen.getByRole('region', { name: 'The plan' });
    expect(within(plan).getByText(/Calangute beach/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Getting around' })).getByText(/Scooter/),
    ).toBeInTheDocument();
    const day = screen.getByRole('region', { name: 'To do that day' });
    expect(within(day).getByText('Sunscreen')).toBeInTheDocument();
    const whole = screen.getByRole('region', { name: 'For the whole trip' });
    expect(within(whole).getByText('Forex card')).toBeInTheDocument();
    // Packing has its own tab.
    expect(within(whole).queryByText('Tops')).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Prepare tomorrow' }));
    expect(
      await screen.findByRole('heading', { name: 'Saturday, November 7, 2026' }),
    ).toBeVisible();
    expect(await screen.findByText('Nothing planned for this day.')).toBeInTheDocument();
  });

  it('gives each item four states, worked by pointer or keyboard, saved as tapped and said aloud', async () => {
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    const group = await screen.findByRole('group', { name: 'State of “Sunscreen”' });
    expect(states(group)).toEqual([
      ['Not started', 'true'],
      ['In progress', 'false'],
      ['Done', 'false'],
      ['Not needed', 'false'],
    ]);

    await user.click(within(group).getByRole('button', { name: 'In progress' }));
    expect(await screen.findByText('“Sunscreen”: In progress.')).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'In progress' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    within(group).getByRole('button', { name: 'Done' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('“Sunscreen”: Done.')).toBeInTheDocument();

    await user.tab();
    expect(within(group).getByRole('button', { name: 'Not needed' })).toHaveFocus();
    await user.keyboard(' ');
    expect(await screen.findByText('“Sunscreen”: Not needed.')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(group).getByRole('button', { name: 'Not needed' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    expect(writes().map(({ method, path, body }) => [method, path, body])).toEqual([
      ['PATCH', '/v1/travel/checklist/cream', { state: 'in_progress' }],
      ['PATCH', '/v1/travel/checklist/cream', { state: 'completed' }],
      ['PATCH', '/v1/travel/checklist/cream', { state: 'not_applicable' }],
    ]);
  });

  it('adds an item, sent once with its own key', async () => {
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    const whole = await screen.findByRole('region', { name: 'For the whole trip' });
    await user.click(within(whole).getByRole('button', { name: 'Add an item' }));
    const adding = await screen.findByRole('dialog', { name: 'Add an item' });
    await user.type(
      within(adding).getByRole('textbox', { name: 'What' }),
      'Print the hotel voucher',
    );
    await user.click(within(adding).getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('“Print the hotel voucher” is on the list.'),
    ).toBeInTheDocument();
    expect(writes().at(-1)).toMatchObject({
      method: 'POST',
      path: '/v1/travel/trips/goa/checklist',
      body: { title: 'Print the hotel voucher', state: 'not_started', quantity: 1, day: null },
    });
    expect(writes().at(-1)?.key).toBeTruthy();
  });

  it('edits only what changed, removes an item, and takes back that removal', async () => {
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    const whole = await screen.findByRole('region', { name: 'For the whole trip' });
    await user.click(await within(whole).findByRole('button', { name: 'Edit “Forex card”' }));
    const editing = await screen.findByRole('dialog', { name: 'Edit “Forex card”' });
    const many = within(editing).getByRole('textbox', { name: 'How many' });
    await user.clear(many);
    await user.type(many, '2');
    await user.click(within(editing).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('“Forex card” is saved.')).toBeInTheDocument();
    // Only what changed goes: its name stays as it is.
    expect(writes().at(-1)).toMatchObject({ method: 'PATCH', path: '/v1/travel/checklist/card' });
    expect(writes().at(-1)?.body).toEqual({ quantity: 2, day: null, revision_no: 1 });
    expect(await within(whole).findByText('× 2')).toBeInTheDocument();

    await user.click(within(whole).getByRole('button', { name: 'Remove “Forex card”' }));
    expect(await screen.findByText('Removed “Forex card”.')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(whole).queryByText('Forex card')).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await within(whole).findByText('Forex card')).toBeInTheDocument();
    // The event the removal answered (event-2), not the edit's before it (event-1).
    expect(writes().at(-1)?.path).toBe('/v1/travel/events/event-2/undo');
  });

  it('opens any day of the trip, and an item saved for another day opens that day', async () => {
    const { user, router } = renderApp('/m/travel/trips/goa/prepare?when=2026-11-08');
    expect(await screen.findByRole('heading', { name: 'Sunday, November 8, 2026' })).toBeVisible();
    const pick = screen.getByRole('combobox', { name: 'Or a day of the trip' });
    expect(pick).toHaveValue('2026-11-08');
    // The days still holding something to do are said so: only today's sunscreen is open.
    const days = () =>
      within(pick)
        .getAllByRole('option')
        .map((option) => option.textContent);
    expect(days()).toEqual([
      'Choose a day',
      'Day 1 · Thu, Nov 5',
      'Day 2 · Fri, Nov 6 · still to do',
      'Day 3 · Sat, Nov 7',
      'Day 4 · Sun, Nov 8',
      'Day 5 · Mon, Nov 9',
    ]);
    // Neither today nor tomorrow is the one open.
    expect(screen.getByRole('button', { name: 'Get me ready' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.selectOptions(pick, 'Day 1 · Thu, Nov 5');
    expect(
      await screen.findByRole('heading', { name: 'Thursday, November 5, 2026' }),
    ).toBeVisible();
    expect(router.state.location.search).toBe('?when=2026-11-05');

    const whole = screen.getByRole('region', { name: 'For the whole trip' });
    await user.click(within(whole).getByRole('button', { name: 'Add an item' }));
    const adding = await screen.findByRole('dialog', { name: 'Add an item' });
    await user.type(within(adding).getByRole('textbox', { name: 'What' }), 'Fort tickets');
    await user.selectOptions(within(adding).getByRole('combobox', { name: 'For' }), 'Mon, Nov 9');
    await user.click(within(adding).getByRole('button', { name: 'Save' }));

    // Out of sight on the day open, so the day it is for opens.
    expect(await screen.findByRole('heading', { name: 'Monday, November 9, 2026' })).toBeVisible();
    const day = screen.getByRole('region', { name: 'To do that day' });
    expect(await within(day).findByText('Fort tickets')).toBeInTheDocument();
    expect(writes().at(-1)?.body).toMatchObject({ title: 'Fort tickets', day: '2026-11-09' });
    expect(days().at(-1)).toBe('Day 5 · Mon, Nov 9 · still to do');
  });

  it("keeps a suggestion in the app's words, and labelled one, once ticked; renamed, it is the person's", async () => {
    // Kept on the server in the words of the rule when it was suggested.
    state.items.push(
      itemOf({
        id: 'beach-towel',
        title: 'Beach towel',
        day: TODAY,
        activity_id: 'beach',
        source: 'rule',
        suggestion_key: 'activity:beach:towel',
      }),
    );
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    const day = await screen.findByRole('region', { name: 'To do that day' });
    const named = () => within(day).getByRole('group', { name: /^State of “(Towel|Big towel)”$/ });
    expect(named()).toHaveAccessibleName('State of “Towel”');

    await user.click(within(named()).getByRole('button', { name: 'Done' }));
    expect(await screen.findByText('“Towel”: Done.')).toBeInTheDocument();
    await waitFor(() => {
      expect(state.items.find((each) => each.id === 'beach-towel')?.edited).toBe(true);
    });
    expect(named()).toHaveAccessibleName('State of “Towel”');
    expect(within(day).getByText('Suggestion')).toBeInTheDocument();

    await user.click(within(day).getByRole('button', { name: 'Edit “Towel”' }));
    const editing = await screen.findByRole('dialog', { name: 'Edit “Towel”' });
    const name = within(editing).getByRole('textbox', { name: 'What' });
    await user.clear(name);
    await user.type(name, 'Big towel');
    await user.click(within(editing).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Big towel” is saved.')).toBeInTheDocument();
    await waitFor(() => {
      expect(named()).toHaveAccessibleName('State of “Big towel”');
    });
    expect(within(day).queryByText('Suggestion')).not.toBeInTheDocument();
  });

  it('keeps a tick made offline on the device, the latest only, and sends it once back', async () => {
    const { user } = renderApp('/m/travel/trips/goa/prepare');
    const group = await screen.findByRole('group', { name: 'State of “Sunscreen”' });
    state.down = true;
    const backOnline = goOffline();

    await user.click(within(group).getByRole('button', { name: 'In progress' }));
    expect(
      await screen.findByText(
        '“Sunscreen”: In progress. Kept on this device until the network is back.',
      ),
    ).toBeInTheDocument();
    await user.click(within(group).getByRole('button', { name: 'Done' }));
    expect(
      await screen.findByText('“Sunscreen”: Done. Kept on this device until the network is back.'),
    ).toBeInTheDocument();

    expect(within(group).getByRole('button', { name: 'Done' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Waiting to send')).toBeVisible();
    // The second tap overtook the first: one thing waits.
    expect(screen.getByText('1 thing you added offline is waiting to be sent.')).toBeVisible();
    expect(writes()).toHaveLength(0);

    state.down = false;
    backOnline();
    expect(await screen.findByText('Sent 1 thing you added offline.')).toBeInTheDocument();
    expect(writes().map(({ method, path, body }) => [method, path, body])).toEqual([
      ['PATCH', '/v1/travel/checklist/cream', { state: 'completed' }],
    ]);
    await waitFor(() => {
      expect(screen.queryByText('Waiting to send')).not.toBeInTheDocument();
    });
    expect(within(group).getByRole('button', { name: 'Done' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('packing', () => {
  it('groups the list by bag, with what is packed of what is needed, and quantities', async () => {
    const { container } = renderApp('/m/travel/trips/goa/packing');

    const checkIn = await screen.findByRole('region', { name: 'Check-in bag' });
    const dayBag = screen.getByRole('region', { name: 'Day bag' });
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Check-in bag', 'Day bag']);
    expect(within(checkIn).getByText('1 of 2 packed')).toBeInTheDocument();
    expect(within(checkIn).getAllByText('× 5')).toHaveLength(2);
    // An item no longer needed doesn't count.
    expect(within(dayBag).getByRole('meter', { name: 'Packed: Day bag' })).toHaveAttribute(
      'aria-valuetext',
      '0 of 1 packed',
    );
    expect(screen.getByRole('meter', { name: 'Packed: Everything' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 3 packed',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('suggests what to pack as a preview first, and adds it only when asked', async () => {
    const { user } = renderApp('/m/travel/trips/goa/packing');
    await user.click(await screen.findByRole('button', { name: 'Suggest what to pack' }));

    const dialog = await screen.findByRole('dialog', { name: 'Suggestions for packing' });
    expect(await within(dialog).findByText('Add “Phone charger”')).toBeInTheDocument();
    expect(within(dialog).getByText('Add “Toothbrush and toothpaste”')).toBeInTheDocument();
    expect(within(dialog).getByText('Bag: Electronics')).toBeInTheDocument();
    expect(within(dialog).getByText(/not requirements of any place or company/)).toBeVisible();
    expect(writes()).toEqual([
      expect.objectContaining({ body: { day: null, packing: true, apply: false } }),
    ]);
    expect(state.items).toHaveLength(6);

    await user.click(within(dialog).getByRole('button', { name: 'Add 2 suggestions' }));
    expect(await screen.findByRole('dialog', { name: 'What changed?' })).toBeInTheDocument();
    expect(screen.getByText('Added “Phone charger”')).toBeInTheDocument();
    expect(writes().map((each) => each.body)).toEqual([
      { day: null, packing: true, apply: false },
      { day: null, packing: true, apply: true },
    ]);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));

    const electronics = await screen.findByRole('region', { name: 'Electronics' });
    expect(within(electronics).getByText('Phone charger')).toBeInTheDocument();
    expect(within(electronics).getByText('Suggestion')).toBeInTheDocument();
  });
});

/** The device loses its network: the browser says so, and the query client hears it. */
function goOffline() {
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
  return () => {
    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
  };
}
