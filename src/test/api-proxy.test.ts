import { describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line no-restricted-imports -- the Pages Function lives beside the app, not in src
import { proxyToApi, type ProxyEnv } from '../../functions/api/[[path]]';

const ENV: ProxyEnv = {
  API_ORIGIN: 'https://api.example.test',
  API_PROXY_SECRET: 'proxy-secret-'.repeat(4),
};

/** The API, answering every call with `answer`; returns what it was sent. */
function api(answer: () => Response = () => Response.json({ ok: true })) {
  const sent: Request[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    sent.push(new Request(input, init));
    return Promise.resolve(answer());
  });
  return sent;
}

function call(path: string, init: RequestInit = {}, env: ProxyEnv = ENV) {
  return proxyToApi(new Request(`https://app.example.test${path}`, init), env);
}

describe('the /api proxy', () => {
  it('passes a call on to the API, with its secret and the caller’s real address', async () => {
    const sent = api(
      () =>
        new Response('{"id":"e-1"}', {
          status: 201,
          headers: { 'Set-Cookie': 'tt_refresh=r; Path=/api/v1/auth; HttpOnly; Secure' },
        }),
    );

    const response = await call('/api/v1/expenses/entries?draft=1', {
      method: 'POST',
      body: '{"title":"Tea"}',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access',
        Cookie: 'tt_refresh=r',
        'X-TT-CSRF': '1',
        'Idempotency-Key': 'key-1',
        'CF-Connecting-IP': '203.0.113.7',
        'CF-Ray': 'ray',
        'X-Forwarded-For': '198.51.100.1', // what the caller claims counts for nothing
        'X-TT-Proxy': 'guessed',
      },
    });

    const [request] = sent;
    expect(request?.url).toBe('https://api.example.test/v1/expenses/entries?draft=1');
    expect(request?.method).toBe('POST');
    expect(await request?.text()).toBe('{"title":"Tea"}');
    expect(Object.fromEntries(request?.headers ?? [])).toMatchObject({
      authorization: 'Bearer access',
      cookie: 'tt_refresh=r',
      'x-tt-csrf': '1',
      'idempotency-key': 'key-1',
      'x-forwarded-for': '203.0.113.7',
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'app.example.test',
      'x-tt-proxy': ENV.API_PROXY_SECRET,
    });
    expect(request?.headers.has('cf-ray')).toBe(false);
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('{"id":"e-1"}');
    expect(response.headers.get('Set-Cookie')).toContain('Path=/api/v1/auth');
  });

  it('sends no body with a read, and the bare /api is the API’s root', async () => {
    const sent = api();

    await call('/api');

    expect(sent[0]?.url).toBe('https://api.example.test/');
    expect(sent[0]?.body).toBeNull();
  });

  it('never leaves the API host, whatever the path says', async () => {
    const sent = api();

    await call('/api//elsewhere.example/steal');

    expect(new URL(sent[0]?.url ?? '').host).toBe('api.example.test');
  });

  it('points a redirect into the API back through the proxy, and leaves others alone', async () => {
    api(() => new Response(null, { status: 307, headers: { Location: '/v1/items/?page=2' } }));
    const inside = await call('/api/v1/items?page=2');
    api(() => new Response(null, { status: 302, headers: { Location: 'https://other.test/x' } }));
    const outside = await call('/api/v1/elsewhere');

    expect(inside.headers.get('Location')).toBe('https://app.example.test/api/v1/items/?page=2');
    expect(outside.headers.get('Location')).toBe('https://other.test/x');
  });

  it('passes on a redirect it can’t read as it came, never as an outage', async () => {
    api(() => new Response(null, { status: 302, headers: { Location: 'http://[bad' } }));

    const response = await call('/api/v1/odd');

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('http://[bad');
  });

  it('uses a header name given with spaces around it', async () => {
    const sent = api();

    await call('/api/v1/me', {}, { ...ENV, API_PROXY_HEADER: ' X-Custom-Proxy ' });

    expect(sent[0]?.headers.get('X-Custom-Proxy')).toBe(ENV.API_PROXY_SECRET);
  });

  it('says the server is waking when the API can’t be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('connection refused'));

    const response = await call('/api/v1/me');

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'SERVICE_NOT_READY' });
  });

  it.each([
    ['no API origin', { ...ENV, API_ORIGIN: undefined }],
    ['no secret', { ...ENV, API_PROXY_SECRET: '' }],
    ['a plain-http origin', { ...ENV, API_ORIGIN: 'http://api.example.test' }],
    ['an origin with a path', { ...ENV, API_ORIGIN: 'https://api.example.test/v1' }],
    ['not a URL', { ...ENV, API_ORIGIN: 'api.example.test' }],
    ['a header name copied with its colon', { ...ENV, API_PROXY_HEADER: 'X-TT-Proxy:' }],
    ['a header name with a space', { ...ENV, API_PROXY_HEADER: 'X TT Proxy' }],
  ])('calls nothing with %s', async (_, env: ProxyEnv) => {
    const sent = api();

    const response = await call('/api/v1/me', {}, env);

    expect(response.status).toBe(500);
    expect(sent).toHaveLength(0);
  });

  it('may reach an API on this machine over plain http (local runs)', async () => {
    const sent = api();

    await call('/api/healthz', {}, { ...ENV, API_ORIGIN: 'http://localhost:8000' });

    expect(sent[0]?.url).toBe('http://localhost:8000/healthz');
  });
});
