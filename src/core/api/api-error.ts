import type { components } from '@/core/api/schema';

/** The backend's error envelope: `{code, message, details, request_id}`. */
export type ErrorEnvelope = components['schemas']['ErrorResponse'];

/** Client-side code for requests that never reached the server. */
export const NETWORK_ERROR = 'NETWORK_ERROR';

/** One error type for every failed API call; UI code switches on `code` (translated via i18n). */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
  }
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

/** Build an ApiError from a failed response; non-envelope bodies (e.g. a proxy's 502 page)
 *  get a synthetic `HTTP_<status>` code. */
export function toApiError(body: unknown, response: Response): ApiError {
  const headerRequestId = response.headers.get('X-Request-ID');
  if (isEnvelope(body)) {
    return new ApiError(
      response.status,
      body.code,
      body.message,
      body.details ?? null,
      body.request_id ?? headerRequestId,
    );
  }
  return new ApiError(
    response.status,
    `HTTP_${response.status}`,
    response.statusText || 'Request failed',
    null,
    headerRequestId,
  );
}

export function networkError(cause: unknown): ApiError {
  const error = new ApiError(0, NETWORK_ERROR, 'The server could not be reached.');
  error.cause = cause;
  return error;
}

/** Failures worth retrying automatically: unreachable, or the host is (re)starting. */
export function isTransient(error: unknown): boolean {
  return error instanceof ApiError && [0, 502, 503, 504].includes(error.status);
}
