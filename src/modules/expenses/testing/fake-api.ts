import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { fakeAnalytics, insightOf } from '@/modules/expenses/testing/fake-analytics';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Category = Schemas['CategoryOut'];
type Revision = Schemas['RevisionOut'];
type Product = Schemas['ProductDetail'];
type Purchase = Schemas['Purchase'];

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
    quantity: null,
    unit: null,
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

export const UNITS: Schemas['UnitOut'][] = [
  { code: 'kg', dimension: 'mass', factor: 1 },
  { code: 'g', dimension: 'mass', factor: 0.001 },
  { code: 'l', dimension: 'volume', factor: 1 },
  { code: 'piece', dimension: 'count', factor: 1 },
  { code: 'dozen', dimension: 'count', factor: 12 },
];

export function purchaseOf(changes: Partial<Purchase> = {}): Purchase {
  return {
    entry_id: 'e-tomato-1',
    date: '2026-10-01',
    merchant: 'A',
    quantity: 1,
    unit: 'kg',
    amount_minor: 4000,
    unit_price_minor: 4000,
    ...changes,
  };
}

/** Tomato as the server would describe it: bought at A, at B, and somewhere not noted. */
export function productOf(changes: Partial<Product> = {}): Product {
  return {
    id: 'p-tomato',
    name: 'Tomato',
    aliases: ['tomato'],
    dimension: 'mass',
    price_unit: 'kg',
    alert_above_minor: null,
    apart: [],
    currency: 'INR',
    purchases: [
      purchaseOf(),
      purchaseOf({
        entry_id: 'e-tomato-2',
        date: '2026-10-04',
        merchant: 'B',
        quantity: 500,
        unit: 'g',
        amount_minor: 2500,
        unit_price_minor: 5000,
      }),
      purchaseOf({
        entry_id: 'e-tomato-3',
        date: '2026-10-07',
        merchant: null,
        quantity: 2,
        amount_minor: 7000,
        unit_price_minor: 3500,
      }),
    ],
    stats: null,
    merchants: [],
    cheapest: null,
    ...changes,
  };
}

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

/** The figures the server draws from a product's purchases (stats, places, the list's
 *  summary), so fixtures only need to give the purchases. */
function figuresOf(product: Product) {
  const priced = product.purchases.filter((item) => item.unit_price_minor !== null);
  const prices = priced.map((item) => item.unit_price_minor ?? 0);
  const last = prices.at(-1);
  const previous = prices.at(-2);
  const change =
    last !== undefined && previous ? Math.round(((last - previous) / previous) * 1000) / 10 : null;
  const places = [...new Set(priced.map((item) => item.merchant))]
    .map((merchant) => {
      const own = priced
        .filter((item) => item.merchant === merchant)
        .map((item) => item.unit_price_minor ?? 0);
      return {
        merchant,
        count: own.length,
        min_minor: Math.min(...own),
        avg_minor: average(own),
        last_minor: own.at(-1) ?? 0,
      };
    })
    .sort((a, b) => a.avg_minor - b.avg_minor);
  const cheapest = places.find((place) => place.merchant)?.merchant ?? null;
  const latest = priced.at(-1);
  return {
    detail: {
      ...product,
      stats:
        last === undefined
          ? null
          : {
              count: prices.length,
              min_minor: Math.min(...prices),
              max_minor: Math.max(...prices),
              avg_minor: average(prices),
              last_minor: last,
              previous_minor: previous ?? null,
              change_pct: change,
            },
      merchants: places,
      cheapest,
    },
    summary: {
      id: product.id,
      name: product.name,
      aliases: product.aliases,
      dimension: product.dimension,
      price_unit: product.price_unit,
      alert_above_minor: product.alert_above_minor,
      apart: product.apart,
      currency: product.currency,
      purchases: priced.length,
      last: latest
        ? {
            unit_price_minor: latest.unit_price_minor ?? 0,
            date: latest.date,
            merchant: latest.merchant,
          }
        : null,
      change_pct: change,
      trend: prices,
      cheapest,
    } satisfies Schemas['ProductSummary'],
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
export function fakeExpenses(entries: Entry[] = seed(), products: Product[] = []) {
  const state = {
    entries: structuredClone(entries),
    categories: structuredClone(CATEGORIES),
    revisions: new Map<string, Revision[]>(),
    products: structuredClone(products),
    insight: insightOf(),
    unusual: [] as Schemas['Unusual'][],
  };
  const product = (id: unknown) => state.products.find((item) => item.id === id);
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
          (!query.get('for_whom') || entry.for_whom === query.get('for_whom')) &&
          (!query.get('merchant') || entry.merchant === query.get('merchant')) &&
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
    ...fakeAnalytics(matching, state),
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
    http.get(`${API}/units`, () => HttpResponse.json(UNITS)),
    http.get(`${API}/products`, ({ request }) => {
      const title = new URL(request.url).searchParams.get('title')?.toLowerCase();
      const found = state.products.filter((item) => !title || item.aliases.includes(title));
      return HttpResponse.json(page(found.map((item) => figuresOf(item).summary)));
    }),
    http.post(`${API}/products`, async ({ request }) => {
      const { title } = (await request.json()) as Schemas['TrackIn'];
      const created = productOf({
        id: `p-${String(state.products.length)}`,
        name: title,
        aliases: [title.toLowerCase()],
        dimension: 'count',
        price_unit: 'piece',
        purchases: [],
      });
      state.products.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.get(`${API}/products/:id`, ({ params }) => {
      const found = product(params.id);
      return found ? HttpResponse.json(figuresOf(found).detail) : notFound();
    }),
    http.patch(`${API}/products/:id`, async ({ params, request }) => {
      const found = product(params.id);
      if (!found) return notFound();
      const body = (await request.json()) as Schemas['ProductPatch'];
      const aliases = body.aliases?.map((alias) => alias.toLowerCase());
      Object.assign(found, body, aliases ? { aliases } : {});
      return HttpResponse.json(found);
    }),
    http.post(`${API}/products/:id/merge`, async ({ params, request }) => {
      const { product_id } = (await request.json()) as Schemas['OtherProductIn'];
      const target = product(params.id);
      const source = product(product_id);
      if (!target || !source) return notFound();
      target.aliases = [...target.aliases, ...source.aliases];
      target.purchases = [...target.purchases, ...source.purchases].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      state.products = state.products.filter((item) => item !== source);
      return HttpResponse.json(target);
    }),
    http.post(`${API}/products/:id/apart`, async ({ params, request }) => {
      const { product_id } = (await request.json()) as Schemas['OtherProductIn'];
      const found = product(params.id);
      if (!found) return notFound();
      found.apart.push(product_id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${API}/products/:id`, ({ params }) => {
      state.products = state.products.filter((item) => item.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
  return { state, requests, handlers };
}
