import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Category = Schemas['CategoryOut'];
type Revision = Schemas['RevisionOut'];

const API = '*/api/v1/expenses';

function system(id: string, kind: Category['kind'], icon: string, accent: string): Category {
  return { id, kind, key: id, name: null, icon, accent, system: true, archived: false };
}

const CATEGORIES: Category[] = [
  system('groceries', 'expense', '🛒', 'emerald'),
  system('transport', 'expense', '🚌', 'sky'),
  system('salary', 'income', '💼', 'emerald'),
  {
    id: 'c-pets',
    kind: 'expense',
    key: null,
    name: 'Pets',
    icon: '🐶',
    accent: 'teal',
    system: false,
    archived: false,
  },
];

export function entryOf(changes: Partial<Entry> = {}): Entry {
  return {
    id: 'e-rice',
    kind: 'expense',
    title: 'Rice',
    amount_minor: 12500,
    currency: 'INR',
    category_id: 'groceries',
    date: '2026-10-08',
    time: null,
    merchant: 'Big Bazaar',
    payment_mode: 'upi',
    for_whom: null,
    tags: ['home'],
    note: null,
    attachments: [],
    source: 'manual',
    revision_no: 1,
    deleted: false,
    created_at: '2026-10-08T04:00:00Z',
    updated_at: '2026-10-08T04:00:00Z',
    ...changes,
  };
}

/** A few entries around 8 October 2026: today, yesterday, earlier this month, last month. */
function seed(): Entry[] {
  return [
    entryOf(),
    entryOf({
      id: 'e-bus',
      title: 'Bus pass',
      amount_minor: 60000,
      category_id: 'transport',
      date: '2026-10-07',
      merchant: null,
      tags: [],
    }),
    entryOf({
      id: 'e-pay',
      kind: 'income',
      title: 'Salary',
      amount_minor: 5000000,
      category_id: 'salary',
      date: '2026-10-01',
      merchant: 'Acme',
      payment_mode: 'bank',
      tags: [],
    }),
    entryOf({ id: 'e-old', title: 'Dog food', category_id: 'c-pets', date: '2026-09-20' }),
    entryOf({ id: 'e-gone', title: 'Mistake', date: '2026-10-06', deleted: true }),
  ];
}

/** Not part of what a revision remembers about an entry. */
const BOOKKEEPING = ['id', 'revision_no', 'deleted', 'created_at', 'updated_at'];

function revisionOf(entry: Entry, action: Revision['action'], changes: Revision['changes']) {
  return {
    revision_no: entry.revision_no,
    action,
    changed_at: new Date(Date.now() - 3600_000).toISOString(),
    source: 'manual',
    changes,
    snapshot: Object.fromEntries(
      Object.entries(entry).filter(([name]) => !BOOKKEEPING.includes(name)),
    ),
  } satisfies Revision;
}

const notFound = () =>
  HttpResponse.json(
    { code: 'NOT_FOUND', message: 'Resource not found.', details: null, request_id: 'req-test' },
    { status: 404 },
  );

/**
 * A small in-memory expenses API for tests: `server.use(...fake.handlers)`. `fake.requests`
 * records what the page sent (method, path with query, body and Idempotency-Key).
 */
