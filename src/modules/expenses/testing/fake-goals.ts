import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { todayIn } from '@/core/utils/dates';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Goal = Schemas['GoalOut'];
/** As the server keeps it: a manual goal's `saved_minor` is what was put in. */
export type StoredGoal = Omit<Goal, 'left_minor' | 'pct' | 'per_month_minor' | 'reached'>;

const API = '*/api/v1/expenses';

/** A bike: ₹50,000 by the end of March 2027, funded by hand, nothing in yet. */
export function goalOf(changes: Partial<StoredGoal> = {}): StoredGoal {
  return {
    id: 'g-bike',
    name: 'Bike',
    target_minor: 5000000,
    target_date: '2027-03-31',
    funding: 'manual',
    since: '2026-10-01',
    currency: 'INR',
    revision_no: 1,
    saved_minor: 0,
    ...changes,
  };
}

/** Calendar months from today's to `until`'s, both counted. */
const months = (today: string, until: string) =>
  (Number(until.slice(0, 4)) - Number(today.slice(0, 4))) * 12 +
  Number(until.slice(5, 7)) -
  Number(today.slice(5, 7)) +
  1;

/**
 * The goals endpoints over the fake's own entries, worked out as the server does: a net-savings
 * goal holds what was kept (money in less money out) from its first day to today; a new goal, and
 * money put in or taken out, count once per Idempotency-Key; and no more can be taken out than
 * is saved.
 */
export function fakeGoals(matching: (url: URL) => Entry[], state: { goals: StoredGoal[] }) {
  /** Keys of the money sent, and the goals made by key. */
  const keys = new Set<string>();
  const made = new Map<string, StoredGoal>();
  /** Deleted goals, until they are brought back. */
  const bin = new Map<string, StoredGoal>();

  function shown(goal: StoredGoal): Goal {
    const today = todayIn('Asia/Kolkata');
    const kept = matching(new URL(`http://fake/entries?from=${goal.since}&to=${today}`)).reduce(
      (sum, entry) => sum + (entry.kind === 'income' ? entry.amount_minor : -entry.amount_minor),
      0,
    );
    const saved = goal.funding === 'manual' ? goal.saved_minor : Math.max(kept, 0);
    const left = Math.max(goal.target_minor - saved, 0);
    const span =
      goal.target_date && goal.target_date >= today ? months(today, goal.target_date) : 0;
    return {
      ...goal,
      saved_minor: saved,
      left_minor: left,
      pct: Math.floor((saved * 100) / goal.target_minor),
      per_month_minor: left && span ? Math.ceil(left / span) : null,
      reached: left === 0,
    };
  }

  const find = (id: unknown) => state.goals.find((goal) => goal.id === id);
  const failed = (status: number, code: string, details: unknown = null) =>
    HttpResponse.json({ code, message: code, details, request_id: 'r' }, { status });
  const notFound = () => failed(404, 'NOT_FOUND');
  /** A repeated key gets the first answer, marked as such. */
  const answer = (goal: StoredGoal, replayed: boolean) =>
    HttpResponse.json(shown(goal), {
      status: 201,
      headers: replayed ? { 'Idempotent-Replayed': 'true' } : {},
    });

  return [
    http.get(`${API}/goals`, () => {
      const items = state.goals.map(shown);
      return HttpResponse.json({
        items,
        page: 1,
        page_size: 50,
        total: items.length,
        has_next: false,
      });
    }),
    http.post(`${API}/goals`, async ({ request }) => {
      const key = request.headers.get('Idempotency-Key') ?? crypto.randomUUID();
      const earlier = made.get(key);
      if (earlier) return answer(earlier, true);
      const body = (await request.json()) as Schemas['GoalIn'];
      const created = goalOf({
        ...body,
        since: body.since ?? todayIn('Asia/Kolkata'),
        id: `g-${String(state.goals.length + 1)}`,
      });
      made.set(key, created);
      state.goals.unshift(created);
      return answer(created, false);
    }),
    http.patch(`${API}/goals/:id`, async ({ params, request }) => {
      const goal = find(params.id);
      if (!goal) return notFound();
      const { revision_no, ...body } = (await request.json()) as Schemas['GoalPatch'];
      if (revision_no !== goal.revision_no) {
        return failed(409, 'VERSION_CONFLICT', { current: goal.revision_no });
      }
      Object.assign(goal, body, { revision_no: goal.revision_no + 1 });
      return HttpResponse.json(shown(goal));
    }),
    http.delete(`${API}/goals/:id`, ({ params }) => {
      const goal = find(params.id);
      if (!goal) return notFound();
      state.goals = state.goals.filter((item) => item !== goal);
      bin.set(goal.id, goal);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/goals/:id/undelete`, ({ params }) => {
      const goal = bin.get(String(params.id));
      if (!goal) return notFound();
      bin.delete(goal.id);
      state.goals.unshift(goal);
      return HttpResponse.json(shown(goal));
    }),
    http.post(`${API}/goals/:id/contributions`, async ({ params, request }) => {
      const goal = find(params.id);
      if (!goal) return notFound();
      const key = request.headers.get('Idempotency-Key') ?? crypto.randomUUID();
      if (keys.has(key)) return answer(goal, true);
      const { amount_minor } = (await request.json()) as Schemas['ContributionIn'];
      const refused = (details: object) => failed(422, 'EXPENSE_CONTRIBUTION_INVALID', details);
      if (goal.funding !== 'manual') return refused({ reason: 'net_savings' });
      if (goal.saved_minor + amount_minor < 0) {
        return refused({ reason: 'below_zero', saved_minor: goal.saved_minor });
      }
      keys.add(key);
      goal.saved_minor += amount_minor;
      goal.revision_no += 1;
      return answer(goal, false);
    }),
  ];
}
