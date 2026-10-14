import { ReceiptText, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cx } from '@/core/utils/cx';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';

const TABS = [
  { to: paths.entries, label: 'tabs.entries', icon: ReceiptText, end: true },
  { to: paths.prices, label: 'tabs.prices', icon: TrendingUp, end: false },
] as const;

/** The module's two sides: what was spent, and what things cost. */
export function SectionTabs() {
  const { t } = useTranslation(NS);
  return (
    <nav
      aria-label={t('tabs.label')}
      className="inline-flex rounded-full border border-border bg-surface/70 p-1 backdrop-blur"
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cx(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-muted hover:text-text',
            )
          }
        >
          <Icon aria-hidden="true" className="size-4" />
          {t(label)}
        </NavLink>
      ))}
    </nav>
  );
}
