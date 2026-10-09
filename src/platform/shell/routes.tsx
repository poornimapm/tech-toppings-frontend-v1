import { createBrowserRouter, type RouteObject } from 'react-router';

import { PublicOnly, RequireAuth, RequirePasswordFresh } from '@/core/auth/guards';
import { AppLayout } from '@/platform/shell/app-layout';
import { NotFoundPage } from '@/platform/shell/not-found-page';
import { RouteErrorPage } from '@/platform/shell/route-error-page';

/**
 * Route tree. Pages load lazily; Phase 3 appends module routes from their manifests.
 *
 * /login, /register        only when signed out (PublicOnly)
 * /change-password         signed in; also the only page while a reset password is pending
 * /, /account/security     signed in with a password of their own (RequirePasswordFresh)
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
