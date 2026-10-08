import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import type { components } from '@/core/api/schema';

type Schemas = components['schemas'];

export const healthOk: Schemas['HealthStatus'] = {
  status: 'ok',
  name: 'Tech-Toppings API',
  version: '0.1.0',
};
const readyOk: Schemas['ReadinessStatus'] = { status: 'ready', checks: { mongo: 'ok' } };

export function errorEnvelope(code: string, message: string): Schemas['ErrorResponse'] {
  return { code, message, details: null, request_id: 'req-test-0001' };
}

/** Default happy-path API; tests override per case with `server.use(...)`. */
const handlers = [
  http.get('*/api/healthz', () => HttpResponse.json(healthOk)),
  http.get('*/api/readyz', () => HttpResponse.json(readyOk)),
];

export const server = setupServer(...handlers);
