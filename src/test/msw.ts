import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import type { components } from '@/core/api/schema';

type Schemas = components['schemas'];

export const healthOk: Schemas['HealthStatus'] = {
  status: 'ok',
  name: 'Tech-Toppings API',
  version: '0.1.0',
};
const readyOk: Schemas['ReadinessStatus'] = { status: 'ready', checks: { mongo: 'ok' } };

export const testUser: Schemas['UserOut'] = {
  id: 'user-1',
  email: 'asha@example.com',
  name: 'Asha',
  role: 'user',
  locale: 'en',
  theme: 'system',
  ui_mode: 'standard',
  base_currency: 'INR',
  timezone: 'Asia/Kolkata',
  ai_consent: false,
  must_change_password: false,
  has_password: true,
  auth_providers: [],
  created_at: '2026-10-01T10:00:00Z',
};

export const authConfig: Schemas['AuthConfigOut'] = {
  registration_mode: 'open',
  google_client_id: null,
  password_policy: { min_length: 10, max_length: 128, min_classes: 2 },
  csrf_header: 'X-TT-CSRF',
};

let tokenCounter = 0;

export function tokenFor(user: Partial<Schemas['UserOut']> = {}): Schemas['TokenOut'] {
  tokenCounter += 1;
  return {
    access_token: `access-${tokenCounter}`,
    token_type: 'bearer',
    expires_in: 900,
    user: { ...testUser, ...user },
  };
}

export const testSessions: Schemas['Page_SessionOut_'] = {
  items: [
    {
      id: 'session-current',
      created_at: '2026-10-08T09:00:00Z',
      last_used_at: new Date(Date.now() - 60_000).toISOString(),
      expires_at: '2026-11-07T09:00:00Z',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36',
      ip: '10.0.0.1',
      current: true,
    },
    {
      id: 'session-phone',
      created_at: '2026-10-07T09:00:00Z',
      last_used_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
      expires_at: '2026-11-06T09:00:00Z',
      user_agent: 'Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile Safari/537.36',
      ip: '10.0.0.2',
      current: false,
    },
  ],
  page: 1,
  page_size: 50,
  total: 2,
  has_next: false,
};

type ModuleView = Schemas['ModuleView'];

function moduleView(key: string, position: number, changes: Partial<ModuleView> = {}): ModuleView {
  return {
    key,
    slug: key.replaceAll('_', '-'),
    version: '0.1.0',
    status: 'coming_soon',
    global_enabled: true,
    enabled: true,
    available: false,
    pinned: false,
    position,
    notify_requested: false,
    has_settings: false,
    stat: null,
    ...changes,
  };
}

/** One module in every state the Welcome page distinguishes. */
export const testModules: readonly ModuleView[] = [
  moduleView('expenses', 0, {
    status: 'live',
    available: true,
    stat: { value: 4320, format: 'currency', currency: 'INR', label: 'month_total' },
  }),
  moduleView('medicine', 1, { status: 'beta', available: true }),
  moduleView('receipts', 2),
  moduleView('study', 3, { pinned: true }),
  moduleView('gov_docs', 4, { global_enabled: false }),
  moduleView('meals', 5, { enabled: false }),
  moduleView('habits', 6),
  moduleView('journal', 7),
];

/** The fake API's module state; tests may edit it, and it resets after every test. */
export let moduleState: ModuleView[] = structuredClone([...testModules]);

export function resetModuleState(views: readonly ModuleView[] = testModules): void {
  moduleState = structuredClone([...views]);
}

function updateModule(key: string, changes: Partial<ModuleView>): ModuleView | undefined {
  const index = moduleState.findIndex((view) => view.key === key);
  const current = moduleState[index];
  if (!current) return undefined;
  const next = { ...current, ...changes };
  next.available = next.global_enabled && next.enabled && next.status !== 'coming_soon';
  moduleState[index] = next;
  return next;
}

type AgentRun = Schemas['RunOut'];
type Proposal = Schemas['Proposal'];

const assistantView: Schemas['AgentView'] = {
  name: 'assistant',
  description: 'The in-app assistant.',
  mode: 'static',
  reason: 'consent',
  fallback: true,
  quota_remaining: 30,
  skills: [
    { name: 'manage-modules', description: 'Manage modules.', mode: 'agent', has_static: true },
  ],
};

