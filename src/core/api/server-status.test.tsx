import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { delay } from 'msw';
import { http, HttpResponse } from 'msw/http';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/core/api/api-error';
import { createQueryClient } from '@/core/api/query-client';
import {
  backoffDelay,
  deriveServerStatus,
  retriesWithin,
  useServerStatus,
  type ServerStatusOptions,
} from '@/core/api/server-status';
import { healthOk, server } from '@/test/msw';
import { createTestQueryClient } from '@/test/render';

const fast: ServerStatusOptions = {
  wakeThresholdMs: 40,
  maxWaitMs: 60,
  pollMs: 60_000,
  retryDelay: () => 20,
};

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('server status helpers', () => {
  it('backs off exponentially up to 5 seconds', () => {
    expect([0, 1, 2, 3, 4, 10].map(backoffDelay)).toEqual([1000, 2000, 4000, 5000, 5000, 5000]);
  });

  it('counts how many retries fit in the waiting budget', () => {
    expect(retriesWithin(90_000, backoffDelay)).toBe(19); // 1+2+4 + 16x5 = 87s
    expect(retriesWithin(500, backoffDelay)).toBe(0);
    expect(retriesWithin(60, () => 20)).toBe(3);
  });

  it.each([
    [{ isSuccess: true, isError: false, isSlow: true }, 'online'],
    [{ isSuccess: false, isError: true, isSlow: false }, 'offline'],
    [{ isSuccess: false, isError: false, isSlow: true }, 'waking'],
    [{ isSuccess: false, isError: false, isSlow: false }, 'checking'],
  ] as const)('derives %o as %s', (state, expected) => {
    expect(deriveServerStatus(state)).toBe(expected);
  });
});

describe('useServerStatus', () => {
  it('is online when the health check answers', async () => {
    const { result } = renderHook(() => useServerStatus(fast), { wrapper });

    expect(result.current.status).toBe('checking');
    await waitFor(() => {
      expect(result.current.status).toBe('online');
    });
    expect(result.current.health).toEqual(healthOk);
  });

  it('reports "waking" while a slow cold start is in progress, then online', async () => {
    server.use(
      http.get('*/api/healthz', async () => {
        await delay(150);
        return HttpResponse.json(healthOk);
      }),
    );
    const { result } = renderHook(() => useServerStatus(fast), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('waking');
    });
    await waitFor(() => {
      expect(result.current.status).toBe('online');
    });
  });

  it('goes offline after the retry budget and recovers on manual retry', async () => {
    let healthy = false;
    server.use(
      http.get('*/api/healthz', () =>
        healthy ? HttpResponse.json(healthOk) : HttpResponse.error(),
      ),
    );
    const { result } = renderHook(() => useServerStatus(fast), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('offline');
    });

    healthy = true;
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('online');
    });
  });
});

describe('createQueryClient', () => {
  it('retries only transient failures, at most twice', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry;
    if (typeof retry !== 'function') throw new Error('expected a retry function');

    const coldStart = new ApiError(503, 'SERVICE_NOT_READY', 'starting');
    expect(retry(0, coldStart)).toBe(true);
    expect(retry(1, coldStart)).toBe(true);
    expect(retry(2, coldStart)).toBe(false);
    expect(retry(0, new ApiError(422, 'VALIDATION_ERROR', 'bad input'))).toBe(false);
    expect(retry(0, new Error('not an API error'))).toBe(false);
  });
});
