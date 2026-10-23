import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, Outlet } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { cx } from '@/core/utils/cx';

/** The console's sections, in tab order. Paths are relative to /admin. */
const SECTIONS = [
  { to: '', labelKey: 'admin.nav.usage' },
  { to: 'users', labelKey: 'admin.nav.users' },
  { to: 'allowlist', labelKey: 'admin.nav.allowlist' },
  { to: 'modules', labelKey: 'admin.nav.modules' },
  { to: 'audit', labelKey: 'admin.nav.audit' },
] as const;

/**
 * The admin console's frame. Only admins get in; the API refuses everyone else anyway (every
 * /v1/admin route checks the role), so this only spares others a page of errors.
 */
export function AdminLayout() {
  const { t } = useTranslation();
  const isAdmin = useSession((state) => state.user?.role === 'admin');
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
      <nav
        aria-label={t('admin.title')}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            end={section.to === ''}
            className={({ isActive }) =>
              cx(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text',
              )
            }
          >
            {t(section.labelKey)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
