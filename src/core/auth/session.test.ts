import { http, HttpResponse } from 'msw/http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/core/api/api-error';
import { safeNext } from '@/core/auth/safe-next';
import { refreshSession, signOut, signOutEverywhere } from '@/core/auth/session';
import { useSession } from '@/core/auth/session-store';
import { errorEnvelope, server, tokenFor } from '@/test/msw';

afterEach(() => {
  // jsdom has no Web Locks API; remove the stub a test may have installed.
  Reflect.deleteProperty(navigator, 'locks');
});

describe('refreshSession', () => {
  it('shares one request between concurrent callers', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        calls += 1;
        return HttpResponse.json(tokenFor());
      }),
    );

    const [first, second] = await Promise.all([refreshSession(), refreshSession()]);

    expect(calls).toBe(1);
    expect(first).toBe(second);
    expect(useSession.getState().status).toBe('authenticated');
  });

  it('retries once when another tab won the race', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(errorEnvelope('AUTH_REFRESH_RACE', 'race'), { status: 409 })
          : HttpResponse.json(tokenFor());
      }),
    );

    await refreshSession();

    expect(calls).toBe(2);
  });

  it('clears the session when there is none to refresh', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(errorEnvelope('AUTH_REFRESH_INVALID', 'ended'), { status: 401 }),
      ),
    );

    await expect(refreshSession()).rejects.toBeInstanceOf(ApiError);
    expect(useSession.getState().status).toBe('anonymous');
    expect(localStorage.getItem('tt-session')).toBe('0');
  });

  it('leaves the session alone when the server is unreachable', async () => {
    server.use(http.post('*/api/v1/auth/refresh', () => HttpResponse.error()));

    await expect(refreshSession()).rejects.toBeInstanceOf(ApiError);
    expect(useSession.getState().status).toBe('unknown');
    expect(localStorage.getItem('tt-session')).toBe('1');
  });

  it('holds a cross-tab lock where the browser supports it', async () => {
    const request = vi.fn((_name: string, task: () => Promise<unknown>) => task());
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });

    await refreshSession();

    expect(request).toHaveBeenCalledWith('tt-auth-refresh', expect.any(Function));
  });
});

describe('signing out', () => {
  it('clears local state even when the server is unreachable', async () => {
    useSession.getState().setSession(tokenFor());
    server.use(http.post('*/api/v1/auth/logout', () => HttpResponse.error()));

    await expect(signOut()).rejects.toBeInstanceOf(ApiError);
    expect(useSession.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
    expect(localStorage.getItem('tt-session')).toBe('0');
  });

  it('signs out everywhere', async () => {
    useSession.getState().setSession(tokenFor());

    await signOutEverywhere();

    expect(useSession.getState().status).toBe('anonymous');
  });
});

describe('safeNext', () => {
  it.each([
    ['/account/security', '/account/security'],
    [null, '/'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
  ])('%s -> %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
