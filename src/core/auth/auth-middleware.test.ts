import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';

import { api } from '@/core/api/client';
import { useSession } from '@/core/auth/session-store';
import { errorEnvelope, server, testSessions, testUser, tokenFor } from '@/test/msw';

function signIn(token = 'stale-token') {
  useSession.getState().setSession({ ...tokenFor(), access_token: token });
}

describe('auth middleware', () => {
  it('sends the access token and the CSRF header', async () => {
    signIn('token-123');
    let seen: Record<string, string | null> = {};
    server.use(
      http.get('*/api/v1/me/sessions', ({ request }) => {
        seen = {
          authorization: request.headers.get('Authorization'),
          csrf: request.headers.get('X-TT-CSRF'),
        };
        return HttpResponse.json(testSessions);
      }),
    );

    await api.GET('/v1/me/sessions');

    expect(seen).toEqual({ authorization: 'Bearer token-123', csrf: '1' });
  });

  it('refreshes an expired token once and replays the request', async () => {
    signIn('stale-token');
    const authHeaders: (string | null)[] = [];
    server.use(
      http.get('*/api/v1/me', ({ request }) => {
        const header = request.headers.get('Authorization');
        authHeaders.push(header);
        return header === 'Bearer stale-token'
          ? HttpResponse.json(errorEnvelope('AUTH_TOKEN_EXPIRED', 'expired'), { status: 401 })
          : HttpResponse.json(testUser);
      }),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ ...tokenFor(), access_token: 'fresh-token' }),
      ),
    );

    const result = await api.GET('/v1/me');

    expect(result.data).toEqual(testUser);
    expect(authHeaders).toEqual(['Bearer stale-token', 'Bearer fresh-token']);
    expect(useSession.getState().accessToken).toBe('fresh-token');
  });

  it('replays requests with a body after refreshing', async () => {
    signIn('stale-token');
    const bodies: unknown[] = [];
    server.use(
      http.patch('*/api/v1/me', async ({ request }) => {
        bodies.push(await request.json());
        return request.headers.get('Authorization') === 'Bearer stale-token'
          ? HttpResponse.json(errorEnvelope('AUTH_TOKEN_EXPIRED', 'expired'), { status: 401 })
          : HttpResponse.json({ ...testUser, name: 'Renamed' });
      }),
    );

    const result = await api.PATCH('/v1/me', { body: { name: 'Renamed' } });

    expect(result.data?.name).toBe('Renamed');
    expect(bodies).toEqual([{ name: 'Renamed' }, { name: 'Renamed' }]);
  });

  it('ends the session when the refresh fails', async () => {
    signIn('stale-token');
    server.use(
      http.get('*/api/v1/me', () =>
        HttpResponse.json(errorEnvelope('AUTH_TOKEN_EXPIRED', 'expired'), { status: 401 }),
      ),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(errorEnvelope('AUTH_REFRESH_INVALID', 'ended'), { status: 401 }),
      ),
    );

    const result = await api.GET('/v1/me');

    expect(result.response.status).toBe(401);
    expect(useSession.getState().status).toBe('anonymous');
    expect(localStorage.getItem('tt-session')).toBe('0');
  });

  it.each([
    ['offline', () => HttpResponse.error()],
    ['a server error', () => new HttpResponse(null, { status: 503 })],
  ])('keeps the session when the refresh fails %s', async (_case, reply) => {
    signIn('stale-token');
    server.use(
      http.get('*/api/v1/me', () =>
        HttpResponse.json(errorEnvelope('AUTH_TOKEN_EXPIRED', 'expired'), { status: 401 }),
      ),
      http.post('*/api/v1/auth/refresh', reply),
    );

    const result = await api.GET('/v1/me');

    expect(result.response.status).toBe(401);
    expect(useSession.getState().status).toBe('authenticated');
    expect(localStorage.getItem('tt-session')).toBe('1');
  });

  it.each(['AUTH_SESSION_REVOKED', 'AUTH_TOKEN_INVALID'])('signs out on %s', async (code) => {
    signIn();
    server.use(
      http.get('*/api/v1/me', () => HttpResponse.json(errorEnvelope(code, 'x'), { status: 401 })),
    );

    await api.GET('/v1/me');

    expect(useSession.getState().status).toBe('anonymous');
    expect(localStorage.getItem('tt-session')).toBe('0'); // this browser remembers it is signed out
  });

  it('flags a pending password change', async () => {
    signIn();
    server.use(
      http.get('*/api/v1/me/sessions', () =>
        HttpResponse.json(errorEnvelope('AUTH_PASSWORD_CHANGE_REQUIRED', 'change'), {
          status: 403,
        }),
      ),
    );

    await api.GET('/v1/me/sessions');

    expect(useSession.getState().user?.must_change_password).toBe(true);
  });

  it('never retries credential endpoints', async () => {
    let refreshes = 0;
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(errorEnvelope('AUTH_TOKEN_EXPIRED', 'odd'), { status: 401 }),
      ),
      http.post('*/api/v1/auth/refresh', () => {
        refreshes += 1;
        return HttpResponse.json(tokenFor());
      }),
    );

    const result = await api.POST('/v1/auth/login', { body: { email: 'a@b.co', password: 'x' } });

    expect(result.response.status).toBe(401);
    expect(refreshes).toBe(0);
  });

  it('ignores non-JSON error bodies', async () => {
    signIn();
    server.use(http.get('*/api/v1/me', () => new HttpResponse('nope', { status: 401 })));

    await api.GET('/v1/me');

    expect(useSession.getState().status).toBe('authenticated');
  });
});
