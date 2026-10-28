/**
 * The /api proxy, a Cloudflare Pages Function (ADR-0003, ADR-0019). The browser calls the API on
 * the app's own origin, so the refresh cookie stays first-party; this forwards each call to the
 * API host with the secret that host requires (SECURITY_PROXY_SECRET), and with the caller's
 * real address, which nothing else may set. Self-contained: Cloudflare bundles it on its own.
 *
 * Pages settings (docs/deployment.md): API_ORIGIN, API_PROXY_SECRET, and API_PROXY_HEADER if
 * the API's SECURITY_PROXY_HEADER was changed.
 */
export interface ProxyEnv {
  /** Where the API runs, e.g. https://tech-toppings-api.onrender.com (no path). */
  API_ORIGIN?: string;
  API_PROXY_SECRET?: string;
  API_PROXY_HEADER?: string;
}

const PREFIX = '/api';
const DEFAULT_HEADER = 'X-TT-Proxy';
/** As the API's SECURITY_PROXY_HEADER must be. */
const HEADER_NAME = /^[A-Za-z0-9-]+$/;
const WITHOUT_BODY = new Set(['GET', 'HEAD']);
/** Not passed on: hop-by-hop headers (RFC 9110 §7.6.1), and what only this proxy may say. */
const DROPPED = new Set([
  'connection',
  'keep-alive',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
]);

/** The API's origin, if API_ORIGIN names one: https, or http on this machine (local runs). */
function apiOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  const plain = url.pathname === '/' && !url.search && !url.username && !url.password;
  return (url.protocol === 'https:' || local) && plain ? url : null;
}

/** An answer in the API's own error shape, which the app reads and words. */
function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { code, message, details: null, request_id: null },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function forwardedHeaders(request: Request, url: URL, name: string, secret: string): Headers {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    const lower = key.toLowerCase();
    if (!DROPPED.has(lower) && !lower.startsWith('cf-') && lower !== name.toLowerCase()) {
      headers.append(key, value);
    }
  }
  // Cloudflare's own word for who is calling; anything the caller claimed was dropped above.
  const client = request.headers.get('CF-Connecting-IP');
  if (client) headers.set('X-Forwarded-For', client);
  headers.set('X-Forwarded-Proto', url.protocol.slice(0, -1));
  headers.set('X-Forwarded-Host', url.host);
  headers.set(name, secret);
  return headers;
}

/** Where a redirect into the API host goes through this proxy instead; any other as it is. */
function throughProxy(location: string, origin: URL, url: URL): string {
  try {
    const target = new URL(location, origin);
    return target.origin === origin.origin
      ? `${url.origin}${PREFIX}${target.pathname}${target.search}`
      : location;
  } catch {
    return location;
  }
}

/** The API's answer, with any redirect into the API host pointed back through this proxy. */
function relayed(upstream: Response, origin: URL, url: URL): Response {
  const headers = new Headers(upstream.headers);
  const location = headers.get('Location');
  if (location) headers.set('Location', throughProxy(location, origin, url));
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function proxyToApi(request: Request, env: ProxyEnv): Promise<Response> {
  const origin = apiOrigin(env.API_ORIGIN);
  const secret = env.API_PROXY_SECRET;
  const given = env.API_PROXY_HEADER?.trim() ?? '';
  const name = given === '' ? DEFAULT_HEADER : given; // left empty: the default
  if (!origin || !secret || !HEADER_NAME.test(name)) {
    return failure(500, 'INTERNAL_ERROR', 'The app is not connected to its server yet.');
  }
  const url = new URL(request.url);
  const target = new URL(origin);
  // Set as a path, never resolved as a URL: "/api//elsewhere" must not leave the API host.
  target.pathname = url.pathname.slice(PREFIX.length) || '/';
  target.search = url.search;
  const init: RequestInit = {
    method: request.method,
    headers: forwardedHeaders(request, url, name, secret),
    body: WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
  };
  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    // Unreachable (asleep, restarting, down): the app retries and says it is waking up.
    return failure(503, 'SERVICE_NOT_READY', 'The server could not be reached.');
  }
  return relayed(upstream, origin, url);
}

export const onRequest = ({ request, env }: { request: Request; env: ProxyEnv }) =>
  proxyToApi(request, env);
