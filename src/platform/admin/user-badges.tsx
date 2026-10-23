import { useTranslation } from 'react-i18next';

import { Badge } from '@/design-system';
import type { AdminUser } from '@/platform/admin/admin-api';

/** An account's role and anything unusual about it, as small labels. */
export function UserBadges({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap gap-1">
      {user.role === 'admin' && <Badge tone="beta">{t('admin.users.roles.admin')}</Badge>}
      {user.disabled && <Badge tone="locked">{t('admin.users.disabled')}</Badge>}
      {user.locked && <Badge tone="soon">{t('admin.users.locked')}</Badge>}
      {user.must_change_password && <Badge tone="soon">{t('admin.users.mustChange')}</Badge>}
      {user.two_factor && <Badge tone="success">{t('admin.users.twoFactor')}</Badge>}
    </span>
  );
}
