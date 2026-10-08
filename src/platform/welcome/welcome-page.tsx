import { useTranslation } from 'react-i18next';

import { env } from '@/core/config/env';
import { SystemStatusCard } from '@/platform/welcome/system-status-card';

/** Landing page. Phase 3 turns this into the animated module-tile Welcome page. */
export function WelcomePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcome.title', { appName: env.appName })}
        </h1>
        <p className="mt-2 text-muted">{t('welcome.subtitle')}</p>
      </header>
      <SystemStatusCard />
    </div>
  );
}
