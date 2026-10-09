import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

import { useServerStatus } from '@/core/api/server-status';
import { env } from '@/core/config/env';
import { AccountNav } from '@/platform/shell/account-nav';
import { LanguageSelect } from '@/platform/shell/language-select';
import { ServerStatusBanner } from '@/platform/shell/server-status-banner';
import { ThemeToggle } from '@/platform/shell/theme-toggle';

export function AppLayout() {
  const { t } = useTranslation();
  const server = useServerStatus();

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-contrast focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t('skipToContent')}
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            {env.appName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
            <AccountNav />
          </div>
        </div>
      </header>
      <ServerStatusBanner status={server.status} onRetry={server.retry} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
