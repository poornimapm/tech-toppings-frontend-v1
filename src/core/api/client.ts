import createClient, { type Middleware } from 'openapi-fetch';

import { networkError, toApiError } from '@/core/api/api-error';
import type { paths } from '@/core/api/schema';
import { env } from '@/core/config/env';

export const REQUEST_ID_HEADER = 'X-Request-ID';

/** Tags every request with an id the backend echoes and logs, so a UI error can be traced. */
const requestIdMiddleware: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has(REQUEST_ID_HEADER)) {
      request.headers.set(REQUEST_ID_HEADER, crypto.randomUUID().replaceAll('-', ''));
    }
    return request;
  },
};

/** Resolve the (usually relative, same-origin) base URL to an absolute one; `Request` outside
 *  the browser rejects relative URLs. */
export function resolveBaseUrl(base: string, origin: string = window.location.origin): string {
  return new URL(base, origin).toString().replace(/\/$/, '');
}

export function createApiClient(baseUrl: string) {
  const client = createClient<paths>({
    baseUrl: resolveBaseUrl(baseUrl),
    // Look fetch up per call (not once at import) so runtime wrappers and test mocks apply.
    fetch: (request) => globalThis.fetch(request),
  });
  client.use(requestIdMiddleware);
  return client;
}

export const api = createApiClient(env.apiBaseUrl);

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Await an openapi-fetch call and return its data, or throw an `ApiError`. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await request;
  } catch (cause) {
    throw networkError(cause);
  }
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.error, result.response);
  }
  return result.data as T;
}

/** Set by the server when it answered a repeated Idempotency-Key with what the first request
 *  made: that one got through, though its reply was lost. */
const REPLAYED_HEADER = 'Idempotent-Replayed';

/** `unwrap` for a once-per-key write, saying also whether this answer is such a replay (then
 *  the data is what the first request did, not necessarily what this one sent). */
export async function unwrapOnce<T>(
  request: Promise<FetchResult<T>>,
): Promise<{ data: T; replayed: boolean }> {
  const data = await unwrap(request);
  const { response } = await request;
  return { data, replayed: response.headers.get(REPLAYED_HEADER) === 'true' };
}
