import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { discard, retry, useOutbox } from '@/core/offline/outbox';
import { Button } from '@/design-system';

/** What this account made offline: how much still waits, and what the server refused (to try
 *  again once its cause is fixed, or discard). */
export function OutboxBanner() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const owner = useSession((state) => state.user?.id);
  const items = useOutbox((state) => state.items);
  const mine = items.filter((item) => item.owner === owner);
  const waiting = mine.filter((item) => !item.failure).length;
  const refused = mine.filter((item) => item.failure);

  if (mine.length === 0) return null;
  return (
    <div
      role="status"
      className="space-y-1 border-b border-border bg-surface px-4 py-2 text-center text-sm print:hidden"
    >
      {waiting > 0 && <p className="text-muted">{t('outbox.waiting', { count: waiting })}</p>}
      {refused.map((item) => (
        <p key={item.id} className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-danger">
            {t('outbox.refused', {
              label: item.label,
              reason: tError(errorKey(item.failure ?? 'UNKNOWN')),
            })}
          </span>
          <Button
            variant="ghost"
            aria-label={t('outbox.retryOne', { label: item.label })}
            onClick={() => void retry(item.id)}
          >
            {t('outbox.retry')}
          </Button>
          <Button
            variant="ghost"
            aria-label={t('outbox.discardOne', { label: item.label })}
            onClick={() => void discard(item.id)}
          >
            {t('outbox.discard')}
          </Button>
        </p>
      ))}
    </div>
  );
}
