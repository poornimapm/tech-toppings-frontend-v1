import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';

type Schemas = components['schemas'];
type SavedFilter = Schemas['SavedFilterOut'];
type SavedView = Schemas['SavedView'];

const API = '*/api/v1/expenses/saved-filters';

/** A view as the server answers it: every filter there, and this month when no days. */
function stored(view: Partial<SavedView>): SavedView {
  const days = Boolean(view.from ?? view.to);
  return {
    show: 'all',
    from: null,
    to: null,
    q: null,
    category_id: null,
    tag: null,
    for_whom: null,
    merchant: null,
    ...view,
    period: days ? null : (view.period ?? 'this_month'),
  };
}

/** "Pets" last month: what was spent on pets. */
export function savedFilterOf(changes: Partial<SavedFilter> = {}): SavedFilter {
  return {
    id: 'v-pets',
    name: 'Pets',
    updated_at: '2026-10-01T06:00:00Z',
    ...changes,
    view: stored(changes.view ?? { show: 'expense', period: 'last_month', category_id: 'c-pets' }),
  };
}

const key = (name: string) => name.trim().toLowerCase().split(/\s+/).join(' ');
const taken = () =>
  HttpResponse.json(
    {
      code: 'EXPENSE_SAVED_FILTER_EXISTS',
      message: 'You already have a view with this name.',
      details: null,
      request_id: 'req-test',
    },
    { status: 409 },
  );

/** The saved views endpoints over the fake's own list: one view per name, listed by name. */
export function fakeSavedFilters(state: { views: SavedFilter[] }) {
  const clash = (name: string, id?: string) =>
    state.views.some((item) => item.id !== id && key(item.name) === key(name));
  return [
    http.get(API, () =>
      HttpResponse.json([...state.views].sort((a, b) => key(a.name).localeCompare(key(b.name)))),
    ),
    http.post(API, async ({ request }) => {
      const body = (await request.json()) as Schemas['SavedFilterIn'];
      if (clash(body.name)) return taken();
      const created = savedFilterOf({ id: `v-${String(state.views.length + 1)}`, name: body.name });
      created.view = stored(body.view);
      state.views.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch(`${API}/:id`, async ({ params, request }) => {
      const found = state.views.find((item) => item.id === params.id);
      if (!found) return new HttpResponse(null, { status: 404 });
      const body = (await request.json()) as Schemas['SavedFilterPatch'];
      if (body.name && clash(body.name, found.id)) return taken();
      if (body.name) found.name = body.name;
      if (body.view) found.view = stored(body.view);
      return HttpResponse.json(found);
    }),
    http.delete(`${API}/:id`, ({ params }) => {
      state.views = state.views.filter((item) => item.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
