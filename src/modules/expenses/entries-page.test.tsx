import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { ACCENTS } from '@/core/modules/types';
import { entryOf, fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server } from '@/test/msw';
import { renderApp } from '@/test/render';

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
let fake: ReturnType<typeof fakeExpenses>;

async function open(path = '/m/expenses') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  return view;
}

/** The new entries the page sent (not the checks for duplicates). */
function saves() {
  return fake.requests.filter(
    (request) => request.method === 'POST' && request.path === '/entries',
  );
}

/** The checks for duplicates the page asked for. */
function checks() {
  return fake.requests.filter((request) => request.path === '/entries/duplicates/check');
}

/** Paths of the list requests the page made, without the page number. */
function listRequests(): string[] {
  return fake.requests
    .map((request) => request.path)
    .filter((path) => path.startsWith('/entries?'))
    .map((path) => path.replace(/&?page=1/, ''));
}

beforeAll(async () => {
  await import('@/modules/expenses/entries-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('expenses list', () => {
  it('shows this month by day, with totals for what is shown', async () => {
    await open();

    const today = await screen.findByRole('region', { name: 'Today' });
    expect(within(today).getByRole('link', { name: 'Rice' })).toHaveAttribute(
      'href',
      '/m/expenses/entries/e-rice',
    );
    expect(within(today).getByText('Groceries · Big Bazaar · #home')).toBeInTheDocument();
    expect(within(today).getByText('−₹125')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Yesterday' })).getByText('Bus pass'),
    ).toBeInTheDocument();
    // Money received is marked with a plus, not only a colour.
    expect(
      within(screen.getByRole('region', { name: 'Thu, Oct 1' })).getByText('+₹50,000'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Dog food')).toBeNull(); // last month
    expect(screen.queryByText('Mistake')).toBeNull(); // deleted

    expect(screen.getByText('Spent', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '₹725',
    );
    expect(screen.getByText('Left over').nextElementSibling).toHaveTextContent('₹49,275');
    expect(listRequests()).toContain('/entries?from=2026-10-01&to=2026-10-08');
  });

  it('filters by kind, period, category and words, and keeps them in the URL', async () => {
    const { user, router } = await open();
    await screen.findByRole('link', { name: 'Rice' });

    await user.click(screen.getByRole('button', { name: 'Received' }));
    expect(await screen.findByRole('link', { name: 'Salary' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Rice' })).toBeNull();
    });
    expect(router.state.location.search).toBe('?show=income');

    await user.click(screen.getByRole('button', { name: 'Last month' }));
    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(await screen.findByRole('link', { name: 'Dog food' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), '🐶 Pets');
    await user.type(screen.getByRole('searchbox', { name: 'Search entries' }), 'dog');

    await waitFor(() => {
      expect(listRequests().at(-1)).toBe(
        '/entries?from=2026-09-01&to=2026-09-30&q=dog&category_id=c-pets',
      );
    });
    expect(router.state.location.search).toBe('?period=lastMonth&category=c-pets&q=dog');
    expect(listRequests()).toContain('/entries?from=2026-10-01&to=2026-10-08&kind=income');
  });

  it('adds an entry: checks the form, sends it once, and shows it', async () => {
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add an entry' });
    const form = within(dialog);

    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await form.findByText('Enter an amount, like 250 or 250.50.')).toBeInTheDocument();
    expect(form.getByText('Say what it was.')).toBeInTheDocument();
    expect(form.getByText('Choose a category.')).toBeInTheDocument();
    expect(saves()).toHaveLength(0);

    // Categories follow the kind: income has its own.
    await user.click(form.getByRole('radio', { name: 'Received' }));
    expect(form.getByRole('radio', { name: 'Salary' })).toBeInTheDocument();
    expect(form.queryByRole('radio', { name: 'Groceries' })).toBeNull();
    await user.click(form.getByRole('radio', { name: 'Spent' }));

    await user.type(form.getByRole('textbox', { name: 'Amount (INR)' }), '250.50');
    await user.type(form.getByRole('textbox', { name: 'What was it?' }), 'Vegetables');
    // How much was bought needs its unit, and then says what that comes to per unit.
    await user.type(form.getByRole('textbox', { name: 'How much (optional)' }), '500');
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await form.findByText('Choose a unit.')).toBeInTheDocument();
    await user.selectOptions(await form.findByRole('combobox', { name: 'Unit' }), 'g');
    expect(form.getByText("That's ₹501/kg.")).toBeInTheDocument();
    await user.click(form.getByRole('radio', { name: 'Groceries' }));
    await user.type(form.getByRole('combobox', { name: 'Where' }), 'Market');
    await user.type(form.getByRole('combobox', { name: 'Tags' }), 'weekly, Home');
    await user.selectOptions(form.getByRole('combobox', { name: 'Paid with' }), 'Cash');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added Vegetables')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    const sent = saves();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/); // so a retry could never add it twice
    expect(sent[0]?.body).toEqual({
      kind: 'expense',
      title: 'Vegetables',
      amount_minor: 25050,
      quantity: 500,
      unit: 'g',
      category_id: 'groceries',
      date: '2026-10-08',
      time: null,
      merchant: 'Market',
      payment_mode: 'cash',
      for_whom: '',
      tags: ['weekly', 'Home'],
      note: '',
      attachments: [],
    });
    const today = screen.getByRole('region', { name: 'Today' });
    expect(await within(today).findByRole('link', { name: 'Vegetables' })).toBeInTheDocument();
    expect(within(today).getByText('−₹250.50')).toBeInTheDocument();
  });

  it('warns when a new entry looks like one already saved, and still saves it', async () => {
    fake.state.entries.push(entryOf({ id: 'e-rice-7', date: '2026-10-07', merchant: null }));
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add an entry' }));
    // The note's region is there before the note, so a screen reader announces it.
    const note = form.getByRole('status');
    expect(note).toBeEmptyDOMElement();

    await user.type(form.getByRole('textbox', { name: 'Amount (INR)' }), '125');
    await user.type(form.getByRole('textbox', { name: 'What was it?' }), 'rice');

    await waitFor(() => {
      expect(note).toHaveTextContent(
        'You may have saved this already: Rice · ₹125 · Oct 8, 2026 · Big Bazaar',
      );
    });
    expect(form.getByText('1 more looks like it too.')).toBeInTheDocument();
    const check = checks().at(-1);
    expect(check?.body).toEqual({
      candidates: [
        { kind: 'expense', title: 'rice', amount_minor: 12500, date: '2026-10-08', merchant: null },
      ],
    });
    const asked = checks().length;

    await user.click(form.getByRole('radio', { name: 'Groceries' }));
    await user.click(form.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Added rice')).toBeInTheDocument();
    expect(saves()).toHaveLength(1);
    expect(checks()).toHaveLength(asked); // not checked again while saving: it would find itself
  });

  it('shows deleted entries and brings one back', async () => {
    const { user } = await open('/m/expenses?show=deleted');

    const row = (await screen.findByRole('link', { name: 'Mistake' })).closest('li');
    expect(screen.queryByText('Left over')).toBeNull(); // deleted entries are in no total
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Bring back' }));

    expect(await screen.findByText('Mistake is back')).toBeInTheDocument();
    expect(fake.state.entries.find((entry) => entry.id === 'e-gone')?.deleted).toBe(false);
    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
  });

  it('manages the categories the user added', async () => {
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Categories' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Your categories' }));
    expect(await dialog.findByText('Pets')).toBeInTheDocument();
    expect(dialog.queryByText('Groceries')).toBeNull(); // built-in ones aren't theirs to change

    await user.type(dialog.getByRole('textbox', { name: 'Name' }), 'pets');
    await user.click(dialog.getByRole('button', { name: 'Add category' }));
    expect(
      await dialog.findByText('You already have a category with this name.'),
    ).toBeInTheDocument();

    await user.clear(dialog.getByRole('textbox', { name: 'Name' }));
    await user.type(dialog.getByRole('textbox', { name: 'Name' }), 'Hobbies');
    await user.click(dialog.getByRole('button', { name: 'Add category' }));
    expect(await dialog.findByText('Hobbies')).toBeInTheDocument();
    const added = fake.requests.findLast(
      (request) => request.method === 'POST' && request.path === '/categories',
    )?.body;
    expect(added).toMatchObject({ kind: 'expense', name: 'Hobbies', icon: '🏷️' });
    expect(ACCENTS).toContain((added as { accent: string }).accent);

    await user.click(dialog.getByRole('button', { name: 'Archive Pets' }));
    expect(await dialog.findByText('archived')).toBeInTheDocument();
  });

  it('says when there is nothing yet, and explains a failed load', async () => {
    fake = fakeExpenses([]);
    server.use(
      http.get(
        '*/api/v1/expenses/entries',
        () => HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
        { once: true },
      ),
      ...fake.handlers,
    );
    const { user } = await open();

    expect(await screen.findByText("We couldn't load your entries.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.getByText('Spent', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '₹0',
    );
  });

  it('has no detectable accessibility violations', { timeout: 60_000 }, async () => {
    const { user } = await open();
    await screen.findByRole('link', { name: 'Rice' });
    expect(await axe(document.body)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    await screen.findByRole('dialog', { name: 'Add an entry' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
