import { createBrowserRouter, type RouteObject } from 'react-router';

import { AppLayout } from '@/platform/shell/app-layout';
import { NotFoundPage } from '@/platform/shell/not-found-page';
import { RouteErrorPage } from '@/platform/shell/route-error-page';

/** Route tree. Pages load lazily; Phase 3 appends module routes from their manifests. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { WelcomePage } = await import('@/platform/welcome/welcome-page');
          return { Component: WelcomePage };
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
