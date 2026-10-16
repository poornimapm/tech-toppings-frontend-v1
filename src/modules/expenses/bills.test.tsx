import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { entryOf, fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { ruleOf, suggestionOf } from '@/modules/expenses/testing/fake-bills';
import { resetNotificationState, server } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z'); // 8 October in Kolkata
let fake: ReturnType<typeof fakeExpenses>;

const BUS = ruleOf();
const template = (changes: Partial<typeof BUS.template>) => ({ ...BUS.template, ...changes });
/** One rule for each part of the agenda, and the bus pass due in two days. */
const AGENDA = [
  ruleOf({
    id: 'r-dog',
    template: template({ title: 'Dog food', amount_minor: 150000, category_id: 'c-pets' }),
    cadence: { unit: 'month', every: 1, anchor: '2026-09-06' },
    next_run: '2026-10-06',
  }),
  ruleOf({
    id: 'r-pay',
    template: template({
      kind: 'income',
      title: 'Salary',
      amount_minor: 5000000,
      category_id: 'salary',
    }),
    cadence: { unit: 'month', every: 1, anchor: '2026-09-08' },
    next_run: '2026-10-08',
    mode: 'auto_create',
  }),
  BUS,
  ruleOf({
    id: 'r-metro',
    template: template({ title: 'Metro card', amount_minor: 250000 }),
    cadence: { unit: 'year', every: 1, anchor: '2027-01-15' },
    next_run: '2027-01-15',
  }),
  ruleOf({
    id: 'r-veg',
    template: template({ title: 'Vegetable box', amount_minor: 40000, category_id: 'groceries' }),
    cadence: { unit: 'week', every: 2, anchor: '2026-10-01' },
    next_run: '2026-10-15',
    mode: 'auto_create',
    active: false,
  }),
];
const NEWSPAPER = suggestionOf({
  signature: 'expense|newspaper|month',
  template: { ...suggestionOf().template, title: 'Newspaper', amount_minor: 30000 },
  cadence: { unit: 'month', every: 1, anchor: '2026-11-01' },
  count: 3,
  last_on: '2026-10-01',
});

async function open(path = '/m/expenses/plan?show=bills') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 2, name: 'Bills and repeats' });
  return view;
}

