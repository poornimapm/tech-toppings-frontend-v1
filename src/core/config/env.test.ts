import { describe, expect, it } from 'vitest';

import { parseEnv } from '@/core/config/env';

describe('parseEnv', () => {
  it('applies safe defaults when nothing is configured', () => {
    expect(parseEnv({})).toEqual({
      appName: 'Tech-Toppings',
      apiBaseUrl: '/api',
      wakeThresholdMs: 3000,
      wakeMaxWaitMs: 90_000,
      healthPollMs: 60_000,
    });
  });

  it('coerces numeric strings from VITE_* variables', () => {
    const env = parseEnv({
      VITE_APP_NAME: '  Toppings Dev ',
      VITE_API_BASE_URL: 'https://api.example.test',
      VITE_WAKE_THRESHOLD_MS: '1500',
      VITE_WAKE_MAX_WAIT_MS: '30000',
      VITE_HEALTH_POLL_MS: '5000',
    });

    expect(env).toEqual({
      appName: 'Toppings Dev',
      apiBaseUrl: 'https://api.example.test',
      wakeThresholdMs: 1500,
      wakeMaxWaitMs: 30_000,
      healthPollMs: 5000,
    });
  });

  it.each([
    ['VITE_WAKE_THRESHOLD_MS', 'soon'],
    ['VITE_WAKE_MAX_WAIT_MS', '-1'],
    ['VITE_APP_NAME', '   '],
  ])('rejects invalid %s', (name, value) => {
    expect(() => parseEnv({ [name]: value })).toThrow(/Invalid environment configuration/);
  });
});
