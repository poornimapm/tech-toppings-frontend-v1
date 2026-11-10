import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  eventOf,
  fakeTrip,
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
  await import('@/modules/travel/trip-pages');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state = {
    trip: tripOf({ travellers: [{ id: 'asha', name: 'Asha' }] }),
    activities: [],
    items: [],
    suggestions: [],
    history: [
      eventOf({
        id: 'confirmed',
        kind: 'booking_edited',
        summary: { title: 'Beach hotel' },
        changes: [
          {
            entity: 'booking',
            op: 'set',
            record_id: 'hotel',
            title: 'Beach hotel',
            fields: [{ field: 'status', old: 'entered', new: 'confirmed' }],
          },
        ],
      }),
      eventOf({
        id: 'skipped',
        kind: 'activity_skipped',
        summary: { title: 'Kayaking', day: TODAY },
        changes: [
          {
            entity: 'activity',
            op: 'set',
            record_id: 'kayak',
            title: 'Kayaking',
            fields: [{ field: 'status', old: 'planned', new: 'skipped' }],
          },
        ],
        undoable: false,
        undone_at: '2026-11-02T10:00:00Z',
      }),
      eventOf({ id: 'made', kind: 'trip_created', summary: { title: 'Goa' }, undoable: false }),
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

const entries = async () => {
  const list = await screen.findByRole('list', { name: 'What changed on “Goa with friends”' });
  return within(list)
    .getAllByRole('listitem')
    .filter((each) => each.parentElement === list);
};
const headlines = async () =>
  (await entries()).map((entry) => entry.querySelector('p')?.textContent);

describe('the history', () => {
  it('says what changed, newest first, each with what it did field by field', async () => {
    const { user, container } = renderApp('/m/travel/trips/goa/history');

    expect(await headlines()).toEqual([
      'Edited the booking “Beach hotel”',
      'Skipped “Kayaking”',
      'Planned the trip',
    ]);
    const [edited, skipped, made] = (await entries()) as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(skipped).getByText(/For Fri, Nov 6$/)).toBeInTheDocument();
    expect(within(skipped).getByText('Undone')).toBeInTheDocument();
    expect(within(skipped).queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
    // The trip's making can't be taken back.
    expect(within(made).queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();

    // A booking's status in a booking's words.
    await user.click(within(edited).getByText('What changed?'));
    expect(within(edited).getByText('Status: As you entered it → You confirmed it')).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes a change back, which then shows as undone beside the undo itself', async () => {
    const { user } = renderApp('/m/travel/trips/goa/history');
    await user.click(
      await screen.findByRole('button', { name: 'Undo: Edited the booking “Beach hotel”' }),
    );

    expect(
      await screen.findByText('Taken back: everything it changed is as it was.'),
    ).toBeInTheDocument();
    expect(sent.filter((each) => each.method !== 'GET')).toEqual([
      expect.objectContaining({ method: 'POST', path: '/v1/travel/events/confirmed/undo' }),
    ]);
    expect(await screen.findByText('Took back: Edited the booking “Beach hotel”')).toBeVisible();
    const [undo, edited] = (await entries()) as [HTMLElement, HTMLElement];
    expect(within(undo).queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
    expect(within(edited).getByText('Undone')).toBeInTheDocument();
  });

  it("names a suggestion still as worded in the reader's words, its lines and headline alike", async () => {
    // As kept on the server: the rule's title when it was suggested, and its key.
    const towel = { title: 'Beach towel', suggestion_key: 'activity:beach:towel' };
    state.history = [
      eventOf({
        id: 'removed',
        kind: 'checklist_removed',
        summary: { ...towel, day: TODAY },
        changes: [{ entity: 'checklist', op: 'remove', record_id: 'towel', ...towel }],
      }),
      eventOf({
        id: 'renamed',
        kind: 'checklist_edited',
        summary: { title: 'My towel', suggestion_key: null },
        changes: [{ entity: 'checklist', op: 'set', record_id: 'mine', title: 'My towel' }],
      }),
    ];
    const { user } = renderApp('/m/travel/trips/goa/history');

    expect(await headlines()).toEqual(['Removed “Towel” from the lists', 'Edited “My towel”']);
    const [removed] = (await entries()) as [HTMLElement];
    await user.click(within(removed).getByText('What changed?'));
    expect(within(removed).getByText('Removed “Towel”')).toBeVisible();
  });

  it('says plainly why an undo is refused, and what to do instead', async () => {
    state.refuseUndo = 'TRAVEL_UNDO_STALE';
    const { user } = renderApp('/m/travel/trips/goa/history');
    await user.click(
      await screen.findByRole('button', { name: 'Undo: Edited the booking “Beach hotel”' }),
    );

    const [edited] = (await entries()) as [HTMLElement];
    expect(await within(edited).findByRole('alert')).toHaveTextContent(
      "Something it touched has changed since, so it can't be undone. Only the latest change " +
        'to something can be undone. Undo its newer changes first, or change it back yourself.',
    );
    // Nothing was taken back, and it can be tried again.
    expect(within(edited).queryByText('Undone')).not.toBeInTheDocument();
    expect(within(edited).getByRole('button', { name: /^Undo/ })).toBeEnabled();
  });
});
