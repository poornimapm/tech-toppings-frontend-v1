import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { addDays, todayIn } from '@/core/utils/dates';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Budget = Schemas['BudgetOut'];
export type StoredBudget = Omit<Budget, 'status'>;

const API = '*/api/v1/expenses';
const DAY_MS = 86_400_000;
/** The server's usual warning share (data/planning.yaml), for budgets sent without one. */
const USUAL_WARNING = 0.8;

/** A Goa trip: what is tagged "goa" from 2 to 6 October 2026, up to ₹10,000. */
export function budgetOf(changes: Partial<StoredBudget> = {}): StoredBudget {
  return {
    id: 'b-goa',
    name: 'Goa trip',
    scope: 'tag',
    category_id: null,
    tag: 'goa',
    period: 'custom',
    start: '2026-10-02',
    end: '2026-10-06',
    limit_minor: 1000000,
    currency: 'INR',
    alert_threshold: USUAL_WARNING,
    ...changes,
  };
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/** The days a budget counts today: its dates, else the week (Monday first) or month. */
function windowOf(budget: StoredBudget, today: string) {
  if (budget.period === 'custom') return { start: budget.start ?? today, end: budget.end ?? today };
  if (budget.period === 'week') {
    const start = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
    return { start, end: addDays(start, 6) };
  }
  const start = `${today.slice(0, 7)}-01`;
  return { start, end: addDays(`${addDays(start, 31).slice(0, 7)}-01`, -1) };
}

/**
 * The budgets endpoints over the fake's own entries, worked out as the server does: spent is
 * what the entries list totals with the budget's filters, so a card and the list it opens agree.
 */
export function fakeBudgets(matching: (url: URL) => Entry[], state: { budgets: StoredBudget[] }) {
  function withStatus(budget: StoredBudget): Budget {
    const today = todayIn('Asia/Kolkata');
    const { start, end } = windowOf(budget, today);
    const query = new URLSearchParams({ kind: 'expense', from: start, to: end });
    if (budget.category_id) query.set('category_id', budget.category_id);
    if (budget.tag) query.set('tag', budget.tag);
    const spent = matching(new URL(`http://fake/entries?${query.toString()}`)).reduce(
      (sum, entry) => sum + entry.amount_minor,
      0,
    );
    const limit = budget.limit_minor;
    const days = daysBetween(start, end) + 1;
    const clamp = (value: number) => Math.min(Math.max(value, 0), days);
    const elapsed = clamp(daysBetween(start, today) + 1);
    const left = clamp(daysBetween(today, end) + 1);
    const level =
      spent >= limit
        ? 'over'
        : budget.alert_threshold && spent >= budget.alert_threshold * limit
          ? 'near'
          : 'ok';
    return {
      ...budget,
      status: {
        start,
        end,
        spent_minor: spent,
        left_minor: limit - spent,
        pct: Math.floor((spent * 100) / limit),
        state: today < start ? 'upcoming' : today > end ? 'ended' : level,
        days_left: left,
        per_day_left_minor: left ? Math.floor(Math.max(limit - spent, 0) / left) : 0,
        pace_minor: Math.floor((limit * elapsed) / days),
      },
    };
  }

  const find = (id: unknown) => state.budgets.find((budget) => budget.id === id);
  const notFound = () =>
    HttpResponse.json(
      { code: 'NOT_FOUND', message: 'Resource not found.', details: null, request_id: 'r' },
      { status: 404 },
    );

  return [
    http.get(`${API}/budgets`, () => {
      const items = state.budgets.map(withStatus);
      return HttpResponse.json({
        items,
        page: 1,
        page_size: 50,
        total: items.length,
        has_next: false,
      });
    }),
    http.post(`${API}/budgets`, async ({ request }) => {
      const body = (await request.json()) as Schemas['BudgetIn'];
      const created = budgetOf({
        alert_threshold: USUAL_WARNING,
        ...body,
        id: `b-${String(state.budgets.length + 1)}`,
      });
      state.budgets.unshift(created);
      return HttpResponse.json(withStatus(created), { status: 201 });
    }),
    http.patch(`${API}/budgets/:id`, async ({ params, request }) => {
      const budget = find(params.id);
      if (!budget) return notFound();
      Object.assign(budget, (await request.json()) as Schemas['BudgetPatch']);
      return HttpResponse.json(withStatus(budget));
    }),
    http.delete(`${API}/budgets/:id`, ({ params }) => {
      state.budgets = state.budgets.filter((budget) => budget.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
