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
