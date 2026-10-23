import { LogOut, ShieldCheck, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { useSignOut } from '@/core/auth/use-sign-out';
import { Button } from '@/design-system';
import { pages } from '@/platform/shell/pages';

/** Header area: who is signed in, Security, Sign out (or a Sign-in link). */
export function AccountNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const signOut = useSignOut();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  if (status === 'unknown') return null;
  if (!user) {
    return location.pathname === '/login' ? null : (
      <Link to="/login" className="text-sm font-medium text-primary underline underline-offset-4">
        {t('nav.signIn')}
      </Link>
    );
  }

  return (
    // On phones the labels collapse to icons (still the accessible names), so the header fits.
    <nav aria-label={t('nav.account', { name: user.name })} className="flex items-center gap-1">
      {user.role === 'admin' && (
        <Link
          to={pages.admin.path}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-bg"
          title={t('nav.admin')}
        >
          <UserCog aria-hidden="true" className="size-4 sm:hidden" />
          <span className="sr-only sm:not-sr-only">{t('nav.admin')}</span>
        </Link>
      )}
      <Link
        to="/account/security"
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-bg"
        title={t('nav.account', { name: user.name })}
      >
        <ShieldCheck aria-hidden="true" className="size-4 sm:hidden" />
        <span className="sr-only sm:not-sr-only">{t('nav.security')}</span>
      </Link>
      <Button variant="ghost" title={t('nav.signOut')} onClick={signOut}>
        <LogOut aria-hidden="true" className="size-4 sm:hidden" />
        <span className="sr-only sm:not-sr-only">{t('nav.signOut')}</span>
      </Button>
    </nav>
  );
}
