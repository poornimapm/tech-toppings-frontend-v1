import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { todayIn } from '@/core/utils/dates';

type Schemas = components['schemas'];
type Iou = Schemas['IouOut'];
type Person = Schemas['PersonBalance'];

const API = '*/api/v1/expenses';

/** Ravi owes the user ₹1,000, lent on 1 October; nothing paid back yet. */
export function iouOf(changes: Partial<Iou> = {}): Iou {
  return {
    id: 'iou-ravi',
    counterparty: 'Ravi',
    counterparty_key: 'ravi',
    direction: 'lent',
    amount_minor: 100000,
    currency: 'INR',
    date: '2026-10-01',
    due_on: null,
    note: null,
    settlements: [],
    settled_minor: 0,
    outstanding_minor: 100000,
    settled_on: null,
    revision_no: 1,
    ...changes,
  };
}

/** Where the user stands with each person, summed as the server does: the name as last written,
 *  people with open loans first and the soonest due first, then those all paid back. */
function summaryOf(ious: Iou[], today: string): Schemas['IouSummary'] {
  const people = new Map<string, Person>();
  for (const iou of [...ious].sort((a, b) => b.date.localeCompare(a.date))) {
    const person = people.get(iou.counterparty_key) ?? {
      name: iou.counterparty,
      key: iou.counterparty_key,
      owed_to_me_minor: 0,
      i_owe_minor: 0,
      net_minor: 0,
      open: 0,
      next_due_on: null,
      overdue: false,
    };
    if (iou.direction === 'lent') person.owed_to_me_minor += iou.outstanding_minor;
    else person.i_owe_minor += iou.outstanding_minor;
    person.net_minor = person.owed_to_me_minor - person.i_owe_minor;
    if (iou.settled_on === null) {
      person.open += 1;
      if (iou.due_on && (!person.next_due_on || iou.due_on < person.next_due_on)) {
        person.next_due_on = iou.due_on;
      }
    }
    person.overdue = person.next_due_on !== null && person.next_due_on < today;
    people.set(iou.counterparty_key, person);
  }
  const LAST = '9999-12-31';
  const sorted = [...people.values()].sort(
    (a, b) =>
      Number(a.open === 0) - Number(b.open === 0) ||
      (a.next_due_on ?? LAST).localeCompare(b.next_due_on ?? LAST) ||
      a.name.localeCompare(b.name),
  );
  return {
    currency: 'INR',
    owed_to_me_minor: sorted.reduce((sum, person) => sum + person.owed_to_me_minor, 0),
    i_owe_minor: sorted.reduce((sum, person) => sum + person.i_owe_minor, 0),
    people: sorted,
  };
}

/**
 * The loans endpoints, worked out as the server does: open or settled, with one person (any
 * case), most recently lent first; balances by person; a loan and a payment count once per
 * Idempotency-Key; what is paid back stays between nothing and the amount; a change is made as
 * of the revision edited, never below what was paid; and a deleted loan can be brought back.
 */
