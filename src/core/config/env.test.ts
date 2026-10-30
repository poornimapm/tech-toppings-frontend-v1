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
      csrfHeader: 'X-TT-CSRF',
      assistantAgent: 'assistant',
      notificationsPollMs: 60_000,
      speechRegion: 'IN',
      // The reader's files are published with the app, in a folder named for their hash.
      ocrPath: expect.stringMatching(/^\/ocr\/[0-9a-f]{10}\/$/) as unknown,
      scanPhotoPx: 1600,
      scanReadPx: 2400,
      scanReadTimeoutMs: 120_000,
    });
  });

  it('coerces numeric strings from VITE_* variables', () => {
    const env = parseEnv({
      VITE_APP_NAME: '  Toppings Dev ',
      VITE_API_BASE_URL: 'https://api.example.test',
      VITE_WAKE_THRESHOLD_MS: '1500',
      VITE_WAKE_MAX_WAIT_MS: '30000',
      VITE_HEALTH_POLL_MS: '5000',
      VITE_CSRF_HEADER: 'X-Custom',
      VITE_ASSISTANT_AGENT: 'helper',
      VITE_NOTIFICATIONS_POLL_MS: '15000',
      VITE_OCR_PATH: '/files/ocr/',
      VITE_SCAN_PHOTO_PX: '1200',
      VITE_SCAN_READ_PX: '2000',
      VITE_SCAN_READ_TIMEOUT_MS: '60000',
    });

    expect(env).toEqual({
      appName: 'Toppings Dev',
      apiBaseUrl: 'https://api.example.test',
      wakeThresholdMs: 1500,
      wakeMaxWaitMs: 30_000,
      healthPollMs: 5000,
      csrfHeader: 'X-Custom',
      assistantAgent: 'helper',
      notificationsPollMs: 15_000,
      speechRegion: 'IN',
      ocrPath: '/files/ocr/',
      scanPhotoPx: 1200,
      scanReadPx: 2000,
      scanReadTimeoutMs: 60_000,
    });
  });

  it.each([
    ['VITE_WAKE_THRESHOLD_MS', 'soon'],
    ['VITE_WAKE_MAX_WAIT_MS', '-1'],
    ['VITE_APP_NAME', '   '],
    ['VITE_SCAN_PHOTO_PX', '0'],
    ['VITE_OCR_PATH', 'https://cdn.example.test/ocr/'], // another site: no worker from there
    ['VITE_OCR_PATH', '//cdn.example.test/ocr/'],
    ['VITE_OCR_PATH', '/ocr/7.0.0'], // no final /
  ])('rejects invalid %s', (name, value) => {
    expect(() => parseEnv({ [name]: value })).toThrow(/Invalid environment configuration/);
  });
});
