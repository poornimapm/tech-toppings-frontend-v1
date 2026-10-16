import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { savedFilterOf } from '@/modules/expenses/testing/fake-saved-filters';
import { paramsOf, showsView, viewOf } from '@/modules/expenses/view-params';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
const PETS_LAST_MONTH = '/m/expenses?show=expense&period=lastMonth&category=c-pets';
let fake: ReturnType<typeof fakeExpenses>;

async function open(path = '/m/expenses') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  return view;
}

/** What the page changed about views (not the list it read). */
const viewChanges = () =>
  fake.requests.filter(
    (request) => request.path.startsWith('/saved-filters') && request.method !== 'GET',
  );

const viewChip = (name: string) =>
  within(screen.getByRole('group', { name: 'Saved views' })).getByRole('button', { name });

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

describe('a view and the list URL', () => {
  it('reads the URL as the server keeps a view, and writes it back', () => {
    const view = viewOf(
      new URLSearchParams('q=%20dog%20&period=lastMonth&show=expense&category=c-pets&tag=Goa'),
    );
    expect(view).toEqual({
      show: 'expense',
      period: 'last_month',
      q: 'dog',
      category_id: 'c-pets',
      tag: 'goa',
    });
    expect(paramsOf(view).toString()).toBe(
      'show=expense&period=lastMonth&q=dog&category=c-pets&tag=goa',
    );
  });

  it('keeps days a chart chose as days, and leaves the defaults out', () => {
    expect(viewOf(new URLSearchParams('from=2026-10-02&to=2026-10-06'))).toEqual({
      show: 'all',
      from: '2026-10-02',
      to: '2026-10-06',
    });
    expect(viewOf(new URLSearchParams())).toEqual({ show: 'all', period: 'this_month' });
    expect(paramsOf(savedFilterOf({ view: { show: 'all' } }).view).toString()).toBe('');
  });

  it('knows the view shown whatever order the URL has its filters in', () => {
    const { view } = savedFilterOf();
    expect(
      showsView(new URLSearchParams('category=c-pets&period=lastMonth&show=expense'), view),
    ).toBe(true);
    expect(showsView(new URLSearchParams('category=c-pets&show=expense'), view)).toBe(false);
  });
});

describe('saved views on the list', () => {
  it('saves the filters shown under a name, and opens them again from its chip', async () => {
    const { user, router } = await open(PETS_LAST_MONTH);
    await screen.findByRole('link', { name: 'Dog food' });
    expect(screen.queryByRole('group', { name: 'Saved views' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Save view' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Save this view' }));
    await user.click(dialog.getByRole('button', { name: 'Save view' }));
    expect(await dialog.findByText('Give the view a name.')).toBeInTheDocument();
    expect(viewChanges()).toEqual([]);

    await user.type(dialog.getByRole('textbox', { name: 'Name' }), 'Pets last month');
    await user.click(dialog.getByRole('button', { name: 'Save view' }));
    expect(await screen.findByText('Saved view “Pets last month”.')).toBeInTheDocument();
    expect(viewChanges()).toEqual([
      {
        method: 'POST',
        path: '/saved-filters',
        body: {
          name: 'Pets last month',
          view: { show: 'expense', period: 'last_month', category_id: 'c-pets' },
        },
        key: null,
      },
    ]);
    await waitFor(() => {
      expect(viewChip('Pets last month')).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.queryByRole('button', { name: 'Save view' })).toBeNull(); // saved already

    await user.click(screen.getByRole('button', { name: 'This month' }));
    await waitFor(() => {
      expect(viewChip('Pets last month')).toHaveAttribute('aria-pressed', 'false');
    });
    await user.click(viewChip('Pets last month'));
    expect(router.state.location.search).toBe('?show=expense&period=lastMonth&category=c-pets');
    expect(await screen.findByRole('link', { name: 'Dog food' })).toBeInTheDocument();
  });

  it('renames the view shown, and deletes it after asking', async () => {
    fake.state.views.push(savedFilterOf());
    const { user } = await open(PETS_LAST_MONTH);

    await user.click(await screen.findByRole('button', { name: 'Rename or delete view “Pets”' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'View “Pets”' }));
    await user.clear(dialog.getByRole('textbox', { name: 'Name' }));
    await user.type(dialog.getByRole('textbox', { name: 'Name' }), 'Dog');
    await user.click(dialog.getByRole('button', { name: 'Rename' }));
    expect(await screen.findByText('Renamed to “Dog”.')).toBeInTheDocument();
    expect(viewChanges().at(-1)).toMatchObject({
      method: 'PATCH',
      path: '/saved-filters/v-pets',
      body: { name: 'Dog' },
    });

    await user.click(await screen.findByRole('button', { name: 'Rename or delete view “Dog”' }));
    const again = within(await screen.findByRole('dialog', { name: 'View “Dog”' }));
    await user.click(again.getByRole('button', { name: 'Delete view' }));
    expect(again.getByRole('alert')).toHaveTextContent('Delete view “Dog”? Your entries stay.');
    await user.click(again.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Deleted view “Dog”.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('group', { name: 'Saved views' })).toBeNull();
    });
    // The filters are still on the list, ready to save again.
    expect(screen.getByRole('button', { name: 'Save view' })).toBeInTheDocument();
  });

  it('offers a name already taken to the filters shown instead', async () => {
    fake.state.views.push(
      savedFilterOf({
        id: 'v-food',
        name: 'Food',
        view: { show: 'expense', period: 'this_month', category_id: 'groceries' },
      }),
    );
    const { user } = await open('/m/expenses?period=allTime&q=dog');

    await user.click(await screen.findByRole('button', { name: 'Save view' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Save this view' }));
    await user.type(dialog.getByRole('textbox', { name: 'Name' }), ' food ');
    await user.click(dialog.getByRole('button', { name: 'Save view' }));
    expect(await dialog.findByText('You already have a view called “Food”.')).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Replace “Food” with these filters' }));
    expect(await screen.findByText('“Food” now shows these filters.')).toBeInTheDocument();
    expect(viewChanges().at(-1)).toEqual({
      method: 'PATCH',
      path: '/saved-filters/v-food',
      body: { view: { show: 'all', period: 'all_time', q: 'dog' } },
      key: null,
    });
    await waitFor(() => {
      expect(viewChip('Food')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('opens a view a link names (what search finds)', async () => {
    fake.state.views.push(savedFilterOf());
    const { router } = await open('/m/expenses?view=v-pets');
    await waitFor(() => {
      expect(router.state.location.search).toBe('?show=expense&period=lastMonth&category=c-pets');
    });
    expect(await screen.findByRole('link', { name: 'Dog food' })).toBeInTheDocument();
    expect(viewChip('Pets')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows nothing until there is a view, or a filter to save', async () => {
    await open();
    await screen.findByRole('link', { name: 'Rice' });
    expect(screen.queryByRole('group', { name: 'Saved views' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save view' })).toBeNull();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    fake.state.views.push(savedFilterOf());
    const { user } = await open(PETS_LAST_MONTH);
    await user.click(await screen.findByRole('button', { name: 'Rename or delete view “Pets”' }));
    await screen.findByRole('dialog', { name: 'View “Pets”' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