const card = (name: string) => within(screen.getByRole('article', { name }));
/** A rule's card, found only in that part of the agenda. */
const placed = (group: string, name: string) =>
  within(within(screen.getByRole('region', { name: group })).getByRole('article', { name }));

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/plan-page'),
    import('@/modules/expenses/entries-page'),
    import('@/modules/expenses/entry-page'),
    import('@/platform/notifications/notifications-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('bills', () => {
  it('lays out an agenda by when each is next due, in words', async () => {
    fake.state.rules = structuredClone(AGENDA);
    await open();

    await screen.findByRole('article', { name: 'Bus pass' });
    const groups = within(screen.getByRole('region', { name: 'Bills and repeats' }));
    expect(groups.getAllByRole('heading', { level: 3 }).map((item) => item.textContent)).toEqual([
      'Overdue',
      'Today',
      'This week',
      'Later',
      'Paused',
    ]);
    // A bill stays due until it is paid, and says so in words, not only by its place.
    expect(placed('Overdue', 'Dog food').getByText('was due 2 days ago')).toBeInTheDocument();
    expect(placed('This week', 'Bus pass').getByText(/^Every month/)).toHaveTextContent(
      'Every month · due in 2 days',
    );
    expect(placed('Later', 'Metro card').getByText(/^Every year/)).toBeInTheDocument();
    expect(card('Bus pass').getByText('Reminder')).toBeInTheDocument();
    // What adds itself needs no paying.
    expect(placed('Today', 'Salary').getByText('adds itself today')).toBeInTheDocument();
    expect(card('Salary').getByText('Added for you')).toBeInTheDocument();
    expect(card('Salary').getByText('+₹50,000')).toBeInTheDocument();
    expect(card('Salary').queryByRole('button', { name: /paid/ })).toBeNull();
    expect(placed('Paused', 'Vegetable box').getByText(/Every 2 weeks/)).toHaveTextContent(
      'paused',
    );
    // The switch is named for the setting; whether it is on is its own state.
    expect(
      card('Vegetable box').getByRole('switch', { name: 'Vegetable box active' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('marks a bill paid, sending its due date and the amount paid', async () => {
    fake.state.rules = [ruleOf()];
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Mark Bus pass paid' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Mark “Bus pass” paid' }));
    expect(dialog.getByText('Due Oct 10, 2026')).toBeInTheDocument();
    expect(dialog.getByLabelText('Amount paid (INR)')).toHaveValue('600.00');
    await user.clear(dialog.getByLabelText('Amount paid (INR)'));
    await user.type(dialog.getByLabelText('Amount paid (INR)'), '650');
    await user.click(dialog.getByRole('button', { name: 'Mark paid' }));

    expect(await screen.findByText('Marked “Bus pass” paid')).toBeInTheDocument();
    const sent = fake.requests.filter((item) => item.path.endsWith('/mark-paid'));
    expect(sent).toMatchObject([
      {
        path: '/recurring/r-bus/mark-paid',
        body: { due_on: '2026-10-10', amount_minor: 65000, date: '2026-10-08' },
      },
    ]);
    // On to the next month's.
    expect(await card('Bus pass').findByText('due in 33 days')).toBeInTheDocument();
    expect(fake.state.entries.at(-1)).toMatchObject({ title: 'Bus pass', recurring_id: 'r-bus' });
  });

  it('sets up a suggestion with its signature, and dismisses another', async () => {
    fake.state.suggestions = [suggestionOf(), NEWSPAPER];
    const { user } = await open();

    const panel = within(await screen.findByRole('region', { name: 'Looks like it repeats' }));
    expect(panel.getByText('Every week · seen 4 times, last on Oct 7')).toBeInTheDocument();
    await user.click(panel.getByRole('button', { name: 'Remind me of Milk' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add a bill or repeat' }));
    expect(form.getByLabelText('What is it?')).toHaveValue('Milk');
    expect(form.getByLabelText('Amount (INR)')).toHaveValue('60.00');
    expect(form.getByLabelText('Category')).toHaveValue('groceries');
    expect(form.getByLabelText('Weekly')).toBeChecked();
    expect(form.getByLabelText('First due date')).toHaveValue('2026-10-14');
    expect(form.getByLabelText('Remind me to pay')).toBeChecked();
    // Not chosen: the app's usual, which the server decides.
    expect(form.getByLabelText('Remind me')).toHaveDisplayValue("Shortly before it's due");
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added “Milk”')).toBeInTheDocument();
    const made = fake.requests.filter(
      (item) => item.method === 'POST' && item.path === '/recurring',
    );
    expect(made.map((item) => item.body)).toEqual([
      {
        template: {
          kind: 'expense',
          title: 'Milk',
          amount_minor: 6000,
          category_id: 'groceries',
          merchant: 'Aavin',
          payment_mode: 'cash',
          for_whom: null,
          tags: [],
          note: null,
        },
        cadence: { unit: 'week', every: 1, anchor: '2026-10-14' },
        mode: 'remind',
        active: true,
        signature: 'expense|milk|week',
      },
    ]);
    expect(await screen.findByRole('article', { name: 'Milk' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Not regular: Newspaper' }));
    expect(await screen.findByText("We won't suggest “Newspaper” again")).toBeInTheDocument();
    expect(fake.requests.find((item) => item.path.endsWith('/dismiss'))?.body).toEqual({
      signature: 'expense|newspaper|month',
    });
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Looks like it repeats' })).toBeNull();
    });
  });

  it('pauses a rule with its switch', async () => {
    fake.state.rules = [ruleOf()];
    const { user } = await open();

    await user.click(await screen.findByRole('switch', { name: 'Bus pass active' }));

    expect(await screen.findByText('Paused “Bus pass”')).toBeInTheDocument();
    expect(fake.requests.find((item) => item.method === 'PATCH')).toMatchObject({
      path: '/recurring/r-bus',
      body: { active: false },
    });
    expect(await screen.findByRole('heading', { level: 3, name: 'Paused' })).toBeInTheDocument();
    expect(card('Bus pass').queryByRole('button', { name: 'Mark Bus pass paid' })).toBeNull();
  });

  it("changes a rule, keeping what the form doesn't show", async () => {
    const kept: Partial<typeof BUS.template> = {
      merchant: 'BMTC',
      payment_mode: 'upi',
      tags: ['work'],
      note: 'Monthly pass',
    };
    fake.state.rules = [ruleOf({ template: template(kept), remind_days_before: 5, active: false })];
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Edit Bus pass' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit a bill or repeat' }));
    expect(form.getByLabelText('Remind me')).toHaveValue('5'); // its own number, offered too
    await user.clear(form.getByLabelText('Amount (INR)'));
    await user.type(form.getByLabelText('Amount (INR)'), '650');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved “Bus pass”')).toBeInTheDocument();
    const patched = fake.requests.filter((item) => item.method === 'PATCH');
    expect(patched.map((item) => [item.path, item.body])).toEqual([
      [
        '/recurring/r-bus',
        {
          template: {
            ...kept,
            for_whom: null,
            kind: 'expense',
            title: 'Bus pass',
            amount_minor: 65000,
            category_id: 'transport',
          },
          cadence: { unit: 'month', every: 1, anchor: '2026-09-10' },
          mode: 'remind',
          remind_days_before: 5,
          active: false,
        },
      ],
    ]);
    expect(await card('Bus pass').findByText('−₹650')).toBeInTheDocument();
  });

  it('deletes a rule after asking, saying it will not be suggested again', async () => {
    fake.state.rules = [ruleOf({ source: 'detected', signature: 'expense|bus pass|month' })];
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Delete Bus pass' }));
    const ask = within(screen.getByRole('alert'));
    expect(
      ask.getByText(
        "Delete “Bus pass”? The entries it added stay, and it won't be suggested again.",
      ),
    ).toBeInTheDocument();
    await user.click(ask.getByRole('button', { name: 'Keep it' }));
    expect(screen.queryByRole('alert')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete Bus pass' }));
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Deleted “Bus pass”')).toBeInTheDocument();
    expect(await screen.findByText('No bills or repeats set up yet')).toBeInTheDocument();
    expect(fake.requests.filter((item) => item.method === 'DELETE')).toMatchObject([
      { path: '/recurring/r-bus' },
    ]);
  });

  it("words a bill's notification and leads to the bill", async () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    resetNotificationState([
      {
        id: 'n-bill',
        type: 'expenses.bill_due',
        params: {
          module: 'expenses',
          reminder_id: 'm-1',
          due_on: '2026-10-10',
          rule_id: 'r-bus',
          title: 'Bus pass',
          amount_minor: 60000,
          currency: 'INR',
        },
        read: false,
        at: '2026-10-08T03:30:00Z',
      },
    ]);
    fake.state.rules = structuredClone(AGENDA);
    const { user } = renderApp('/notifications');

    const notice = await screen.findByRole('link', {
      name: '“Bus pass” is due October 10: ₹600',
    });
    expect(notice).toHaveAttribute('href', '/m/expenses/plan?show=bills&focus=r-bus');
    await user.click(notice);

    const bus = await screen.findByRole('article', { name: 'Bus pass' });
    expect(bus).toHaveClass('ring-2');
    await waitFor(() => {
      expect(scrolled.mock.contexts).toContain(bus);
    });
  });

  it('leads from an entry a rule made to its rule', async () => {
    const paid = { id: 'e-paid', title: 'Phone bill', date: '2026-10-08', recurring_id: 'r-phone' };
    fake.state.entries.push(entryOf(paid));
    const { user } = renderApp('/m/expenses');
    const href = '/m/expenses/plan?show=bills&focus=r-phone';

    const row = await screen.findByRole('link', { name: 'See how “Phone bill” repeats' });
    expect(row).toHaveAttribute('href', href);
    await user.click(screen.getByRole('link', { name: 'Phone bill' }));

    // The entry's page first: until it shows, the list's own link has the same name.
    await screen.findByRole('heading', { level: 1, name: 'Phone bill' });
    const badge = screen.getByRole('link', { name: 'See how “Phone bill” repeats' });
    expect(badge).toHaveAttribute('href', href);
    expect(badge).toHaveTextContent('Repeats');
  });

  // A page and then its dialog to check: give axe the time it needs on a loaded machine.
  it('has no detectable accessibility violations', { timeout: 60_000 }, async () => {
    fake.state.rules = structuredClone(AGENDA);
    fake.state.suggestions = [suggestionOf()];
    const { container, user } = await open();
    await screen.findByRole('article', { name: 'Bus pass' });

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Add it for me: Milk' }));
    await screen.findByRole('dialog', { name: 'Add a bill or repeat' });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('asks and pays without accessibility violations', { timeout: 60_000 }, async () => {
    fake.state.rules = structuredClone(AGENDA);
    const { container, user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Delete Bus pass' }));
    await screen.findByRole('alert');
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    await user.click(screen.getByRole('button', { name: 'Mark Bus pass paid' }));
    await screen.findByRole('dialog', { name: 'Mark “Bus pass” paid' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
