import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { entryOf, fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { budgetOf } from '@/modules/expenses/testing/fake-budgets';
import { goalOf } from '@/modules/expenses/testing/fake-goals';
import { iouOf } from '@/modules/expenses/testing/fake-ious';
import { resetNotificationState, server } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z'); // 8 October in Kolkata
let fake: ReturnType<typeof fakeExpenses>;

/** Two days of a Goa trip (2 to 6 October), and the cab home the day after. */
const GOA = [
  entryOf({
    id: 'e-hotel',
    title: 'Hotel',
    amount_minor: 400000,
    date: '2026-10-03',
    tags: ['goa'],
  }),
  entryOf({
    id: 'e-dinner',
    title: 'Dinner',
    amount_minor: 150000,
    date: '2026-10-06',
    tags: ['goa'],
  }),
  entryOf({ id: 'e-cab', title: 'Cab', amount_minor: 90000, date: '2026-10-07', tags: ['goa'] }),
];
const OCTOBER = budgetOf({
  id: 'b-month',
  name: 'October',
  scope: 'overall',
  tag: null,
  period: 'month',
  start: null,
  end: null,
  limit_minor: 100000,
});

async function open(path = '/m/expenses/plan') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Plan' });
  return view;
}

const card = (name: string) => within(screen.getByRole('article', { name }));

/** The first POST to a path ending in each of these reaches the server, but its reply is lost
 *  on the way back, as on a dropped connection. */
