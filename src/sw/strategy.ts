/** How the service worker answers a request. */
export type Strategy = 'shell' | 'cache' | 'network';

interface RequestFacts {
  method: string;
  mode: RequestMode;
  url: string;
}

/**
 * Pages fall back to the cached app shell when the network is down; the app's own files come
 * from the builds the worker keeps (their names change with their content), then the network;
 * everything else, the API above all, goes to the network and is never stored: the cache holds
 * no one's data.
 */
export function strategyFor(request: RequestFacts, origin: string, apiBase: string): Strategy {
  if (request.method !== 'GET') return 'network';
  const url = new URL(request.url);
  if (url.origin !== origin) return 'network';
  const api = apiBase.replace(/\/$/, '');
  if (api && (url.pathname === api || url.pathname.startsWith(`${api}/`))) return 'network';
  return request.mode === 'navigate' ? 'shell' : 'cache';
}

/** A page of the app (not the API, not another site): what a notification may open. */
export function isAppPage(url: string, origin: string, apiBase: string): boolean {
  return strategyFor({ method: 'GET', mode: 'navigate', url }, origin, apiBase) === 'shell';
}
