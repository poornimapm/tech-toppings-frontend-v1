import { m } from 'motion/react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { useUnreadCount } from '@/core/notifications/queries';
import { cx } from '@/core/utils/cx';
import { pages } from '@/platform/shell/pages';

/** Above this the navigation sits in the header; below it, in a bar along the bottom. */
export const WIDE_SCREEN = '(min-width: 40rem)'; // Tailwind's `sm`

const BADGE_MAX = 9;

/**
 * The shell's main destinations, with the unread count on Notifications. On phones (`bar`) it
 * is a thumb-reachable bar with Home; on wider screens it is part of the header, where the
 * logo already leads home.
 */
export function ShellNav({ bar = false }: { bar?: boolean }) {
  const { t } = useTranslation();
  const unread = useUnreadCount().data ?? 0;
  const highlightId = useId();
  const items = [...(bar ? [pages.home] : []), pages.dashboard, pages.notifications];

  return (
    <nav
      aria-label={t('nav.main')}
      className={
        bar
          ? 'fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border/70 bg-glass px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-xl'
          : 'flex items-center gap-1'
      }
    >
      {items.map((page) => {
        const Icon = page.icon;
        const label = t(page.labelKey);
        const count = page === pages.notifications ? unread : 0;
        return (
          <NavLink
            key={page.path}
            to={page.path}
            end
            title={bar ? undefined : label}
            aria-label={count > 0 ? `${label}, ${t('inbox.unread', { count })}` : undefined}
            className={cx(
              'relative isolate text-muted transition-colors hover:text-text aria-[current=page]:text-primary',
              bar
                ? 'flex min-w-18 flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs font-medium'
                : 'inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId={highlightId}
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-[inherit] bg-primary/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">
                  <Icon aria-hidden="true" className="size-5" />
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-contrast"
                    >
                      {count > BADGE_MAX ? `${BADGE_MAX}+` : count}
                    </span>
                  )}
                </span>
                <span className={bar ? undefined : 'sr-only lg:not-sr-only'}>{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
