import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  activityOf,
  budgetOf,
  expenseOf,
  fakeTrip,
  NOW,
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

const TRAVELLERS = [
  { id: 'asha', name: 'Asha' },
  { id: 'ravi', name: 'Ravi' },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state = {
    trip: tripOf({ budget_minor: 1_000_000, travellers: TRAVELLERS }),
    activities: [activityOf({ id: 'kayak', title: 'Kayaking', kind: 'beach' })],
    items: [],
    suggestions: [],
    expenses: [
      expenseOf({
        id: 'taxi',
        title: 'Taxi to Baga',
        category: 'other',
        amount_minor: 150_000,
        day: '2026-11-06',
        paid_by: 'asha',
        shared_with: ['asha', 'ravi'],
      }),
      expenseOf({
        id: 'scuba',
        title: 'Scuba deposit',
        kind: 'estimate',
        amount_minor: 5_000,
        currency: 'USD',
        activity_id: 'kayak',
      }),
    ],
    // The server's sums: the dollars had no rate, so they are in none of them.
    budget: budgetOf({
      budget_minor: 1_000_000,
      estimated_minor: 600_000,
      actual_minor: 450_000,
      remaining_minor: 550_000,
      categories: [
        { category: 'food', estimated_minor: 200_000, actual_minor: 300_000 },
        { category: 'other', estimated_minor: 400_000, actual_minor: 150_000 },
      ],
      unconverted: [
        {
          expense_id: 'scuba',
          title: 'Scuba deposit',
          kind: 'estimate',
          category: 'food',
          amount_minor: 5_000,
          currency: 'USD',
          reason: 'unavailable',
        },
      ],
      balances: [
        { traveller_id: 'asha', paid_minor: 150_000, share_minor: 75_000, balance_minor: 75_000 },
        { traveller_id: 'ravi', paid_minor: 0, share_minor: 75_000, balance_minor: -75_000 },
      ],
      settlements: [{ from_traveller_id: 'ravi', to_traveller_id: 'asha', amount_minor: 75_000 }],
    }),
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
const figure = (region: HTMLElement, name: string) =>
  within(region).getByText(name, { selector: 'dt' }).nextElementSibling?.textContent;

describe('the budget', () => {
  it('shows the budget against what is estimated and spent, by category, who owes whom, and what had no rate', async () => {
    const { container } = renderApp('/m/travel/trips/goa/budget');

    const summary = await screen.findByRole('region', { name: 'The budget' });
    expect(figure(summary, 'Budget')).toBe('₹10,000');
    expect(figure(summary, 'Estimated')).toBe('₹6,000');
    expect(figure(summary, 'Spent')).toBe('₹4,500');
    expect(figure(summary, 'Left')).toBe('₹5,500');
    expect(within(summary).getByRole('meter', { name: 'Budget spent' })).toHaveAttribute(
      'aria-valuetext',
      '₹4,500 of ₹10,000 spent',
    );

    // Called out, and counted nowhere: no rate is guessed.
    const missing = screen.getByText('Not counted in any total').closest('[role="status"]');
    expect(missing).toHaveTextContent(/There's no exchange rate to INR for these just now/);
    expect(missing).toHaveTextContent('Scuba deposit: $50');
    expect(missing).toHaveTextContent('No rate could be had just now: look again later.');

    const categories = screen.getByRole('table', { name: 'By category' });
    expect(
      within(categories)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['CategoryEstimatedSpent', 'Food₹2,000₹3,000', 'Other₹4,000₹1,500']);

    const shared = screen.getByRole('region', { name: 'Who owes whom' });
    expect(within(shared).getByText('Ravi pays Asha ₹750')).toBeInTheDocument();
    expect(
      within(within(shared).getByRole('table'))
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['TravellerPaidTheir share', 'Asha₹1,500₹750', 'Ravi₹0₹750']);

    const costs = await screen.findByRole('list', { name: 'Costs' });
    const [taxi, scuba] = within(costs).getAllByRole('listitem') as [HTMLElement, HTMLElement];
    expect(taxi).toHaveTextContent('Taxi to Baga₹1,500');
    expect(taxi).toHaveTextContent('Other · Nov 6, 2026 · Paid by Asha · Shared by Asha, Ravi');
    expect(within(taxi).getByText('Spent')).toBeInTheDocument();
    expect(scuba).toHaveTextContent('Scuba deposit$50');
    expect(await within(scuba).findByText(/Food · Kayaking/)).toBeInTheDocument();
    expect(within(scuba).getByText('Estimate')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds a cost, shared between two, once however often Save is pressed', async () => {
    const { user } = renderApp('/m/travel/trips/goa/budget');
    await user.click(await screen.findByRole('button', { name: 'Add a cost' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a cost' });
    // The trip is on: what is added is what was spent, unless said otherwise.
    expect(within(dialog).getByRole('radio', { name: 'Spent' })).toBeChecked();
    await user.type(within(dialog).getByRole('textbox', { name: 'What' }), 'Fish thali');
    await user.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '900');
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Paid by (optional)' }),
      'Asha',
    );
    await user.click(within(dialog).getByRole('checkbox', { name: 'Asha' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Ravi' }));
    await user.dblClick(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Fish thali” is on the budget.')).toBeInTheDocument();
    const added = writes().filter((each) => each.path === '/v1/travel/trips/goa/expenses');
    expect(added).toHaveLength(1);
    expect(added[0]?.key).toBeTruthy();
    expect(added[0]?.body).toEqual({
      kind: 'actual',
      title: 'Fish thali',
      amount_minor: 90_000,
      currency: 'INR',
      category: 'food',
      day: null,
      activity_id: null,
      paid_by: 'asha',
      shared_with: ['asha', 'ravi'],
    });
    expect(await screen.findByText('Fish thali')).toBeInTheDocument();
  });

  it('edits a cost as of its revision, and removes one with a moment to take it back', async () => {
    const { user } = renderApp('/m/travel/trips/goa/budget');
    await user.click(await screen.findByRole('button', { name: 'Edit “Taxi to Baga”' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Taxi to Baga”' });
    const amount = within(dialog).getByRole('textbox', { name: 'Amount' });
    expect(amount).toHaveValue('1500.00');
    await user.clear(amount);
    await user.type(amount, '1800');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('“Taxi to Baga” is saved.')).toBeInTheDocument();
    expect(writes().at(-1)).toMatchObject({
      method: 'PATCH',
      path: '/v1/travel/expenses/taxi',
      body: { amount_minor: 180_000, revision_no: 1, shared_with: ['asha', 'ravi'] },
    });

    await user.click(screen.getByRole('button', { name: 'Remove “Scuba deposit”' }));
    expect(await screen.findByText('Removed “Scuba deposit”.')).toBeInTheDocument();
    expect(state.expenses?.map((each) => each.id)).toEqual(['taxi']);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(state.expenses?.map((each) => each.id)).toEqual(['taxi', 'scuba']);
    });
    expect(writes().at(-1)?.path).toMatch(/^\/v1\/travel\/events\/event-\d+\/undo$/);
  });

  it("sets the trip's budget, and says when there is nobody to split costs with", async () => {
    state.trip = tripOf();
    state.budget = budgetOf();
    state.expenses = [];
    const { user } = renderApp('/m/travel/trips/goa/budget');

    const summary = await screen.findByRole('region', { name: 'The budget' });
    expect(figure(summary, 'Budget')).toBe('None set');
    expect(within(summary).queryByRole('meter')).not.toBeInTheDocument();
    expect(
      screen.getByText("Costs are split between the trip's travellers, and it has fewer than two."),
    ).toBeInTheDocument();
    expect(await screen.findByText('No costs yet.')).toBeInTheDocument();

    await user.click(within(summary).getByRole('button', { name: 'Set a budget' }));
    const dialog = await screen.findByRole('dialog', { name: "The trip's budget" });
    await user.type(within(dialog).getByRole('textbox', { name: 'Budget in INR' }), '25000');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('The budget is saved.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: '/v1/travel/trips/goa',
        body: { budget_minor: 2_500_000, revision_no: 1 },
      }),
    ]);
  });
});
