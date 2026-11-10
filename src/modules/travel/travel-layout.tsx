import { House, Luggage, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';

import { cx } from '@/core/utils/cx';
import { NS } from '@/modules/travel/i18n';

/** The module's sections, in tab order: only those built so far. */
const SECTIONS: { to: string; key: 'home' | 'trips'; icon: LucideIcon }[] = [
  { to: '', key: 'home', icon: House },
  { to: 'trips', key: 'trips', icon: Luggage },
];

/** Travel's frame: its name, and its sections as tabs with icons and words. */
export function TravelLayout() {
  const { t } = useTranslation(NS);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <nav aria-label={t('title')} className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={key}
            to={to}
            end={to === ''}
            className={({ isActive }) =>
              cx(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text hover:bg-bg',
              )
            }
          >
            <Icon aria-hidden="true" className="size-4" />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
