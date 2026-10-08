import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';

import { ApiError, NETWORK_ERROR, isTransient } from '@/core/api/api-error';
import { REQUEST_ID_HEADER, api, resolveBaseUrl, unwrap } from '@/core/api/client';
import { errorEnvelope, healthOk, server } from '@/test/msw';

describe('resolveBaseUrl', () => {
  it('makes a relative base absolute against the page origin and drops trailing slashes', () => {
    expect(resolveBaseUrl('/api/', 'http://app.test')).toBe('http://app.test/api');
    expect(resolveBaseUrl('https://api.example.test', 'http://app.test')).toBe(
      'https://api.example.test',
    );
  });
});

describe('unwrap', () => {
  it('returns typed data on success', async () => {
    await expect(unwrap(api.GET('/healthz'))).resolves.toEqual(healthOk);
  });

  it('sends a request id the backend can correlate', async () => {
    let received: string | null = null;
    server.use(
      http.get('*/api/healthz', ({ request }) => {
        received = request.headers.get(REQUEST_ID_HEADER);
        return HttpResponse.json(healthOk);
      }),
    );

    await unwrap(api.GET('/healthz'));

    expect(received).toMatch(/^[0-9a-f]{32}$/);
  });

  it('turns the error envelope into an ApiError', async () => {
    server.use(
      http.get('*/api/readyz', () =>
        HttpResponse.json(errorEnvelope('SERVICE_NOT_READY', 'Not ready.'), { status: 503 }),
      ),
    );

    const error = await unwrap(api.GET('/readyz')).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: 'SERVICE_NOT_READY',
      message: 'Not ready.',
      requestId: 'req-test-0001',
    });
    expect(isTransient(error)).toBe(true);
  });

  it('gives non-envelope failures (e.g. a proxy error page) a synthetic code', async () => {
    server.use(
      http.get(
        '*/api/healthz',
        () =>
          new HttpResponse('<html>Bad Gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html', 'X-Request-ID': 'proxy-req-1' },
          }),
      ),
    );

    const error = await unwrap(api.GET('/healthz')).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 502, code: 'HTTP_502', requestId: 'proxy-req-1' });
  });

  it('reports unreachable servers as NETWORK_ERROR', async () => {
    server.use(http.get('*/api/healthz', () => HttpResponse.error()));

    const error = await unwrap(api.GET('/healthz')).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 0, code: NETWORK_ERROR });
    expect(isTransient(error)).toBe(true);
  });

  it('does not treat client errors as transient', () => {
    expect(isTransient(new ApiError(422, 'VALIDATION_ERROR', 'bad'))).toBe(false);
    expect(isTransient(new Error('plain'))).toBe(false);
  });
});