export function fakeIous(state: { ious: Iou[] }) {
  const made = new Map<string, Iou>();
  const paid = new Set<string>();
  /** Deleted loans, until they are brought back. */
  const bin = new Map<string, Iou>();
  const today = () => todayIn('Asia/Kolkata');
  const find = (id: unknown) => state.ious.find((iou) => iou.id === id);
  const keyOf = (request: Request) => request.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  /** A repeated key gets the first answer, marked as such. */
  const answer = (iou: Iou, replayed: boolean) =>
    HttpResponse.json(iou, {
      status: 201,
      headers: replayed ? { 'Idempotent-Replayed': 'true' } : {},
    });
  const failed = (status: number, code: string, details: unknown = null) =>
    HttpResponse.json({ code, message: code, details, request_id: 'r' }, { status });
  const notFound = () => failed(404, 'NOT_FOUND');

  return [
    http.get(`${API}/ious`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const person = query.get('person')?.trim().toLowerCase();
      const shown = query.get('state') ?? 'open';
      const items = state.ious
        .filter(
          (iou) =>
            (!person || iou.counterparty_key === person) &&
            (shown === 'all' || (shown === 'open') === (iou.settled_on === null)),
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      return HttpResponse.json({
        items,
        page: 1,
        page_size: 100,
        total: items.length,
        has_next: false,
      });
    }),
    http.get(`${API}/ious/summary`, () => HttpResponse.json(summaryOf(state.ious, today()))),
    http.get(`${API}/ious/:id`, ({ params }) => {
      const iou = find(params.id);
      return iou ? HttpResponse.json(iou) : notFound();
    }),
    http.post(`${API}/ious`, async ({ request }) => {
      const key = keyOf(request);
      const earlier = made.get(key);
      if (earlier) return answer(earlier, true);
      const body = (await request.json()) as Schemas['IouIn'];
      const created = iouOf({
        ...body,
        id: `iou-${String(state.ious.length + 1)}`,
        counterparty_key: body.counterparty.trim().toLowerCase(),
        date: body.date ?? today(),
        due_on: body.due_on ?? null,
        note: body.note ?? null,
        outstanding_minor: body.amount_minor,
      });
      made.set(key, created);
      state.ious.push(created);
      return answer(created, false);
    }),
    http.patch(`${API}/ious/:id`, async ({ params, request }) => {
      const iou = find(params.id);
      if (!iou) return notFound();
      const { revision_no, ...body } = (await request.json()) as Schemas['IouPatch'];
      if (revision_no !== iou.revision_no) {
        return failed(409, 'VERSION_CONFLICT', { current: iou.revision_no });
      }
      const amount = body.amount_minor ?? iou.amount_minor;
      if (amount < iou.settled_minor) {
        return failed(422, 'EXPENSE_IOU_BELOW_SETTLED', { settled_minor: iou.settled_minor });
      }
      Object.assign(iou, body, {
        counterparty_key: (body.counterparty ?? iou.counterparty).trim().toLowerCase(),
        outstanding_minor: amount - iou.settled_minor,
        settled_on: amount === iou.settled_minor ? (iou.settlements.at(-1)?.date ?? null) : null,
        revision_no: iou.revision_no + 1,
      });
      return HttpResponse.json(iou);
    }),
    http.delete(`${API}/ious/:id`, ({ params }) => {
      const iou = find(params.id);
      if (!iou) return notFound();
      state.ious = state.ious.filter((item) => item !== iou);
      bin.set(iou.id, iou);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/ious/:id/undelete`, ({ params }) => {
      const iou = bin.get(String(params.id));
      if (!iou) return notFound();
      bin.delete(iou.id);
      state.ious.push(iou);
      return HttpResponse.json(iou);
    }),
    http.post(`${API}/ious/:id/settlements`, async ({ params, request }) => {
      const iou = find(params.id);
      if (!iou) return notFound();
      const key = keyOf(request);
      if (paid.has(key)) return answer(iou, true);
      const { amount_minor, date, note } = (await request.json()) as Schemas['SettlementIn'];
      const settled = iou.settled_minor + amount_minor;
      if (settled > iou.amount_minor || settled < 0) {
        const reason = settled < 0 ? 'below_zero' : 'too_much';
        return failed(422, 'EXPENSE_SETTLEMENT_INVALID', {
          reason,
          outstanding_minor: iou.outstanding_minor,
        });
      }
      const day = date ?? today();
      paid.add(key);
      Object.assign(iou, {
        settlements: [...iou.settlements, { key, amount_minor, date: day, note: note ?? null }],
        settled_minor: settled,
        outstanding_minor: iou.amount_minor - settled,
        settled_on: settled === iou.amount_minor ? day : null,
        revision_no: iou.revision_no + 1,
      });
      return answer(iou, false);
    }),
  ];
}
