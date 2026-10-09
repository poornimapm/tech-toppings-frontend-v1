import { describe, expect, it } from 'vitest';

import { ApiError } from '@/core/api/api-error';
import i18n from '@/core/i18n';
import { describeError } from '@/platform/auth/describe-error';
import { describeDevice, relativeTime } from '@/platform/auth/device';

describe('describeDevice', () => {
  it.each([
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit Chrome/140.0 Safari/537.36 Edg/140.0',
      'Edge · Windows',
    ],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Mobile Safari/604.1', 'Safari · iOS'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Gecko Firefox/131.0', 'Firefox · macOS'],
    ['curl/8.0', null],
    [null, null],
  ])('%s', (userAgent, expected) => {
    expect(describeDevice(userAgent)).toBe(expected);
  });
});

describe('relativeTime', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');

  it.each([
    ['2026-10-08T11:59:50Z', '10 seconds ago'],
    ['2026-10-08T11:55:00Z', '5 minutes ago'],
    ['2026-10-08T09:00:00Z', '3 hours ago'],
    ['2026-10-07T12:00:00Z', 'yesterday'],
  ])('%s', (iso, expected) => {
    expect(relativeTime(iso, 'en', now)).toBe(expected);
  });
});

describe('describeError', () => {
  const t = i18n.getFixedT('en', 'common');
  const tError = i18n.getFixedT('en', 'errors');

  it('uses the translated message for known codes and a fallback otherwise', () => {
    expect(describeError(new ApiError(409, 'AUTH_EMAIL_TAKEN', 'x'), t, tError)).toBe(
      'An account with this email already exists.',
    );
    expect(describeError(new ApiError(500, 'SOMETHING_NEW', 'x'), t, tError)).toBe(
      'Something went wrong.',
    );
    expect(describeError(new Error('boom'), t, tError)).toBe('Something went wrong.');
  });

  it('turns rate limits into a wait time', () => {
    const limited = new ApiError(429, 'RATE_LIMITED', 'x', { retry_after_seconds: 30 });

    expect(describeError(limited, t, tError)).toBe('Too many attempts. Try again in 1 min.');
  });
});
