import { useQueryClient } from '@tanstack/react-query';
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
    <nav aria-label={t('nav.account', { name: user.name })} className="flex items-center gap-2">
      <Link
        to="/account/security"
        className="rounded-lg px-2 py-1.5 text-sm hover:bg-bg"
        title={t('nav.account', { name: user.name })}
      >
        {t('nav.security')}
      </Link>
      <Button
        variant="ghost"
        onClick={() => {
          void signOut().finally(() => {
            queryClient.clear();
            void navigate('/login', { replace: true });
          });
        }}
      >
        {t('nav.signOut')}
      </Button>
    </nav>
  );
}
