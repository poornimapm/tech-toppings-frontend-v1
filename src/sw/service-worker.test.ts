import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// The worker runs here against a stand-in scope: its events are dispatched by hand, and Cache
// Storage is a map of paths per cache.
const ORIGIN = 'https://app.example.com';
const CURRENT = 'tt-shell-v2';

const stores = new Map<string, Map<string, Response>>();
const pathOf = (request: RequestInfo | URL) =>
  new URL(request instanceof Request ? request.url : String(request), ORIGIN).pathname;
const fakeCaches = {
  open: (name: string) => {
    const store = stores.get(name) ?? new Map<string, Response>();
    stores.set(name, store);
    return Promise.resolve({
      put: (request: RequestInfo, response: Response) => {
        store.set(pathOf(request), response);
        return Promise.resolve();
      },
      match: (request: RequestInfo) => Promise.resolve(store.get(pathOf(request))),
    });
  },
  keys: () => Promise.resolve([...stores.keys()]),
  delete: (name: string) => Promise.resolve(stores.delete(name)),
  match: (request: RequestInfo, options?: MultiCacheQueryOptions) =>
    Promise.resolve(stores.get(options?.cacheName ?? '')?.get(pathOf(request))),
};

const scope = Object.assign(new EventTarget(), {
  location: new URL(`${ORIGIN}/sw.js`),
  registration: { showNotification: vi.fn() },
  clients: { matchAll: vi.fn(), openWindow: vi.fn(), claim: vi.fn() },
  skipWaiting: vi.fn(),
});
const network = vi.fn<(request: RequestInfo, init?: RequestInit) => Promise<Response>>();

beforeAll(async () => {
  vi.stubGlobal('self', scope);
  vi.stubGlobal('caches', fakeCaches);
  vi.stubGlobal('fetch', network);
  vi.stubGlobal('__PRECACHE__', ['/', '/assets/app-2.js']);
  vi.stubGlobal('__SHELL__', '/');
  vi.stubGlobal('__SW_VERSION__', 'v2');
  vi.stubGlobal('__API_BASE__', '/api');
  await import('@/sw/service-worker');
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  stores.clear();
  network.mockReset();
  scope.registration = { showNotification: vi.fn() };
  scope.clients = {
    matchAll: vi.fn(() => Promise.resolve([])),
    openWindow: vi.fn(),
    claim: vi.fn(),
  };
});

/** Fire an event at the worker; what it promised to finish (or answer with). */
function dispatch(type: string, fields: object = {}): Promise<unknown[]> {
  const pending: Promise<unknown>[] = [];
  const keep = (promise: Promise<unknown>) => {
    pending.push(promise);
  };
  scope.dispatchEvent(
    Object.assign(new Event(type), fields, { waitUntil: keep, respondWith: keep }),
  );
  return Promise.all(pending);
}

function redirected(response: Response): Response {
  return Object.defineProperty(response, 'redirected', { value: true });
}

/** An open window of the site. */
function appWindow(url: string, { focusAllowed = true } = {}) {
  const client = { url, postMessage: vi.fn(), navigate: vi.fn(), focus: vi.fn() };
  client.focus.mockImplementation(() =>
    focusAllowed
      ? Promise.resolve(client)
      : Promise.reject(new DOMException('', 'InvalidAccessError')),
  );
  return client;
}

