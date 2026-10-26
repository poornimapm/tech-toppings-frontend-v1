import { expect, test } from '@playwright/test';

// The installable app (ADR-0018): this file lets the service worker run, which the other smoke
// tests block so their page.route() stubs see every request.
test.use({ serviceWorkers: 'allow' });

interface Manifest {
  name: string;
  display: string;
  start_url: string;
  icons: { src: string; sizes: string; purpose: string }[];
}

test('the manifest makes the app installable', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');

  const manifest = (await (await request.get('/manifest.webmanifest')).json()) as Manifest;
  expect(manifest).toMatchObject({ name: 'Tech-Toppings', display: 'standalone', start_url: '/' });
  expect(manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);
  for (const icon of manifest.icons) {
    const file = await request.get(icon.src);
    expect(file.ok(), icon.src).toBe(true);
    expect(file.headers()['content-type']).toBe('image/png');
  }
});

/** What the worker kept: each file's path, and whether the page came through a redirect. */
const KEPT = `(async () => {
  const name = (await caches.keys()).find((key) => key.startsWith('tt-shell-'));
  const cache = await caches.open(name);
  const files = (await cache.keys()).map((request) => new URL(request.url).pathname);
  return { files, redirected: (await cache.match('/')).redirected };
})()`;

test('once visited, the app opens with no network at all', async ({ page, context }) => {
  // Signed out, with the server answering (context.route also sees the worker's requests).
  await context.route('**/api/**', (route) =>
    route.request().url().includes('/auth/refresh')
      ? route.fulfill({
          status: 401,
          json: { code: 'AUTH_REFRESH_INVALID', message: 'x', details: null, request_id: 'r' },
        })
      : route.fulfill({ json: { status: 'ok' } }),
  );
  // As Cloudflare Pages does for the worker's copy of the page: `/` answered through a redirect.
  let redirects = 0;
  await context.route(
    (url) => url.pathname === '/' && url.search === '',
    (route) => {
      if (route.request().isNavigationRequest()) return route.continue();
      redirects += 1;
      return route.fulfill({ status: 308, headers: { location: '/index.html' } });
    },
  );
  await page.goto('/login');
  await page.evaluate('navigator.serviceWorker.ready.then(() => true)');
  await page.reload(); // now controlled by the worker
  expect(await page.evaluate('navigator.serviceWorker.controller !== null')).toBe(true);

  const kept = await page.evaluate<{ files: string[]; redirected: boolean }>(KEPT);
  expect(redirects).toBeGreaterThan(0);
  expect(kept.redirected).toBe(false); // a page load refuses an answer that came via a redirect
  expect(kept.files).toEqual(expect.arrayContaining(['/', '/icons/badge-96.png']));
  const notServed = kept.files.filter(
    (file) =>
      ['/index.html', '/sw.js', '/_headers', '/_redirects', '/_routes.json'].includes(file) ||
      file.endsWith('.map') ||
      file.split('/').some((part) => part.startsWith('.')),
  );
  expect(notServed).toEqual([]);

  await context.unroute('**/api/**');
  await context.setOffline(true);
  const failed: string[] = [];
  page.on('requestfailed', (request) => {
    if (!request.url().includes('/api/')) failed.push(request.url());
  });
  await page.reload();
  await expect(page.getByText("You're offline.", { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tech-Toppings' })).toBeVisible();
  expect(failed).toEqual([]); // every file of the app came from the offline copy
  await context.setOffline(false);
});