function loseFirstReply(...endings: string[]) {
  const real = globalThis.fetch;
  const left = new Set(endings);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const ending = [...left].find((path) => new URL(request.url).pathname.endsWith(path));
    if (request.method !== 'POST' || !ending) return real(request);
    left.delete(ending);
    await real(request);
    throw new TypeError('Failed to fetch');
  });
}

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/plan-page'),
    import('@/modules/expenses/entries-page'),
    import('@/platform/notifications/notifications-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  fake.state.entries.push(...GOA);
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('budgets', () => {
  it('shows how each budget stands, the meter said in words', async () => {
    const diwali = { id: 'b-diwali', name: 'Diwali', start: '2026-11-01', end: '2026-11-08' };
    fake.state.budgets = [budgetOf(), budgetOf(diwali), { ...OCTOBER, limit_minor: 1000000 }];
    await open();

    // October so far: rice, the bus pass and the trip. Eight of 31 days have gone.
    const month = await screen.findByRole('meter', { name: 'October' });
    expect(month).toHaveAttribute(
      'aria-valuetext',
      '71% used: ₹7,125 of ₹10,000, faster than an even pace',
    );
    // Below the warning share, yet ahead of an even pace: both are said where they can be seen.
    expect(card('October').getByText('Within the limit')).toBeInTheDocument();
    expect(
      card('October').getByText(
        'Faster than an even pace, which would have spent ₹2,580.64 by today',
      ),
    ).toBeInTheDocument();
    expect(card('October').getByText('₹119.79 a day left for 24 days')).toBeInTheDocument();
    // The trip is over: no pace, nothing left a day.
    expect(screen.getByRole('meter', { name: 'Goa trip' })).toHaveAttribute(
      'aria-valuetext',
      '55% used: ₹5,500 of ₹10,000',
    );
    expect(card('Goa trip').getByText('Ended Oct 6')).toBeInTheDocument();
    expect(card('Goa trip').getByText('Tagged goa · Oct 2 – Oct 6')).toBeInTheDocument();
    expect(card('Goa trip').queryByText(/a day left|even pace/)).toBeNull();
    // Not started yet: nothing is left "a day" before its first day.
    expect(card('Diwali').getByText('Starts Nov 1')).toBeInTheDocument();
    expect(card('Diwali').queryByText(/a day left|even pace/)).toBeNull();
  });

  it('adds a trip budget, sending the limit in minor units', async () => {
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Add budget' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a budget' }));
    expect(form.getByLabelText('Name')).toHaveValue('Monthly spending');
    await user.click(form.getByLabelText('A trip or event'));
    await user.type(form.getByLabelText('Tag'), 'goa');
    expect(form.getByLabelText('Name')).toHaveValue('goa'); // follows what it counts
    await user.click(form.getByLabelText('Chosen dates'));
    fireEvent.change(form.getByLabelText('From'), { target: { value: '2026-10-02' } });
    fireEvent.change(form.getByLabelText('To'), { target: { value: '2026-10-06' } });
    await user.type(form.getByLabelText('Limit (INR)'), '10,000');
    await user.clear(form.getByLabelText('Name'));
    await user.type(form.getByLabelText('Name'), 'Goa trip');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added the budget “Goa trip”')).toBeInTheDocument();
    const sent = fake.requests.filter((item) => item.method === 'POST' && item.path === '/budgets');
    // No warning share chosen: the server's usual one applies.
    expect(sent.map((item) => item.body)).toEqual([
      {
        name: 'Goa trip',
        scope: 'tag',
        category_id: null,
        tag: 'goa',
        period: 'custom',
        start: '2026-10-02',
        end: '2026-10-06',
        limit_minor: 1000000,
      },
    ]);
    expect(await screen.findByRole('meter', { name: 'Goa trip' })).toHaveAttribute(
      'aria-valuetext',
      '55% used: ₹5,500 of ₹10,000',
    );
  });

  it('says what is missing before anything is sent', async () => {
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Add budget' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a budget' }));
    await user.click(form.getByLabelText('One category'));
    await user.click(form.getByLabelText('Chosen dates'));
    fireEvent.change(form.getByLabelText('To'), { target: { value: '2026-10-01' } });
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await form.findByText('Choose a category.')).toBeInTheDocument();
    expect(form.getByText("The last day can't be before the first.")).toBeInTheDocument();
    expect(form.getByText('Enter a limit, like 5000.')).toBeInTheDocument();
    expect(fake.requests.filter((item) => item.method === 'POST')).toEqual([]);
  });

  it('opens the entries behind a budget, with the same total', async () => {
    fake.state.budgets = [budgetOf()];
    const { user, router } = await open();
    const entries = await screen.findByRole('link', { name: 'See entries for Goa trip' });
    expect(entries).toHaveAttribute(
      'href',
      '/m/expenses?show=expense&from=2026-10-02&to=2026-10-06&tag=goa',
    );

    await user.click(entries);

    await screen.findByRole('heading', { level: 1, name: 'Expenses' });
    expect(router.state.location.search).toBe(
      '?show=expense&from=2026-10-02&to=2026-10-06&tag=goa',
    );
    const pill = await screen.findByRole('button', { name: 'Remove filter: Tagged goa' });
    await waitFor(async () => {
      const spent = await screen.findByText('Spent', { selector: 'dt' });
      expect(spent.nextElementSibling).toHaveTextContent('₹5,500');
    });
    expect(screen.getByRole('link', { name: 'Hotel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cab' })).toBeNull();
    await user.click(pill);
    await waitFor(() => {
      expect(router.state.location.search).not.toContain('tag=');
    });
  });

  it('picks out the budget a link points at', async () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    fake.state.budgets = [budgetOf(), OCTOBER];
    await open('/m/expenses/plan?show=budgets&focus=b-goa');

    const trip = await screen.findByRole('article', { name: 'Goa trip' });

    expect(trip).toHaveAttribute('id', 'focus-b-goa');
    expect(trip).toHaveClass('ring-2');
    expect(screen.getByRole('article', { name: 'October' })).not.toHaveClass('ring-2');
    await waitFor(() => {
      expect(scrolled.mock.contexts).toContain(trip);
    });
  });

  it('changes a budget and deletes it after asking', async () => {
    fake.state.entries = fake.state.entries.filter((entry) => !entry.tags.includes('goa'));
    fake.state.budgets = [OCTOBER]; // ₹725 of ₹1,000 so far
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Edit October' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit budget' }));
    expect(form.getByLabelText('Warn me')).toHaveValue('0.8'); // its own share, offered too
    await user.clear(form.getByLabelText('Limit (INR)'));
    await user.type(form.getByLabelText('Limit (INR)'), '800');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved the budget “October”')).toBeInTheDocument();
    const patch = fake.requests.find((item) => item.method === 'PATCH');
    expect(patch).toMatchObject({
      path: '/budgets/b-month',
      body: { name: 'October', scope: 'overall', limit_minor: 80000, alert_threshold: 0.8 },
    });
    // ₹725 of ₹800 is past the 80% warning.
    expect(await card('October').findByText('Nearly spent')).toBeInTheDocument();

    // Focus moves to the safe choice, and back to the button when the question is put away.
    await user.click(screen.getByRole('button', { name: 'Delete October' }));
    expect(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Keep it' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Delete October' })).toHaveFocus();

    await user.keyboard('{Enter}');
    const ask = within(screen.getByRole('alert'));
    expect(
      ask.getByText('Delete the budget “October”? Your entries stay as they are.'),
    ).toBeInTheDocument();
    await user.click(ask.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No budgets yet')).toBeInTheDocument();
    expect(fake.requests.some((item) => item.method === 'DELETE')).toBe(true);
  });

  it("words a budget's notification and leads to the budget", async () => {
    resetNotificationState([
      {
        id: 'n-budget',
        type: 'expenses.budget_near',
        params: {
          module: 'expenses',
          budget_id: 'b-goa',
          name: 'Goa trip',
          spent_minor: 800000,
          limit_minor: 1000000,
          currency: 'INR',
          pct: 80,
        },
        read: false,
        at: '2026-10-08T10:00:00Z',
      },
    ]);
    renderApp('/notifications');

    const notice = await screen.findByRole('link', {
      name: '“Goa trip” budget: 80% used, ₹8,000 of ₹10,000',
    });
    expect(notice).toHaveAttribute('href', '/m/expenses/plan?show=budgets&focus=b-goa');
  });

  // A page and then its dialog to check: give axe the time it needs on a loaded machine.
  it('has no detectable accessibility violations', { timeout: 60_000 }, async () => {
    fake.state.budgets = [budgetOf(), OCTOBER];
    const { container, user } = await open();
    await screen.findByRole('meter', { name: 'October' });

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Add budget' }));
    await screen.findByRole('dialog', { name: 'Add a budget' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('goals', () => {
  /** Grows with what is kept from 1 October: ₹50,000 in, ₹7,125 out so far. */
  const CUSHION = goalOf({
    id: 'g-cushion',
    name: 'Cushion',
    funding: 'net_savings',
    since: '2026-10-01',
    target_minor: 10000000,
    target_date: null,
  });
  const UUID = /^[0-9a-f-]{36}$/;

  it('shows how far each goal has come, the meter said in words', async () => {
    fake.state.goals = [goalOf({ saved_minor: 1200000 }), CUSHION];
    await open('/m/expenses/plan?show=goals');

    expect(await screen.findByRole('meter', { name: 'Bike' })).toHaveAttribute(
      'aria-valuetext',
      '24% saved: ₹12,000 of ₹50,000',
    );
    // ₹38,000 left over October to March, six months: rounded up so it is enough.
    expect(
      card('Bike').getByText('₹6,333.34 a month to reach it by Mar 31, 2027'),
    ).toBeInTheDocument();
    expect(card('Bike').getByText('Money you put in')).toBeInTheDocument();
    // What the entries kept since 1 October counts by itself: nothing to add by hand.
    expect(screen.getByRole('meter', { name: 'Cushion' })).toHaveAttribute(
      'aria-valuetext',
      '42% saved: ₹42,875 of ₹100,000',
    );
    expect(card('Cushion').getByText('Grows with what you keep')).toBeInTheDocument();
    expect(card('Cushion').getByText("What you've kept since Oct 1, 2026")).toBeInTheDocument();
    expect(card('Cushion').getByText('₹57,125 to go')).toBeInTheDocument();
    expect(card('Cushion').queryByRole('button', { name: /money/ })).toBeNull();
  });

  it('adds a goal and puts money in and out, each form with its own key', async () => {
    const { user, router } = await open();
    await user.click(screen.getByRole('button', { name: 'Goals' }));
    expect(router.state.location.search).toBe('?show=goals');

    await user.click(await screen.findByRole('button', { name: 'Add goal' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a goal' }));
    await user.type(form.getByLabelText('What are you saving for?'), 'Bike');
    await user.type(form.getByLabelText('Target (INR)'), '50,000');
    fireEvent.change(form.getByLabelText('Reach it by'), { target: { value: '2027-03-31' } });
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Added the goal “Bike”')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Add money to Bike' }));
    let money = within(await screen.findByRole('dialog', { name: 'Money for “Bike”' }));
    await user.type(money.getByLabelText('Amount (INR)'), '12,000');
    await user.click(money.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Added ₹12,000 to “Bike”')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('meter', { name: 'Bike' })).toHaveAttribute(
        'aria-valuetext',
        '24% saved: ₹12,000 of ₹50,000',
      );
    });

    await user.click(screen.getByRole('button', { name: 'Take out money from Bike' }));
    money = within(await screen.findByRole('dialog', { name: 'Money for “Bike”' }));
    await user.type(money.getByLabelText('Amount (INR)'), '13000');
    await user.click(money.getByRole('button', { name: 'Take out' }));
    expect(await money.findByText('You can take out at most ₹12,000.')).toBeInTheDocument();
    await user.clear(money.getByLabelText('Amount (INR)'));
    await user.type(money.getByLabelText('Amount (INR)'), '2000');
    await user.click(money.getByRole('button', { name: 'Take out' }));
    expect(await screen.findByText('Took ₹2,000 out of “Bike”')).toBeInTheDocument();

    const made = fake.requests.filter((item) => item.method === 'POST' && item.path === '/goals');
    expect(made.map((item) => item.body)).toEqual([
      {
        name: 'Bike',
        target_minor: 5000000,
        target_date: '2027-03-31',
        funding: 'manual',
        since: '2026-10-08',
      },
    ]);
    const sent = fake.requests.filter((item) => item.path.endsWith('/contributions'));
    expect(sent.map((item) => item.body)).toEqual([
      { amount_minor: 1200000, date: '2026-10-08', note: null },
      { amount_minor: -200000, date: '2026-10-08', note: null },
    ]);
    const keys = [...made, ...sent].map((item) => item.key ?? '');
    expect(keys.every((key) => UUID.test(key))).toBe(true);
    expect(new Set(keys).size).toBe(3);
    expect(await screen.findByRole('meter', { name: 'Bike' })).toHaveAttribute(
      'aria-valuetext',
      '20% saved: ₹10,000 of ₹50,000',
    );
  });

  it('sends a save again with its key after a lost reply, and counts it once', async () => {
    loseFirstReply('/goals', '/contributions');
    const { user } = await open('/m/expenses/plan?show=goals');
    const unreachable = "Can't reach the server. Check your connection.";

    await user.click(await screen.findByRole('button', { name: 'Add goal' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a goal' }));
    await user.type(form.getByLabelText('What are you saving for?'), 'Bike');
    await user.type(form.getByLabelText('Target (INR)'), '50,000');
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await form.findByText(unreachable)).toBeInTheDocument();
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Added the goal “Bike”')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Add money to Bike' }));
    const money = within(await screen.findByRole('dialog', { name: 'Money for “Bike”' }));
    await user.type(money.getByLabelText('Amount (INR)'), '12,000');
    await user.click(money.getByRole('button', { name: 'Add' }));
    expect(await money.findByText(unreachable)).toBeInTheDocument();
    // Changed before sending again: the goal holds what the first send did, and says so.
    await user.clear(money.getByLabelText('Amount (INR)'));
    await user.type(money.getByLabelText('Amount (INR)'), '500');
    await user.click(money.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText('That was already saved. “Bike” now has ₹12,000.'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('meter', { name: 'Bike' })).toHaveAttribute(
      'aria-valuetext',
      '24% saved: ₹12,000 of ₹50,000',
    );
    const made = fake.requests.filter((item) => item.method === 'POST' && item.path === '/goals');
    const sent = fake.requests.filter((item) => item.path.endsWith('/contributions'));
    expect(sent.map((item) => (item.body as { amount_minor: number }).amount_minor)).toEqual([
      1200000, 50000,
    ]);
    for (const tries of [made, sent]) {
      expect(tries).toHaveLength(2);
      expect(new Set(tries.map((item) => item.key)).size).toBe(1);
    }
  });

  it('offers the latest goal when it changed elsewhere, then saves on that', async () => {
    const bike = goalOf();
    fake.state.goals = [bike];
    const { user } = await open('/m/expenses/plan?show=goals');
    await user.click(await screen.findByRole('button', { name: 'Edit Bike' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit goal' }));
    Object.assign(bike, { saved_minor: 50000, revision_no: 2 }); // ₹500 added on a phone

    await user.clear(form.getByLabelText('Target (INR)'));
    await user.type(form.getByLabelText('Target (INR)'), '60000');
    await user.click(form.getByRole('button', { name: 'Save' }));
    const conflict =
      'This goal was changed somewhere else. Reload it, then make your change again.';
    expect(await form.findByText(conflict)).toBeInTheDocument();
    await user.click(form.getByRole('button', { name: 'Reload goal' }));

    // A fresh form at the latest revision.
    await waitFor(() => {
      expect(screen.queryByText(conflict)).toBeNull();
    });
    const latest = within(screen.getByRole('dialog', { name: 'Edit goal' }));
    await user.clear(latest.getByLabelText('Target (INR)'));
    await user.type(latest.getByLabelText('Target (INR)'), '60000');
    await user.click(latest.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved the goal “Bike”')).toBeInTheDocument();
    const patches = fake.requests.filter((item) => item.method === 'PATCH');
    expect(patches.map((item) => item.body)).toMatchObject([
      { target_minor: 6000000, revision_no: 1 },
      { target_minor: 6000000, revision_no: 2 },
    ]);
  });

  it('says how much can still be taken out when the server knows less is saved', async () => {
    const bike = goalOf({ saved_minor: 1200000 });
    fake.state.goals = [bike];
    const { user } = await open('/m/expenses/plan?show=goals');
    await user.click(await screen.findByRole('button', { name: 'Take out money from Bike' }));
    const money = within(await screen.findByRole('dialog', { name: 'Money for “Bike”' }));
    Object.assign(bike, { saved_minor: 200000, revision_no: 2 }); // ₹10,000 taken out on a phone

    await user.type(money.getByLabelText('Amount (INR)'), '5000');
    await user.click(money.getByRole('button', { name: 'Take out' }));

    expect(await money.findByText('You can take out at most ₹2,000.')).toBeInTheDocument();
  });

  it('changes a goal as of the revision edited, and deletes it with a way back', async () => {
    fake.state.goals = [goalOf({ saved_minor: 1200000, revision_no: 3 })];
    const { user } = await open('/m/expenses/plan?show=goals');

    await user.click(await screen.findByRole('button', { name: 'Edit Bike' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit goal' }));
    await user.clear(form.getByLabelText('Target (INR)'));
    await user.type(form.getByLabelText('Target (INR)'), '12000');
    fireEvent.change(form.getByLabelText('Reach it by'), { target: { value: '' } });
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved the goal “Bike”')).toBeInTheDocument();
    expect(fake.requests.find((item) => item.method === 'PATCH')).toMatchObject({
      path: '/goals/g-bike',
      body: { target_minor: 1200000, target_date: null, revision_no: 3 },
    });
    expect(await card('Bike').findByText('Reached')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Bike' }));
    expect(await screen.findByText('No goals yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('article', { name: 'Bike' })).toBeInTheDocument();
  });

  it("words a goal's notification and leads to the goal", async () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    resetNotificationState([
      {
        id: 'n-goal',
        type: 'expenses.goal_reached',
        params: {
          module: 'expenses',
          goal_id: 'g-cushion',
          name: 'Cushion',
          target_minor: 10000000,
          currency: 'INR',
        },
        read: false,
        at: '2026-10-08T10:00:00Z',
      },
    ]);
    fake.state.goals = [goalOf(), CUSHION];
    const { user } = renderApp('/notifications');

    const notice = await screen.findByRole('link', {
      name: 'You reached your goal “Cushion”: ₹100,000 saved',
    });
    expect(notice).toHaveAttribute('href', '/m/expenses/plan?show=goals&focus=g-cushion');
    await user.click(notice);

    const cushion = await screen.findByRole('article', { name: 'Cushion' });
    expect(cushion).toHaveClass('ring-2');
    await waitFor(() => {
      expect(scrolled.mock.contexts).toContain(cushion);
    });
  });

  it('has no detectable accessibility violations', { timeout: 60_000 }, async () => {
    fake.state.goals = [goalOf({ saved_minor: 1200000 }), CUSHION];
    const { container, user } = await open('/m/expenses/plan?show=goals');
    await screen.findByRole('meter', { name: 'Cushion' });

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Take out money from Bike' }));
    await screen.findByRole('dialog', { name: 'Money for “Bike”' });
    expect(await axe(document.body)).toHaveNoViolations();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Add goal' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a goal' }));
    await user.click(form.getByLabelText('From what I keep'));
    expect(form.getByLabelText('Count from')).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('loans', () => {
  const LOANS = '/m/expenses/plan?show=loans';
  const UUID = /^[0-9a-f-]{36}$/;
  /** Ravi: ₹1,000 lent on 1 October with ₹250 paid back, and ₹500 more on the 6th, due the 11th;
   *  ₹200 borrowed from Meena, due yesterday; and Priya, who paid back all she owed. */
  function lend() {
    fake.state.ious.push(
      iouOf({
        settled_minor: 25000,
        outstanding_minor: 75000,
        settlements: [{ key: 'pay-ravi-1', amount_minor: 25000, date: '2026-10-05', note: null }],
        revision_no: 2,
      }),
      iouOf({
        id: 'iou-ravi-2',
        amount_minor: 50000,
        outstanding_minor: 50000,
        date: '2026-10-06',
        due_on: '2026-10-11',
      }),
      iouOf({
        id: 'iou-meena',
        counterparty: 'Meena',
        counterparty_key: 'meena',
        direction: 'borrowed',
        amount_minor: 20000,
        outstanding_minor: 20000,
        due_on: '2026-10-07',
      }),
      iouOf({
        id: 'iou-priya',
        counterparty: 'Priya',
        counterparty_key: 'priya',
        date: '2026-09-30',
        amount_minor: 7000,
        settled_minor: 7000,
        outstanding_minor: 0,
        settled_on: '2026-10-03',
        settlements: [{ key: 'pay-priya', amount_minor: 7000, date: '2026-10-03', note: null }],
      }),
    );
  }

  /** Opens the loans, then Ravi's sheet; his first loan's card. */
  async function openRavi(path = LOANS) {
    const view = await open(path);
    await view.user.click(await screen.findByRole('button', { name: 'Ravi' }));
    const sheet = within(await screen.findByRole('dialog', { name: 'Ravi' }));
    const first = within(
      await sheet.findByRole('article', { name: 'You lent ₹1,000 on Oct 1, 2026' }),
    );
    return { ...view, sheet, first };
  }

  const tile = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling;
  const settlements = (id: string) =>
    fake.requests.filter((item) => item.path === `/ious/${id}/settlements`);

  it('shows what is owed each way, and where the user stands with each person', async () => {
    lend();
    await open(LOANS);

    await screen.findByRole('button', { name: 'Ravi' });
    expect(tile('Owed to you')).toHaveTextContent('₹1,250');
    expect(tile('You owe')).toHaveTextContent('₹200');
    // Open first, the soonest due first; then those all paid back.
    const people = within(screen.getByRole('region', { name: 'People' })).getAllByRole('button');
    expect(people.map((person) => person.textContent)).toEqual([
      expect.stringContaining('Meena'),
      expect.stringContaining('Ravi'),
      expect.stringContaining('Priya'),
    ]);
    const [meena, ravi, priya] = people;
    expect(meena).toHaveAccessibleDescription('You owe ₹200 1 open loan · was due yesterday');
    expect(
      within(screen.getByRole('button', { name: 'Meena' })).getByText('Overdue'),
    ).toBeInTheDocument();
    expect(ravi).toHaveAccessibleDescription('Owes you ₹1,250 2 open loans · next due in 3 days');
    expect(priya).toHaveAccessibleDescription('All paid back');
  });

  it("opens a person's loans and records a payment, what is left filled in", async () => {
    lend();
    const { user, sheet, first } = await openRavi();

    expect(sheet.getByText('Owes you ₹1,250')).toBeInTheDocument();
    expect(first.getByText('₹750 left')).toBeInTheDocument();
    expect(first.getByText('Paid back ₹250 on Oct 5, 2026')).toBeInTheDocument();
    const soon = within(sheet.getByRole('article', { name: 'You lent ₹500 on Oct 6, 2026' }));
    expect(soon.getByText('₹500 left · due in 3 days')).toBeInTheDocument();

    await user.click(first.getByRole('button', { name: 'Record payment' }));
    const form = within(await screen.findByRole('dialog', { name: 'Ravi paid you back' }));
    expect(form.getByText('₹750 left of ₹1,000')).toBeInTheDocument();
    expect(form.getByLabelText('Amount (INR)')).toHaveValue('750.00');
    await user.clear(form.getByLabelText('Amount (INR)'));
    await user.type(form.getByLabelText('Amount (INR)'), '300');
    await user.click(form.getByRole('button', { name: 'Record payment' }));

    // Said in the sheet: a toast would be hidden behind it.
    expect(await sheet.findByText('Saved: Ravi owes you ₹450.')).toBeInTheDocument();
    const [sent] = settlements('iou-ravi');
    expect(sent?.body).toEqual({ amount_minor: 30000, date: '2026-10-08', note: null });
    expect(sent?.key).toMatch(UUID);
    expect(await first.findByText('₹450 left')).toBeInTheDocument();
    expect(first.getByText('Paid back ₹300 on Oct 8, 2026')).toBeInTheDocument();
    expect(await sheet.findByText('Owes you ₹950')).toBeInTheDocument();

    // A new loan from here is with the same person.
    await user.click(sheet.getByRole('button', { name: 'Add loan' }));
    const add = within(await screen.findByRole('dialog', { name: 'Add a loan' }));
    expect(add.getByLabelText('Who')).toHaveValue('Ravi');
  });

  it('undoes a payment once, with a correction of the same amount', async () => {
    lend();
    const { user, sheet, first } = await openRavi();
    const undo = first.getByRole('button', { name: 'Undo payment' });
    expect(undo).toHaveAccessibleDescription('Paid back ₹250 on Oct 5, 2026');

    await user.click(undo);

    expect(await sheet.findByText('Undid the payment of ₹250')).toBeInTheDocument();
    expect(await first.findByText('₹1,000 left')).toBeInTheDocument();
    expect(first.getByText(/^Corrected by .₹250 on Oct 8, 2026$/)).toBeInTheDocument();
    expect(first.getByText('Undone')).toBeInTheDocument();
    expect(first.queryByRole('button', { name: 'Undo payment' })).toBeNull();
    expect(settlements('iou-ravi')).toEqual([
      {
        method: 'POST',
        path: '/ious/iou-ravi/settlements',
        body: { amount_minor: -25000, date: '2026-10-08' },
        key: 'undo:pay-ravi-1',
      },
    ]);
  });

  it('says how much is left when a payment is more than that', async () => {
    lend();
    const { user, first } = await openRavi();
    await user.click(first.getByRole('button', { name: 'Record payment' }));
    const form = within(await screen.findByRole('dialog', { name: 'Ravi paid you back' }));
    const amount = form.getByLabelText('Amount (INR)');

    await user.clear(amount);
    await user.type(amount, '800');
    await user.click(form.getByRole('button', { name: 'Record payment' }));
    expect(
      await form.findByText("That's more than is left on this loan: ₹750."),
    ).toBeInTheDocument();

    // ₹700 more was paid back on a phone meanwhile: the server knows only ₹50 is left.
    const stored = fake.state.ious.find((iou) => iou.id === 'iou-ravi');
    Object.assign(stored ?? {}, { settled_minor: 95000, outstanding_minor: 5000, revision_no: 3 });
    await user.clear(amount);
    await user.type(amount, '700');
    await user.click(form.getByRole('button', { name: 'Record payment' }));

    expect(
      await form.findByText("That's more than is left on this loan: ₹50."),
    ).toBeInTheDocument();
    expect(settlements('iou-ravi')).toHaveLength(1);
  });

  it('sends a payment again with its key after a lost reply, and counts it once', async () => {
    lend();
    loseFirstReply('/settlements');
    const { user, sheet, first } = await openRavi();
    await user.click(first.getByRole('button', { name: 'Record payment' }));
    const form = within(await screen.findByRole('dialog', { name: 'Ravi paid you back' }));

    await user.click(form.getByRole('button', { name: 'Record payment' }));
    expect(
      await form.findByText("Can't reach the server. Check your connection."),
    ).toBeInTheDocument();
    await user.click(form.getByRole('button', { name: 'Record payment' }));

    expect(
      await sheet.findByText('Saved: the loan with Ravi is paid back in full.'),
    ).toBeInTheDocument();
    const sent = settlements('iou-ravi');
    expect(sent).toHaveLength(2);
    expect(new Set(sent.map((item) => item.key)).size).toBe(1);
    expect(fake.state.ious.find((iou) => iou.id === 'iou-ravi')?.settlements).toHaveLength(2);
  });

  it('notes a new loan with its key, and shows where the user stands', async () => {
    const { user } = await open(LOANS);
    expect(await screen.findByText('No loans yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add loan' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a loan' }));
    await user.click(form.getByLabelText('I borrowed'));
    await user.type(form.getByLabelText('Who'), 'Meena');
    await user.type(form.getByLabelText('Amount (INR)'), '2,000');
    fireEvent.change(form.getByLabelText('To be paid back by (optional)'), {
      target: { value: '2026-10-20' },
    });
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved: you owe Meena ₹2,000.')).toBeInTheDocument();
    const made = fake.requests.filter((item) => item.method === 'POST' && item.path === '/ious');
    expect(made.map((item) => item.body)).toEqual([
      {
        counterparty: 'Meena',
        direction: 'borrowed',
        amount_minor: 200000,
        date: '2026-10-08',
        due_on: '2026-10-20',
        note: null,
      },
    ]);
    expect(made[0]?.key).toMatch(UUID);
    expect(await screen.findByRole('button', { name: 'Meena' })).toHaveAccessibleDescription(
      'You owe ₹2,000 1 open loan · next due in 12 days',
    );
    expect(tile('You owe')).toHaveTextContent('₹2,000');
  });

  it('changes a loan never below what was paid back, and deletes one after asking', async () => {
    lend();
    const { user, sheet, first } = await openRavi();

    await user.click(first.getByRole('button', { name: 'Edit' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit loan' }));
    const amount = form.getByLabelText('Amount (INR)');
    expect(amount).toHaveValue('1000.00');
    await user.clear(amount);
    await user.type(amount, '200');
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(
      await form.findByText("₹250 has been paid back already: the amount can't be less."),
    ).toBeInTheDocument();
    await user.clear(amount);
    await user.type(amount, '1200');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await sheet.findByText('Saved: Ravi owes you ₹950.')).toBeInTheDocument();
    expect(fake.requests.filter((item) => item.method === 'PATCH')).toMatchObject([
      {
        path: '/ious/iou-ravi',
        body: {
          counterparty: 'Ravi',
          direction: 'lent',
          amount_minor: 120000,
          date: '2026-10-01',
          due_on: null,
          note: null,
          revision_no: 2,
        },
      },
    ]);

    const soon = within(sheet.getByRole('article', { name: 'You lent ₹500 on Oct 6, 2026' }));
    await user.click(soon.getByRole('button', { name: 'Delete' }));
    const ask = within(soon.getByRole('alert'));
    expect(
      ask.getByText('Delete this loan? What was paid back on it goes too.'),
    ).toBeInTheDocument();
    expect(ask.getByRole('button', { name: 'Keep it' })).toHaveFocus();
    await user.click(ask.getByRole('button', { name: 'Delete' }));

    expect(await sheet.findByText('Deleted the loan with Ravi')).toBeInTheDocument();
    await waitFor(() => {
      expect(sheet.queryByRole('article', { name: 'You lent ₹500 on Oct 6, 2026' })).toBeNull();
    });
    expect(fake.requests.some((item) => item.method === 'DELETE')).toBe(true);
  });

  it("words a loan's reminder and opens that person's loans at it", async () => {
    lend();
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    const reminder = { module: 'expenses', reminder_id: 'r-1', currency: 'INR' };
    resetNotificationState([
      {
        id: 'n-lent',
        type: 'expenses.iou_due_lent',
        params: {
          ...reminder,
          due_on: '2026-10-11',
          iou_id: 'iou-ravi-2',
          person: 'Ravi',
          outstanding_minor: 50000,
        },
        read: false,
        at: '2026-10-08T03:30:00Z',
      },
      {
        id: 'n-borrowed',
        type: 'expenses.iou_due_borrowed',
        params: {
          ...reminder,
          due_on: '2026-10-07',
          iou_id: 'iou-meena',
          person: 'Meena',
          outstanding_minor: 20000,
        },
        read: false,
        at: '2026-10-06T03:30:00Z',
      },
    ]);
    const { user } = renderApp('/notifications');

    expect(
      await screen.findByRole('link', { name: "You're due to pay Meena back ₹200 by October 7" }),
    ).toHaveAttribute('href', '/m/expenses/plan?show=loans&focus=iou-meena');
    const notice = screen.getByRole('link', {
      name: 'Ravi is due to pay you back ₹500 by October 11',
    });
    expect(notice).toHaveAttribute('href', '/m/expenses/plan?show=loans&focus=iou-ravi-2');
    await user.click(notice);

    const sheet = within(await screen.findByRole('dialog', { name: 'Ravi' }));
    const loan = await sheet.findByRole('article', { name: 'You lent ₹500 on Oct 6, 2026' });
    expect(loan).toHaveClass('ring-2');
    expect(sheet.getByRole('article', { name: 'You lent ₹1,000 on Oct 1, 2026' })).not.toHaveClass(
      'ring-2',
    );
    await waitFor(() => {
      expect(scrolled.mock.contexts).toContain(loan);
    });
  });

  // The page, the sheet over it, then a form over that: give axe the time it needs.
  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    lend();
    const { container, user } = await open(LOANS);
    await screen.findByRole('button', { name: 'Ravi' });

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Ravi' }));
    const sheet = within(await screen.findByRole('dialog', { name: 'Ravi' }));
    const first = await sheet.findByRole('article', { name: 'You lent ₹1,000 on Oct 1, 2026' });
    expect(await axe(document.body)).toHaveNoViolations();

    await user.click(within(first).getByRole('button', { name: 'Record payment' }));
    await screen.findByRole('dialog', { name: 'Ravi paid you back' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
