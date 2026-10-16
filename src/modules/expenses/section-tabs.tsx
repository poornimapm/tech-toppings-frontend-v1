import { ChartPie, ReceiptText, Target, TrendingUp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cx } from '@/core/utils/cx';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';

const TABS = [
  { to: paths.entries, label: 'tabs.entries', icon: ReceiptText, end: true },
  { to: paths.overview, label: 'tabs.overview', icon: ChartPie, end: false },
  { to: paths.prices, label: 'tabs.prices', icon: TrendingUp, end: false },
  { to: paths.plan(), label: 'tabs.plan', icon: Target, end: false },
] as const;

/** The module's sides: what was spent, how it went, what things cost, and what is planned. On a
 *  narrow screen the tabs scroll sideways inside their bar, never the page. */
export function SectionTabs() {
  const { t } = useTranslation(NS);
  const bar = useRef<HTMLElement>(null);
  // On a phone the open tab may sit past the bar's edge: centre it by scrolling the bar (never
  // the page), so "you are here" always shows. The ends stop where the bar does.
  useEffect(() => {
    const open = bar.current?.querySelector('[aria-current="page"]');
    if (!bar.current || !open) return;
    const [tab, box] = [open.getBoundingClientRect(), bar.current.getBoundingClientRect()];
    bar.current.scrollLeft += (tab.left + tab.right - box.left - box.right) / 2;
  }, []);
  return (
    <nav
      ref={bar}
      aria-label={t('tabs.label')}
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-border bg-surface/70 p-1 backdrop-blur"
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cx(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
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
