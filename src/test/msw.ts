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