describe('keeping the app for offline use', () => {
  it('keeps the page under the base URL, without the redirect the host answered with', async () => {
    network.mockImplementation((url) =>
      Promise.resolve(url === '/' ? redirected(new Response('the shell')) : new Response('code')),
    );
    await dispatch('install');
    expect(network).toHaveBeenCalledWith('/', { cache: 'no-cache' });

    const shell = stores.get(CURRENT)?.get('/');
    expect(shell?.redirected).toBe(false); // a page load would refuse a redirected answer
    expect(await shell?.text()).toBe('the shell');
    expect([...(stores.get(CURRENT)?.keys() ?? [])].sort()).toEqual(['/', '/assets/app-2.js']);
  });

  it('opens the kept page when the network is down', async () => {
    stores.set(CURRENT, new Map([['/', new Response('the shell')]]));
    network.mockRejectedValue(new TypeError('offline'));
    const page = { method: 'GET', mode: 'navigate', url: `${ORIGIN}/m/expenses` };
    const [response] = (await dispatch('fetch', { request: page })) as Response[];
    expect(await response?.text()).toBe('the shell');
  });

  it('keeps the previous build for tabs still running it, and drops older ones', async () => {
    stores.set('tt-shell-v0', new Map());
    stores.set('tt-shell-v1', new Map([['/assets/route-1.js', new Response('old route')]]));
    stores.set('tt-shell-replaced', new Map()); // installed, but never in charge
    await (
      await fakeCaches.open('tt-sw-state')
    ).put('/last-active-build', new Response('tt-shell-v1'));
    stores.set(CURRENT, new Map());
    await dispatch('activate');
    expect([...stores.keys()].filter((name) => name.startsWith('tt-shell-'))).toEqual([
      'tt-shell-v1',
      CURRENT,
    ]);

    // A tab still on the previous build opens a page it had not yet: from that build's files.
    const request = new Request(`${ORIGIN}/assets/route-1.js`);
    const [response] = (await dispatch('fetch', { request })) as Response[];
    expect(await response?.text()).toBe('old route');
    expect(network).not.toHaveBeenCalled();

    const state = await fakeCaches.match('/last-active-build', { cacheName: 'tt-sw-state' });
    expect(await state?.text()).toBe(CURRENT); // the next build keeps this one
  });

  it('answers from this build’s files without listing the other builds', async () => {
    stores.set(CURRENT, new Map([['/assets/app-2.js', new Response('code')]]));
    const keys = vi.spyOn(fakeCaches, 'keys');
    const request = new Request(`${ORIGIN}/assets/app-2.js`);
    const [response] = (await dispatch('fetch', { request })) as Response[];
    expect(await response?.text()).toBe('code');
    expect(keys).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    keys.mockRestore();
  });
});

describe('pushes', () => {
  const push = (body: object) => ({ data: { text: () => JSON.stringify(body) } });

  it('shows every push, even with the app in front, and refreshes the open windows', async () => {
    const looking = Object.assign(appWindow(`${ORIGIN}/dashboard`), {
      focused: true,
      visibilityState: 'visible',
    });
    scope.clients.matchAll.mockResolvedValue([looking]);
    await dispatch('push', push({ type: 'push.test', params: {}, tag: 'test' }));

    expect(scope.registration.showNotification).toHaveBeenCalledWith(
      'Tech-Toppings',
      expect.objectContaining({ tag: 'test', badge: '/icons/badge-96.png' }),
    );
    expect(looking.postMessage).toHaveBeenCalledWith({
      type: 'tt-push',
      message: { type: 'push.test', params: {}, tag: 'test' },
    });
  });

  const click = (url: string) => ({ notification: { close: vi.fn(), data: { url } } });

  it('focuses an open app window first, then routes it in place', async () => {
    const api = appWindow(`${ORIGIN}/api/v1/docs`);
    const app = appWindow(`${ORIGIN}/dashboard`);
    scope.clients.matchAll.mockResolvedValue([api, app]);
    await dispatch('notificationclick', click('/m/expenses/loans'));

    expect(app.postMessage).toHaveBeenCalledWith({ type: 'tt-open', url: '/m/expenses/loans' });
    expect(app.focus.mock.invocationCallOrder[0]).toBeLessThan(
      app.postMessage.mock.invocationCallOrder[0] ?? 0,
    );
    expect(app.navigate).not.toHaveBeenCalled(); // no reload: the page routes itself
    expect(api.postMessage).not.toHaveBeenCalled();
    expect(scope.clients.openWindow).not.toHaveBeenCalled();
  });

  it('still routes the window when focusing it is no longer allowed', async () => {
    const app = appWindow(`${ORIGIN}/dashboard`, { focusAllowed: false });
    scope.clients.matchAll.mockResolvedValue([app]);
    await dispatch('notificationclick', click('/notifications'));
    expect(app.postMessage).toHaveBeenCalledWith({ type: 'tt-open', url: '/notifications' });
  });

  it('opens a window when none of the app is open', async () => {
    await dispatch('notificationclick', click('/notifications?tab=all'));
    expect(scope.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/notifications?tab=all`);
  });

  it.each([
    // Its dot segments collapse to `//evil.com/x`: as a bare path, a window opens that host.
    ['a path that collapses to another host', '/m/a/../..//evil.com/x', `${ORIGIN}//evil.com/x`],
    ['another site', 'https://evil.com/x', `${ORIGIN}/`],
  ])('opens only this site for %s', async (_case, url, opened) => {
    await dispatch('notificationclick', click(url));
    expect(scope.clients.openWindow).toHaveBeenCalledWith(opened);
  });
});
