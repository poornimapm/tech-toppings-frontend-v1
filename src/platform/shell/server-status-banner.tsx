import { useTranslation } from 'react-i18next';

import type { ServerStatus } from '@/core/api/server-status';
import { Button } from '@/design-system';

interface Props {
  status: ServerStatus;
  onRetry: () => void;
}

/** Explains cold starts ("waking") and outages; announced politely to screen readers. */
export function ServerStatusBanner({ status, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite">
      {status === 'waking' && (
        <p className="border-b border-border bg-surface px-4 py-2 text-center text-sm text-warning">
          {t('banner.waking')}
        </p>
      )}
      {status === 'offline' && (
        <div className="flex items-center justify-center gap-3 border-b border-border bg-surface px-4 py-2 text-sm">
          <p className="text-danger">{t('banner.offline')}</p>
          <Button variant="secondary" onClick={onRetry}>
            {t('banner.retry')}
          </Button>
        </div>
      )}
    </div>
  );
}
