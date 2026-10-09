import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router/dom';
import type { createBrowserRouter } from 'react-router';

import { AuthBootstrap } from '@/core/auth/auth-bootstrap';
import { useApplyTheme } from '@/core/theme/theme-store';
import { AppErrorBoundary } from '@/platform/shell/app-error-boundary';
import { PreferenceSync } from '@/platform/shell/preference-sync';

type AppRouter = ReturnType<typeof createBrowserRouter>;

function ThemeEffect() {
  useApplyTheme();
  return null;
}

export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeEffect />
        <AuthBootstrap />
        <PreferenceSync />
        {children}
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export function App({ router, queryClient }: { router: AppRouter; queryClient: QueryClient }) {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
