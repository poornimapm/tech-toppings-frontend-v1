import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  activityOf,
  bookingOf,
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
    trip: tripOf(),
    activities: [
      activityOf({ id: 'checkin', title: 'Check in', kind: 'stay', booking_id: 'hotel' }),
      activityOf({ id: 'fort', title: 'Fort visit', day: '2026-11-07' }),
    ],
    items: [],
    suggestions: [],
    bookings: [
      bookingOf({
        id: 'hotel',
        title: 'Beach hotel',
        reference: 'HX-2041',
        starts_at: '2026-11-05T14:00',
        ends_at: '2026-11-09T11:00',
        link: 'https://example.com/my-booking',
      }),
      bookingOf({ id: 'flight', title: 'Flight home', kind: 'flight', status: 'confirmed' }),
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
const card = async (title: string) => {
  const list = await screen.findByRole('list', { name: 'Bookings' });
  const found = within(list)
    .getAllByRole('listitem')
    .find((each) => each.parentElement === list && each.textContent.includes(title));
  if (!found) throw new Error(`No booking “${title}”`);
  return found;
};

describe('the bookings', () => {
  it('lists them as entered, each with how sure it is and what goes with it', async () => {
    const { container } = renderApp('/m/travel/trips/goa/bookings');

    const hotel = await card('Beach hotel');
    expect(within(hotel).getByText('As you entered it')).toBeInTheDocument();
    expect(hotel).toHaveTextContent('Hotel · Nov 5 2:00 PM – Nov 9 11:00 AM · Ref. HX-2041');
    expect(
      within(hotel).getByRole('link', { name: "Open the booking's page (opens in a new tab)" }),
    ).toHaveAttribute('href', 'https://example.com/my-booking');
    expect(await within(hotel).findByRole('link', { name: /Check in/ })).toHaveAttribute(
      'href',
      `/m/travel/trips/goa/itinerary?day=${TODAY}`,
    );

    const flight = await card('Flight home');
    expect(within(flight).getByText('You confirmed it')).toBeInTheDocument();
    expect(within(flight).getByText('No activity goes with it yet.')).toBeInTheDocument();
    expect(screen.getByText(/the app doesn't look anything up/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("never calls one unlinked while what goes with it can't be told", async () => {
    state.activitiesFail = true;
    renderApp('/m/travel/trips/goa/bookings');

    const hotel = await card('Beach hotel');
    expect(
      await within(hotel).findByText("Which activities go with it couldn't be loaded."),
    ).toBeVisible();
    expect(within(hotel).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('No activity goes with it yet.')).not.toBeInTheDocument();
    // Nothing to link to until it is known what is free.
    expect(screen.queryByRole('button', { name: 'Link to an activity' })).not.toBeInTheDocument();
  });

  it('adds one by hand, with only what was typed, once however often Save is pressed', async () => {
    const { user } = renderApp('/m/travel/trips/goa/bookings');
    await user.click(await screen.findByRole('button', { name: 'Add a booking' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a booking' });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Kind' }), 'tour');
    await user.type(within(dialog).getByRole('textbox', { name: 'What' }), 'Spice farm tour');
    await user.type(within(dialog).getByRole('textbox', { name: 'Reference (optional)' }), 'SF-77');
    await user.type(within(dialog).getByRole('textbox', { name: 'Link (optional)' }), 'not a link');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      within(dialog).getByText('A web address that starts with http:// or https://.'),
    ).toBeInTheDocument();
    await user.clear(within(dialog).getByRole('textbox', { name: 'Link (optional)' }));
    await user.click(
      within(dialog).getByRole('switch', { name: "I checked it with whoever it's with" }),
    );
    await user.dblClick(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Spice farm tour” is kept with the trip.')).toBeInTheDocument();
    const added = writes().filter((each) => each.path === '/v1/travel/trips/goa/bookings');
    expect(added).toHaveLength(1);
    expect(added[0]?.key).toBeTruthy();
    expect(added[0]?.body).toEqual({
      kind: 'tour',
      title: 'Spice farm tour',
      reference: 'SF-77',
      starts_at: null,
      ends_at: null,
      location: null,
      link: null,
      notes: null,
      status: 'confirmed',
    });
    expect(within(await card('Spice farm tour')).getByText('You confirmed it')).toBeVisible();
  });

  it('edits one as of its revision, saying its status only once it changes', async () => {
    const { user } = renderApp('/m/travel/trips/goa/bookings');
    await user.click(await screen.findByRole('button', { name: 'Edit “Beach hotel”' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Beach hotel”' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Where (optional)' }), 'Candolim');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Beach hotel” is saved.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: '/v1/travel/bookings/hotel',
        body: {
          kind: 'hotel',
          title: 'Beach hotel',
          reference: 'HX-2041',
          starts_at: '2026-11-05T14:00',
          ends_at: '2026-11-09T11:00',
          location: 'Candolim',
          link: 'https://example.com/my-booking',
          notes: null,
          revision_no: 1,
        },
      }),
    ]);
  });

  it('links one to an activity and unlinks it, and keeps one an activity goes with', async () => {
    const { user } = renderApp('/m/travel/trips/goa/bookings');
    const flight = await card('Flight home');
    await user.click(within(flight).getByRole('button', { name: 'Link to an activity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link “Flight home” to an activity' });
    // Only an activity that goes with no booking yet.
    const choose = within(dialog).getByRole('combobox', { name: 'Activity' });
    expect(
      within(choose)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Fort visit · Sat, Nov 7']);
    await user.click(within(dialog).getByRole('button', { name: 'Link' }));

    expect(await screen.findByText('“Fort visit” now goes with “Flight home”.')).toBeVisible();
    expect(writes().at(-1)).toMatchObject({
      path: '/v1/travel/activities/fort',
      body: { booking_id: 'flight', revision_no: 1 },
    });
    expect(await within(flight).findByRole('link', { name: /Fort visit/ })).toBeInTheDocument();

    await user.click(within(flight).getByRole('button', { name: 'Unlink “Fort visit”' }));
    expect(
      await screen.findByText('“Fort visit” no longer goes with “Flight home”.'),
    ).toBeVisible();
    expect(writes().at(-1)?.body).toEqual({ booking_id: null, revision_no: 2 });

    // An activity still goes with the hotel: it stays, and why is said.
    await user.click(screen.getByRole('button', { name: 'Remove “Beach hotel”' }));
    expect(
      await screen.findByText('An activity still goes with this booking: unlink it first.'),
    ).toBeVisible();
    expect(state.bookings?.map((each) => each.id)).toEqual(['hotel', 'flight']);
  });

  it('removes one with a moment to take it back, and says why, once its card has gone, if it is refused', async () => {
    const { user } = renderApp('/m/travel/trips/goa/bookings');
    const flight = await card('Flight home');
    await user.click(within(flight).getByRole('button', { name: 'Remove “Flight home”' }));
    expect(await screen.findByText('Removed “Flight home”.')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Remove “Flight home”' }),
      ).not.toBeInTheDocument();
    });

    // Changed again elsewhere meanwhile: the undo is refused, and that is said.
    state.refuseUndo = 'TRAVEL_UNDO_STALE';
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByText("Something it touched has changed since, so it can't be undone."),
    ).toBeVisible();
    // The very event the removal answered.
    expect(writes().map(({ method, path }) => [method, path])).toEqual([
      ['DELETE', '/v1/travel/bookings/flight'],
      ['POST', '/v1/travel/events/event-1/undo'],
    ]);
    expect(state.bookings?.map((each) => each.id)).toEqual(['hotel']);
  });
});
