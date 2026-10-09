import { createBrowserRouter, type RouteObject } from 'react-router';

import { PublicOnly, RequireAuth, RequirePasswordFresh } from '@/core/auth/guards';
import { AppLayout } from '@/platform/shell/app-layout';
import { moduleRoutes } from '@/platform/shell/module-routes';
import { NotFoundPage } from '@/platform/shell/not-found-page';
import { RouteErrorPage } from '@/platform/shell/route-error-page';

/**
 * Route tree. Pages load lazily; module pages come from their manifests (module-routes.tsx).
 *
 * /login, /register        only when signed out (PublicOnly)
 * /change-password         signed in; also the only page while a reset password is pending
 * /, /account/security     signed in with a password of their own (RequirePasswordFresh)
 * /m/<slug>/*              a module's own pages, while it is available to the user
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('@/platform/auth/login-page')).LoginPage,
            }),
          },
          {
            path: 'register',
            lazy: async () => ({
              Component: (await import('@/platform/auth/register-page')).RegisterPage,
            }),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'change-password',
            lazy: async () => ({
              Component: (await import('@/platform/auth/change-password-page')).ChangePasswordPage,
            }),
          },
          {
            element: <RequirePasswordFresh />,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/platform/welcome/welcome-page')).WelcomePage,
                }),
              },
              {
                path: 'account/security',
                lazy: async () => ({
                  Component: (await import('@/platform/auth/security-page')).SecurityPage,
                }),
              },
              ...moduleRoutes(),
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