export function testProposal(changes: Partial<Proposal> = {}): Proposal {
  return {
    id: 'proposal-1',
    tool: 'modules_set_preferences',
    arguments: { key: 'journal', pinned: true },
    summary: null,
    summary_code: 'manage-modules.change.pin',
    summary_params: { name: 'Journal' },
    status: 'pending',
    expires_at: '2026-10-09T10:30:00Z',
    result: null,
    error_code: null,
    ...changes,
  };
}

/** A static-mode answer proposing to pin Journal (the default for POST .../runs). */
export function testRun(changes: Partial<AgentRun> = {}): AgentRun {
  return {
    id: 'run-1',
    agent: 'assistant',
    skill: 'manage-modules',
    status: 'completed',
    mode: 'static',
    reason: 'consent',
    message: null,
    message_code: 'manage-modules.ready.pin',
    message_params: { name: 'Journal' },
    proposals: [testProposal()],
    client_actions: [],
    created_at: '2026-10-09T10:00:00Z',
    ...changes,
  };
}

const moduleNotFound = () =>
  HttpResponse.json(errorEnvelope('MODULE_NOT_FOUND', 'no such module'), { status: 404 });

export function errorEnvelope(
  code: string,
  message: string,
  details: unknown = null,
): Schemas['ErrorResponse'] {
  return { code, message, details, request_id: 'req-test-0001' };
}

/** Default API: healthy backend and a signed-in user; tests override with `server.use(...)`. */
const handlers = [
  http.get('*/api/healthz', () => HttpResponse.json(healthOk)),
  http.get('*/api/readyz', () => HttpResponse.json(readyOk)),
  http.get('*/api/v1/auth/config', () => HttpResponse.json(authConfig)),
  http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor())),
  http.post('*/api/v1/auth/login', () => HttpResponse.json(tokenFor())),
  http.post('*/api/v1/auth/register', () => HttpResponse.json(tokenFor(), { status: 201 })),
  http.post('*/api/v1/auth/password/change', () => HttpResponse.json(tokenFor())),
  http.post('*/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.post('*/api/v1/auth/logout-all', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/v1/me/sessions', () => HttpResponse.json(testSessions)),
  http.delete('*/api/v1/me/sessions/:id', () => new HttpResponse(null, { status: 204 })),
  http.patch('*/api/v1/me', async ({ request }) =>
    HttpResponse.json({ ...testUser, ...((await request.json()) as object) }),
  ),
  http.get('*/api/v1/modules', () =>
    HttpResponse.json({
      items: [...moduleState].sort((a, b) => a.position - b.position),
      page: 1,
      page_size: 100,
      total: moduleState.length,
      has_next: false,
    }),
  ),
  http.patch('*/api/v1/modules/:key/preferences', async ({ params, request }) => {
    const changes = (await request.json()) as Partial<ModuleView>;
    const view = updateModule(String(params.key), changes);
    return view ? HttpResponse.json(view) : moduleNotFound();
  }),
  http.put('*/api/v1/modules/order', async ({ request }) => {
    const { keys } = (await request.json()) as { keys: string[] };
    for (const view of moduleState) view.position = keys.indexOf(view.key);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('*/api/v1/modules/:key/interest', ({ params }) => {
    const view = updateModule(String(params.key), { notify_requested: true });
    return view ? HttpResponse.json(view) : moduleNotFound();
  }),
  http.get('*/api/v1/agents', () =>
    HttpResponse.json({
      items: [assistantView],
      page: 1,
      page_size: 20,
      total: 1,
      has_next: false,
    }),
  ),
  http.post('*/api/v1/agents/:name/runs', () => HttpResponse.json(testRun(), { status: 201 })),
  http.post('*/api/v1/agents/proposals/:id/confirm', ({ params }) => {
    updateModule('journal', { pinned: true });
    return HttpResponse.json(testProposal({ id: String(params.id), status: 'confirmed' }));
  }),
  http.post('*/api/v1/agents/proposals/:id/reject', ({ params }) =>
    HttpResponse.json(testProposal({ id: String(params.id), status: 'rejected' })),
  ),
  http.delete('*/api/v1/modules/:key/interest', ({ params }) => {
    const view = updateModule(String(params.key), { notify_requested: false });
    return view ? HttpResponse.json(view) : moduleNotFound();
  }),
];

export const server = setupServer(...handlers);

/** Start the test signed out: the refresh cookie is missing or expired. */
export function signedOut(): void {
  server.use(
    http.post('*/api/v1/auth/refresh', () =>
      HttpResponse.json(errorEnvelope('AUTH_REFRESH_INVALID', 'ended'), { status: 401 }),
    ),
  );
}
