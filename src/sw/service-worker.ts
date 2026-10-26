import {
  messageOf,
  noticeOf,
  PUSH_TEXTS_CACHE,
  PUSH_TEXTS_URL,
  type PushTexts,
} from '@/core/push/texts';
import { isAppPage, strategyFor } from '@/sw/strategy';

/**
 * The service worker (ADR-0018). It keeps the build's files for offline use, opens the cached
 * app shell when the network is down, and leaves the API to the network. A new version waits
 * until the page asks it to take over (the user chose "Reload"), so a page never mixes two;
 * the build before it stays kept, for tabs that run it until they reload.
 * It also shows pushes, worded from the texts the page left for it.
 */
declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: string[];
/** The base URL: the app shell is kept under it (see vite-plugins/pwa.ts). */
declare const __SHELL__: string;
declare const __SW_VERSION__: string;
declare const __API_BASE__: string;

const PREFIX = 'tt-shell-';
const CACHE = PREFIX + __SW_VERSION__;
/** Which build was last in charge: activating the next one keeps its files. */
const STATE_CACHE = 'tt-sw-state';
const LAST_ACTIVE = `${__SHELL__}last-active-build`;
const ICON = `${__SHELL__}icons/icon-192.png`;
/** Monochrome: Android draws a notification's badge from its transparency alone. */
const BADGE = `${__SHELL__}icons/badge-96.png`;

/** A copy without the redirect it came through: a page load refuses a redirected answer. */
function plain(response: Response): Response {
  if (!response.redirected) return response;
  const { body, status, statusText, headers } = response;
  return new Response(body, { status, statusText, headers });
}

async function keep(cache: Cache, url: string): Promise<void> {
  // Revalidated: the build as the host serves it now, never an older copy from the HTTP cache.
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new TypeError(`Not kept for offline use: ${url} (${response.status})`);
  await cache.put(url, plain(response));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(__PRECACHE__.map((url) => keep(cache, url)))),
  );
});

const olderBuilds = async () =>
  (await caches.keys()).filter((key) => key.startsWith(PREFIX) && key !== CACHE);

/** Record this build as the one in charge; the one that was, if any. */
async function takeCharge(): Promise<string | undefined> {
  const state = await caches.open(STATE_CACHE);
  const previous = await (await state.match(LAST_ACTIVE))?.text();
  await state.put(LAST_ACTIVE, new Response(CACHE));
  return previous;
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tabs still running the previous build load its files from its cache until they reload:
      // only older builds, and ones never in charge, go.
      const previous = await takeCharge();
      const gone = (await olderBuilds()).filter((key) => key !== previous);
      await Promise.all(gone.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') void self.skipWaiting();
});

async function fromShell(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(__SHELL__, { cacheName: CACHE })) ?? Response.error();
  }
}

/**
 * This build's copy, else a kept older build's (for a tab still running it), else the network.
 * The older builds are listed only on a miss: almost every request is this build's.
 */
async function fromCache(request: Request): Promise<Response> {
  // A build's file never changes under its name, so a `Vary` header (hosts add `Vary: Origin`;
  // module scripts send an Origin) must not keep the stored copy from answering.
  const keptIn = (cacheName: string) => caches.match(request, { cacheName, ignoreVary: true });
  const current = await keptIn(CACHE);
  if (current) return current;
  for (const cacheName of await olderBuilds()) {
    const older = await keptIn(cacheName);
    if (older) return older;
  }
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const strategy = strategyFor(event.request, self.location.origin, __API_BASE__);
  if (strategy === 'shell') event.respondWith(fromShell(event.request));
  if (strategy === 'cache') event.respondWith(fromCache(event.request));
});

async function pushTexts(): Promise<PushTexts | undefined> {
  const stored = await caches.match(PUSH_TEXTS_URL, { cacheName: PUSH_TEXTS_CACHE });
  return stored ? ((await stored.json()) as PushTexts) : undefined;
}

const windows = () => self.clients.matchAll({ type: 'window', includeUncontrolled: true });

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const message = messageOf(event.data?.text());
      const texts = await pushTexts();
      const notice = noticeOf(texts, message);
      // Every push shows, even with the app in front: browsers drop a subscription whose pushes
      // show nothing (Safari after three). The tag replaces an earlier notice of the same thing.
      await self.registration.showNotification(notice.title, {
        body: notice.body,
        tag: notice.tag,
        lang: texts?.language,
        icon: ICON,
        badge: BADGE,
        data: { url: notice.url },
      });
      // Open windows refresh their bell at once.
      for (const client of await windows()) client.postMessage({ type: 'tt-push', message });
    })(),
  );
});

/**
 * Show the page a notification leads to (this site's only; anything else opens the shell). An
 * open app window is focused first, while the click still allows it (Firefox: for one second),
 * then routes there itself, without a reload; a form with unsaved input asks before it is left
 * (the unsaved-work guard). A new window only when no app window is open.
 */
async function openPage(url: string): Promise<void> {
  const origin = self.location.origin;
  const given = new URL(url, origin);
  const target = given.origin === origin ? given : new URL(__SHELL__, origin);
  const app = (await windows()).find((client) => isAppPage(client.url, origin, __API_BASE__));
  if (!app) {
    // The whole URL: a bare path whose dot segments collapse to `//host` would open that host.
    await self.clients.openWindow(target.href);
    return;
  }
  await app.focus().catch(() => undefined); // not allowed any more: it still routes, behind
  app.postMessage({ type: 'tt-open', url: target.pathname + target.search + target.hash });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url = __SHELL__ } = (event.notification.data ?? {}) as { url?: string };
  event.waitUntil(openPage(url));
});