export function fakeExpenses(entries: Entry[] = seed()) {
  const state = {
    entries: structuredClone(entries),
    categories: structuredClone(CATEGORIES),
    revisions: new Map<string, Revision[]>(),
  };
  const requests: { method: string; path: string; body: unknown; key: string | null }[] = [];
  for (const entry of state.entries)
    state.revisions.set(entry.id, [revisionOf(entry, 'create', [])]);

  const find = (id: unknown) => state.entries.find((entry) => entry.id === id);
  const page = <T>(items: T[]) => ({
    items,
    page: 1,
    page_size: 50,
    total: items.length,
    has_next: false,
  });

  function matching(url: URL): Entry[] {
    const query = url.searchParams;
    const text = query.get('q')?.toLowerCase();
    return state.entries
      .filter(
        (entry) =>
          entry.deleted === (query.get('deleted') === 'true') &&
          (!query.get('kind') || entry.kind === query.get('kind')) &&
          (!query.get('category_id') || entry.category_id === query.get('category_id')) &&
          (!query.get('from') || entry.date >= (query.get('from') ?? '')) &&
          (!query.get('to') || entry.date <= (query.get('to') ?? '')) &&
          (!text || entry.title.toLowerCase().includes(text)),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /** Apply a change as the server would: bump the revision and add to the history. */
  function revise(entry: Entry, action: Revision['action'], changes: Partial<Entry>): Entry {
    const fields = Object.keys(changes) as (keyof Entry)[];
    const diff = fields
      .filter((field) => JSON.stringify(entry[field]) !== JSON.stringify(changes[field]))
      .map((field) => ({ field, old: entry[field], new: changes[field] }));
    Object.assign(entry, changes, { revision_no: entry.revision_no + 1 });
    state.revisions.get(entry.id)?.unshift(revisionOf(entry, action, diff));
    return entry;
  }

  const handlers = [
    http.all(`${API}/*`, async ({ request }) => {
      const url = new URL(request.url);
      requests.push({
        method: request.method,
        path: url.pathname.replace(/^.*\/v1\/expenses/, '') + url.search,
        body:
          request.method === 'GET'
            ? null
            : await request
                .clone()
                .json()
                .catch(() => null),
        key: request.headers.get('Idempotency-Key'),
      });
      // Not answered here: the handlers below do that.
    }),
    http.get(`${API}/categories`, () => HttpResponse.json(page(state.categories))),
    http.post(`${API}/categories`, async ({ request }) => {
      const body = (await request.json()) as Schemas['CategoryIn'];
      if (state.categories.some((item) => item.name?.toLowerCase() === body.name.toLowerCase())) {
        return HttpResponse.json(
          { code: 'EXPENSE_CATEGORY_EXISTS', message: 'exists', details: null, request_id: 'r' },
          { status: 409 },
        );
      }
      const created: Category = {
        id: `c-${state.categories.length}`,
        key: null,
        system: false,
        archived: false,
        ...body,
      };
      state.categories.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.delete(`${API}/categories/:id`, ({ params }) => {
      const category = state.categories.find((item) => item.id === params.id);
      if (category) category.archived = true;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${API}/entries`, ({ request }) =>
      HttpResponse.json(page(matching(new URL(request.url)))),
    ),
    http.get(`${API}/entries/summary`, ({ request }) => {
      const found = matching(new URL(request.url));
      const sum = (kind: Entry['kind']) =>
        found
          .filter((entry) => entry.kind === kind)
          .reduce((n, entry) => n + entry.amount_minor, 0);
      const totals = found.length
        ? [
            {
              currency: 'INR',
              expense_minor: sum('expense'),
              income_minor: sum('income'),
              count: found.length,
            },
          ]
        : [];
      return HttpResponse.json({ totals });
    }),
    http.get(`${API}/entries/facets`, () =>
      HttpResponse.json({
        tags: ['home', 'weekly'],
        for_whom: ['Amma'],
        merchants: ['Big Bazaar'],
      }),
    ),
    http.post(`${API}/entries`, async ({ request }) => {
      const body = (await request.json()) as Schemas['EntryIn'];
      const created = entryOf({
        time: null,
        merchant: null,
        payment_mode: null,
        for_whom: null,
        note: null,
        ...body,
        id: `e-new-${state.entries.length}`,
        currency: 'INR',
      });
      state.entries.push(created);
      state.revisions.set(created.id, [revisionOf(created, 'create', [])]);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.get(`${API}/entries/:id`, ({ params }) => {
      const entry = find(params.id);
      return entry ? HttpResponse.json(entry) : notFound();
    }),
    http.put(`${API}/entries/:id`, async ({ params, request }) => {
      const entry = find(params.id);
      const { revision_no, ...body } = (await request.json()) as Schemas['EntryUpdate'];
      if (!entry) return notFound();
      if (revision_no !== entry.revision_no) {
        return HttpResponse.json(
          {
            code: 'VERSION_CONFLICT',
            message: 'changed elsewhere',
            details: { current: entry.revision_no },
            request_id: 'r',
          },
          { status: 409 },
        );
      }
      return HttpResponse.json(revise(entry, 'update', body as Partial<Entry>));
    }),
    http.delete(`${API}/entries/:id`, ({ params }) => {
      const entry = find(params.id);
      if (!entry) return notFound();
      revise(entry, 'delete', { deleted: true });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/entries/:id/undelete`, ({ params }) => {
      const entry = find(params.id);
      return entry ? HttpResponse.json(revise(entry, 'undelete', { deleted: false })) : notFound();
    }),
    http.post(`${API}/entries/:id/restore`, async ({ params, request }) => {
      const entry = find(params.id);
      const { revision_no } = (await request.json()) as Schemas['RestoreIn'];
      const earlier = state.revisions
        .get(String(params.id))
        ?.find((r) => r.revision_no === revision_no);
      if (!entry || !earlier) return notFound();
      return HttpResponse.json(revise(entry, 'restore', earlier.snapshot as Partial<Entry>));
    }),
    http.get(`${API}/entries/:id/revisions`, ({ params }) =>
      HttpResponse.json(page(state.revisions.get(String(params.id)) ?? [])),
    ),
  ];
  return { state, requests, handlers };
}
