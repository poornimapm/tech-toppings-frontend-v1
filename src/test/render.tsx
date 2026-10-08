import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, type RouteObject } from 'react-router';

import { App, AppProviders } from '@/platform/shell/app';
import { routes as appRoutes } from '@/platform/shell/routes';

/** Fresh client per test: no shared cache, no default retries (tests opt in explicitly). */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

/** Render the real app (providers + router) at `path`. */
export function renderApp(path = '/', routes: RouteObject[] = appRoutes) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();
  return {
    user,
    router,
    queryClient,
    ...render(<App router={router} queryClient={queryClient} />),
  };
}

/** Render one component inside the app providers (query client, theme, error boundary). */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();
  return {
    user,
    queryClient,
    ...render(<AppProviders queryClient={queryClient}>{ui}</AppProviders>),
  };
}
