import { useTranslation } from 'react-i18next';

import { ApiError } from '@/core/api/api-error';
import { useReadiness, useServerStatus, type ServerStatus } from '@/core/api/server-status';
import { errorKey } from '@/core/i18n';
import { cx } from '@/core/utils/cx';
import { Card } from '@/design-system';

const API_TONE: Record<ServerStatus, string> = {
  checking: 'text-muted',
  waking: 'text-warning',
  online: 'text-success',
  offline: 'text-danger',
};

export function SystemStatusCard() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const server = useServerStatus();
  const readiness = useReadiness(server.status === 'online');

  const databaseLabel = readiness.isSuccess
    ? t('status.ready')
    : readiness.isError
      ? t('status.notReady')
      : t('status.checking');
  const databaseError =
    readiness.error instanceof ApiError ? tError(errorKey(readiness.error.code)) : null;

  return (
    <Card title={t('status.title')}>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">{t('status.api')}</dt>
          <dd className={cx('font-medium', API_TONE[server.status])}>
            {t(`status.${server.status}`)}
            {server.health && (
              <span className="ml-2 text-sm font-normal text-muted">
                {t('status.version', { version: server.health.version })}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{t('status.database')}</dt>
          <dd
            className={cx(
              'font-medium',
              readiness.isSuccess
                ? 'text-success'
                : readiness.isError
                  ? 'text-danger'
                  : 'text-muted',
            )}
          >
            {databaseLabel}
            {databaseError && (
              <span className="mt-1 block text-sm font-normal text-muted">{databaseError}</span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
