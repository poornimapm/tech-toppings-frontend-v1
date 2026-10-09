import { useQueryClient } from '@tanstack/react-query';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { signOut } from '@/core/auth/session';
import { useSession } from '@/core/auth/session-store';
import { Button } from '@/design-system';

/** Header area: who is signed in, Security, Sign out (or a Sign-in link). */
export function AccountNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
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
      <Link
        to="/account/security"
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-bg"
        title={t('nav.account', { name: user.name })}
      >
        <ShieldCheck aria-hidden="true" className="size-4 sm:hidden" />
        <span className="sr-only sm:not-sr-only">{t('nav.security')}</span>
      </Link>
      <Button
        variant="ghost"
        title={t('nav.signOut')}
        onClick={() => {
          void signOut().finally(() => {
            queryClient.clear();
            void navigate('/login', { replace: true });
          });
        }}
      >
        <LogOut aria-hidden="true" className="size-4 sm:hidden" />
        <span className="sr-only sm:not-sr-only">{t('nav.signOut')}</span>
      </Button>
    </nav>
  );
}
