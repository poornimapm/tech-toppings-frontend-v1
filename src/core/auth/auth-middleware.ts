import type { Middleware } from 'openapi-fetch';

/** Endpoints that authenticate with the refresh cookie or credentials, never retried. */
const CREDENTIAL_ENDPOINT = /\/v1\/auth\/(refresh|login|login\/totp|register|google|logout)$/;

/** 401 codes meaning the session itself is over (sign in again), not just an old token. */
const SESSION_ENDED = new Set(['AUTH_SESSION_REVOKED', 'AUTH_TOKEN_INVALID', 'UNAUTHENTICATED']);

export interface AuthMiddlewareDeps {
  csrfHeader: string;
  getToken: () => string | null;
  /** Returns a fresh access token, or rejects when the session can't be renewed. It ends the
   *  session itself when the server says there is none (401); an outage proves nothing. */
  refresh: () => Promise<string>;
  /** The server said the session is over: sign in again. */
  onSessionEnded: () => void;
  onPasswordChangeRequired: () => void;
}

async function errorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.clone().json();
    const code = (body as { code?: unknown } | null)?.code;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}

/**
 * Adds the access token and the CSRF header to every request. When a request fails with
 * AUTH_TOKEN_EXPIRED it refreshes once and replays the original request transparently.
 */
export function createAuthMiddleware(deps: AuthMiddlewareDeps): Middleware {
  const replayable = new Map<string, Request>();

  return {
    onRequest({ request, id }) {
      request.headers.set(deps.csrfHeader, '1');
      const token = deps.getToken();
      if (token && !request.headers.has('Authorization')) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      if (!CREDENTIAL_ENDPOINT.test(new URL(request.url).pathname)) {
        replayable.set(id, request.clone()); // bodies can be read once: keep a copy to replay
      }
      return request;
    },

    async onResponse({ response, id }) {
      const original = replayable.get(id);
      replayable.delete(id);
      if (!original || (response.status !== 401 && response.status !== 403)) return response;

      const code = await errorCode(response);
      if (response.status === 403) {
        if (code === 'AUTH_PASSWORD_CHANGE_REQUIRED') deps.onPasswordChangeRequired();
        return response;
      }
      if (code === 'AUTH_TOKEN_EXPIRED') {
        let token: string;
        try {
          token = await deps.refresh();
        } catch {
          // A 401 has signed out already; offline or a server error keeps the session (the
          // next request tries again).
          return response;
        }
        const retry = new Request(original);
        retry.headers.set('Authorization', `Bearer ${token}`);
        return globalThis.fetch(retry);
      }
      if (code !== null && SESSION_ENDED.has(code)) deps.onSessionEnded();
      return response;
    },

    onError({ id }) {
      replayable.delete(id);
    },
  };
}
