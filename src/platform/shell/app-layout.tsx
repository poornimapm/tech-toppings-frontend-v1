import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

import { useServerStatus } from '@/core/api/server-status';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';
import { useOnline } from '@/core/pwa/use-online';
import { useMediaQuery } from '@/core/utils/use-media-query';
import { TourHost } from '@/platform/onboarding/tour-host';
import { PaletteHost } from '@/platform/palette/palette-host';
import { PaletteTrigger } from '@/platform/palette/palette-trigger';
import { AccountNav } from '@/platform/shell/account-nav';
import { InstallButton } from '@/platform/shell/install-button';
import { LanguageSelect } from '@/platform/shell/language-select';
import { OutboxBanner } from '@/platform/shell/outbox-banner';
import { OutboxSync } from '@/platform/shell/outbox-sync';
import { PushSync } from '@/platform/shell/push-sync';
import { ServerStatusBanner } from '@/platform/shell/server-status-banner';
import { ShellNav, WIDE_SCREEN } from '@/platform/shell/shell-nav';
import { ThemeToggle } from '@/platform/shell/theme-toggle';
import { UiModeToggle } from '@/platform/shell/ui-mode-toggle';
import { UpdateBanner } from '@/platform/shell/update-banner';

export function AppLayout() {
  const { t } = useTranslation();
  const server = useServerStatus();
  const online = useOnline();
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
      <header className="sticky top-0 z-30 border-b border-border/70 bg-glass backdrop-blur-xl print:hidden">
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
            {/* Phones and tablets show just the logo, leaving the room to the controls; the
                name stays the link's accessible name. */}
            <span className="sr-only xl:not-sr-only">{env.appName}</span>
          </Link>
          {/* Longer words (Tamil) wrap the controls onto a second row, never off screen. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:gap-2">
            {ready && wide && <ShellNav />}
            {ready && <PaletteTrigger />}
            <InstallButton />
            <LanguageSelect />
            {ready && <UiModeToggle />}
            <ThemeToggle />
            <AccountNav />
          </div>
        </div>
      </header>
      <ServerStatusBanner status={server.status} deviceOffline={!online} onRetry={server.retry} />
      <UpdateBanner />
      {ready && <OutboxBanner />}
      {ready && <OutboxSync />}
      {ready && <PushSync />}
      <main
        id="main"
        tabIndex={-1}
        // Room at the bottom on phones, so the navigation bar never covers the last row.
        className="relative mx-auto max-w-6xl px-4 pt-8 pb-24 focus:outline-none sm:pb-8 print:max-w-none print:p-0"
      >
        <Outlet />
      </main>
      {ready && !wide && (
        <div className="print:hidden">
          <ShellNav bar />
        </div>
      )}
      {ready && <PaletteHost />}
      {ready && <TourHost />}
    </div>
  );
}
