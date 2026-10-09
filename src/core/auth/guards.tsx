import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';

import { safeNext } from '@/core/auth/safe-next';
import { useSession } from '@/core/auth/session-store';

export function AuthSplash() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="py-24 text-center text-muted">
      {t('auth.restoring')}
    </div>
  );
}

/** Children render only for a signed-in user; others go to /login?next=<where they were>. */
export function RequireAuth() {
  const status = useSession((state) => state.status);
  const location = useLocation();
  if (status === 'unknown') return <AuthSplash />;
  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

/** After an admin reset, nothing but the change-password screen is reachable. */
export function RequirePasswordFresh() {
  const mustChange = useSession((state) => state.user?.must_change_password ?? false);
  return mustChange ? <Navigate to="/change-password" replace /> : <Outlet />;
}

/** Sign-in and registration pages: a signed-in visitor is sent on to where they wanted to go. */
export function PublicOnly() {
  const status = useSession((state) => state.status);
  const [params] = useSearchParams();
  if (status === 'unknown') return <AuthSplash />;
  if (status === 'authenticated') return <Navigate to={safeNext(params.get('next'))} replace />;
  return <Outlet />;
}
