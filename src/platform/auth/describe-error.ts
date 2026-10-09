import type { TFunction } from 'i18next';

import { ApiError } from '@/core/api/api-error';
import { errorKey } from '@/core/i18n';

const WAIT_CODES = new Set(['AUTH_ACCOUNT_LOCKED', 'RATE_LIMITED']);

function retryAfterSeconds(error: ApiError): number | null {
  const value = (error.details as { retry_after_seconds?: unknown } | null)?.retry_after_seconds;
  return typeof value === 'number' ? value : null;
}

/** User-facing, translated text for a failed auth request. */
export function describeError(error: unknown, t: TFunction, tError: TFunction<'errors'>): string {
  if (!(error instanceof ApiError)) return tError('UNKNOWN');
  const seconds = WAIT_CODES.has(error.code) ? retryAfterSeconds(error) : null;
  if (seconds !== null) return t('auth.lockedFor', { minutes: Math.ceil(seconds / 60) });
  return tError(errorKey(error.code));
}
