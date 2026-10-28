import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// eslint-disable-next-line no-restricted-imports -- a build plugin, beside the app, not in src
import { pagesHeaders } from '../../vite-plugins/pages-headers';

const FILE = 'public/_headers';
const site = pagesHeaders(FILE);
const policy = Object.fromEntries(
  (site['Content-Security-Policy'] ?? '').split(';').map((directive) => {
    const [name = '', ...sources] = directive.trim().split(/\s+/);
    return [name, sources];
  }),
);

describe('the live site’s headers (public/_headers)', () => {
  it('lets scripts come only from the app and Google’s sign-in button', () => {
    const button = readFileSync('src/platform/auth/google-sign-in-button.tsx', 'utf8');
    const script = /GIS_SCRIPT = '([^']+)'/.exec(button)?.[1];

    expect(policy['script-src']).toEqual(["'self'", script]);
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
  });

  it('needs no inline script in the page the policy guards', () => {
    const page = readFileSync('index.html', 'utf8');

    expect(page.match(/<script\b(?![^>]*\bsrc=)[^>]*>/g)).toBeNull();
  });

  it('serves the preview the same policy, less what needs https', () => {
    expect(site['X-Frame-Options']).toBe('DENY');
    expect(site['Permissions-Policy']).toContain('microphone=(self)');
    expect(policy['upgrade-insecure-requests']).toBeUndefined();
    expect(site['Strict-Transport-Security']).toBeUndefined();
    expect(readFileSync(FILE, 'utf8')).toMatch(/upgrade-insecure-requests[\s\S]*Strict-Transport/);
  });

  it('keeps the build’s named files for good, and asks for the worker every time', () => {
    expect(pagesHeaders(FILE, '/assets/*')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    expect(pagesHeaders(FILE, '/sw.js')).toEqual({ 'Cache-Control': 'no-cache' });
  });
});
