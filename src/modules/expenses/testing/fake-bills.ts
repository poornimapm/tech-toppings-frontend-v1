import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { addDays, todayIn } from '@/core/utils/dates';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Rule = Schemas['RuleOut'];
type Suggestion = Schemas['SuggestionOut'];
/** As the server keeps it: whether it is overdue is worked out on each read. */
export type StoredRule = Omit<Rule, 'overdue'>;

const API = '*/api/v1/expenses';

/** A bus pass: ₹600 each month on the 10th, reminded two days before; next due 10 October. */
export function ruleOf(changes: Partial<StoredRule> = {}): StoredRule {
  return {
    id: 'r-bus',
    template: {
      kind: 'expense',
      title: 'Bus pass',
      amount_minor: 60000,
      category_id: 'transport',
      merchant: null,
      payment_mode: null,
      for_whom: null,
      tags: [],
      note: null,
    },
    currency: 'INR',
    cadence: { unit: 'month', every: 1, anchor: '2026-09-10' },
    next_run: '2026-10-10',
    mode: 'remind',
    remind_days_before: 2,
    active: true,
    source: 'manual',
    signature: null,
    ...changes,
  };
}

/** Milk from Aavin, ₹60 each week: seen four times, last on 7 October. */
export function suggestionOf(changes: Partial<Suggestion> = {}): Suggestion {
  return {
    signature: 'expense|milk|week',
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
    currency: 'INR',
    cadence: { unit: 'week', every: 1, anchor: '2026-10-14' },
    count: 4,
    last_on: '2026-10-07',
    ...changes,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The due date after the next one, from the anchor's day as the server does (a month's last
 *  day when it is shorter). */
function following({ cadence, next_run }: StoredRule): string {
  if (cadence.unit === 'day' || cadence.unit === 'week') {
    return addDays(next_run, (cadence.unit === 'week' ? 7 : 1) * cadence.every);
  }
  const months = (cadence.unit === 'year' ? 12 : 1) * cadence.every;
  const total = Number(next_run.slice(0, 4)) * 12 + Number(next_run.slice(5, 7)) - 1 + months;
  const [year, month] = [Math.floor(total / 12), (total % 12) + 1];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Number(cadence.anchor.slice(8, 10)), last);
  return `${String(year)}-${pad(month)}-${pad(day)}`;
}

/**
 * The repeating rules and bills endpoints, as the server answers them: a bill is overdue once its
 * due date has passed unpaid; marking a due date paid adds its entry once (the same due date again
 * is a replay) and moves the bill on; confirming a suggestion twice finds the same rule.
 */
export function fakeBills(
  state: { rules: StoredRule[]; suggestions: Suggestion[]; entries: Entry[] },
  entryOf: (changes: Partial<Entry>) => Entry,
) {
  /** The entry each due date paid made, by `<rule>/<due date>`. */
  const paid = new Map<string, Entry>();
  const today = () => todayIn('Asia/Kolkata');
  const shown = (rule: StoredRule): Rule => ({
    ...rule,
    overdue: rule.mode === 'remind' && rule.active && rule.next_run < today(),
  });
  const find = (id: unknown) => state.rules.find((rule) => rule.id === id);
  const failed = (status: number, code: string, details: unknown = null) =>
    HttpResponse.json({ code, message: code, details, request_id: 'r' }, { status });
  const created = (body: object, replayed: boolean) =>
    HttpResponse.json(body, {
      status: 201,
      headers: replayed ? { 'Idempotent-Replayed': 'true' } : {},
    });

  return [
    http.get(`${API}/recurring`, () => {
      const items = [...state.rules]
        .sort((a, b) => a.next_run.localeCompare(b.next_run))
        .map(shown);
      return HttpResponse.json({
        items,
        page: 1,
        page_size: 50,
        total: items.length,
        has_next: false,
      });
    }),
    http.get(`${API}/recurring/suggestions`, () => HttpResponse.json(state.suggestions)),
    http.post(`${API}/recurring/suggestions/dismiss`, async ({ request }) => {
      const { signature } = (await request.json()) as Schemas['DismissIn'];
      state.suggestions = state.suggestions.filter((item) => item.signature !== signature);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/recurring`, async ({ request }) => {
      const { signature, ...body } = (await request.json()) as Schemas['RuleIn'];
      const earlier = state.rules.find((rule) => signature && rule.signature === signature);
      if (earlier) return created(shown(earlier), true);
      const rule = ruleOf({
        ...body,
        id: `r-${String(state.rules.length + 1)}`,
        next_run: body.cadence.anchor,
        source: signature ? 'detected' : 'manual',
        signature: signature ?? null,
      });
      state.rules.push(rule);
      state.suggestions = state.suggestions.filter((item) => item.signature !== signature);
      return created(shown(rule), false);
    }),
    http.patch(`${API}/recurring/:id`, async ({ params, request }) => {
      const rule = find(params.id);
      if (!rule) return failed(404, 'NOT_FOUND');
      Object.assign(rule, (await request.json()) as Schemas['RulePatch']);
      return HttpResponse.json(shown(rule));
    }),
    http.delete(`${API}/recurring/:id`, ({ params }) => {
      state.rules = state.rules.filter((rule) => rule.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/recurring/:id/mark-paid`, async ({ params, request }) => {
      const rule = find(params.id);
      if (!rule) return failed(404, 'NOT_FOUND');
      const body = (await request.json()) as Schemas['MarkPaidIn'];
      if (body.due_on > rule.next_run) {
        return failed(422, 'EXPENSE_RECURRING_NOT_DUE', { next_run: rule.next_run });
      }
      const key = `${rule.id}/${body.due_on}`;
      const earlier = paid.get(key);
      if (earlier) return created(earlier, true);
      const entry = entryOf({
        ...rule.template,
        id: `e-paid-${String(paid.size + 1)}`,
        amount_minor: body.amount_minor ?? rule.template.amount_minor,
        date: body.date ?? today(),
        recurring_id: rule.id,
      });
      paid.set(key, entry);
      state.entries.push(entry);
      if (body.due_on === rule.next_run) rule.next_run = following(rule);
      return created(entry, false);
    }),
  ];
}
