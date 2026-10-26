import { describe, expect, it } from 'vitest';

import { isAppPage, strategyFor } from '@/sw/strategy';

const ORIGIN = 'https://app.example.com';

const ask = (path: string, mode: RequestMode = 'cors', method = 'GET', origin = ORIGIN) =>
  strategyFor({ method, mode, url: origin + path }, ORIGIN, '/api');

describe('the service worker strategy', () => {
  it('opens pages from the network, with the cached shell to fall back on', () => {
    expect(ask('/expenses/entries', 'navigate')).toBe('shell');
    expect(ask('/', 'navigate')).toBe('shell');
  });

  it('serves the app’s own files from the kept builds, a previous build’s too', () => {
    expect(ask('/assets/index-abc123.js')).toBe('cache');
    expect(ask('/assets/route-of-the-previous-build.js')).toBe('cache');
  });

  it('never stores the API, writes or other sites', () => {
    expect(ask('/api/v1/me')).toBe('network');
    expect(ask('/api')).toBe('network');
    expect(ask('/api/v1/auth/refresh', 'navigate')).toBe('network');
    expect(ask('/assets/index-abc123.js', 'cors', 'POST')).toBe('network');
    expect(ask('/assets/index-abc123.js', 'cors', 'GET', 'https://cdn.example.com')).toBe(
      'network',
    );
  });

  it('keeps a path that only starts like the API', () => {
    expect(ask('/apiary', 'navigate')).toBe('shell');
  });

  it('knows the app’s pages from the API and other sites', () => {
    expect(isAppPage(`${ORIGIN}/m/expenses`, ORIGIN, '/api')).toBe(true);
    expect(isAppPage(`${ORIGIN}/api/docs`, ORIGIN, '/api')).toBe(false);
    expect(isAppPage('https://elsewhere.example.com/', ORIGIN, '/api')).toBe(false);
  });
});
