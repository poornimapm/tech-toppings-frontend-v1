import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
let fake: ReturnType<typeof fakeExpenses>;

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

describe('entries in another currency', () => {
  it('adds one in dollars, and shows what it counts as in rupees', async () => {
    const { user } = renderApp('/m/expenses');
    await screen.findByRole('heading', { level: 1, name: 'Expenses' });
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Add an entry' }));

    const currency = await dialog.findByRole('combobox', { name: 'Currency' });
    expect(currency).toHaveValue('INR'); // the user's own comes first
    await user.selectOptions(currency, 'USD');
    expect(dialog.getByRole('textbox', { name: /Amount \(USD\)/ })).toBeInTheDocument();
    await user.type(dialog.getByRole('textbox', { name: /Amount/ }), '120');
    await user.type(dialog.getByRole('textbox', { name: 'What was it?' }), 'Hotel');
    await user.click(dialog.getByRole('radio', { name: 'Groceries' }));
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added Hotel')).toBeInTheDocument();
    const added = fake.requests.findLast(
      (request) => request.method === 'POST' && request.path === '/entries',
    )?.body;
    expect(added).toMatchObject({ currency: 'USD', amount_minor: 12000, title: 'Hotel' });
    const row = (await screen.findByRole('link', { name: 'Hotel' })).closest('li');
    expect(within(row as HTMLElement).getByText('−$120')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('≈ ₹10,020')).toBeInTheDocument();
  });
});
