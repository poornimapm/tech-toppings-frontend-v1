import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

import { useServerStatus } from '@/core/api/server-status';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';
import { useMediaQuery } from '@/core/utils/use-media-query';
import { PaletteHost } from '@/platform/palette/palette-host';
import { PaletteTrigger } from '@/platform/palette/palette-trigger';
import { AccountNav } from '@/platform/shell/account-nav';
import { LanguageSelect } from '@/platform/shell/language-select';
import { ServerStatusBanner } from '@/platform/shell/server-status-banner';
import { ShellNav, WIDE_SCREEN } from '@/platform/shell/shell-nav';
import { ThemeToggle } from '@/platform/shell/theme-toggle';

export function AppLayout() {
  const { t } = useTranslation();
  const server = useServerStatus();
  const user = useSession((state) => state.user);
  const wide = useMediaQuery(WIDE_SCREEN);
  /** Signed in with a password of their own: the pages behind the shell are reachable. */
  const ready = Boolean(user && !user.must_change_password);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-contrast focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t('skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--tt-primary),var(--tt-accent-violet))] text-sm font-bold text-primary-contrast shadow-md shadow-primary/30"
            >
              {env.appName.charAt(0)}
            </span>
            {/* Phones show just the logo; the name stays the link's accessible name. */}
            <span className="sr-only sm:not-sr-only">{env.appName}</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {ready && wide && <ShellNav />}
            {ready && <PaletteTrigger />}
            <LanguageSelect />
            <ThemeToggle />
            <AccountNav />
          </div>
        </div>
      </header>
      <ServerStatusBanner status={server.status} onRetry={server.retry} />
      <main
        id="main"
        tabIndex={-1}
        // Room at the bottom on phones, so the navigation bar never covers the last row.
        className="relative mx-auto max-w-6xl px-4 pt-8 pb-24 focus:outline-none sm:pb-8"
      >
        <Outlet />
      </main>
      {ready && !wide && <ShellNav bar />}
      {ready && <PaletteHost />}
    </div>
  );
}
