import { useTranslation } from 'react-i18next';

import { ApiError } from '@/core/api/api-error';
import { useReadiness, useServerStatus, type ServerStatus } from '@/core/api/server-status';
import { errorKey } from '@/core/i18n';
import { cx } from '@/core/utils/cx';

type Tone = 'good' | 'busy' | 'bad' | 'idle';

const DOT: Record<Tone, string> = {
  good: 'bg-success',
  busy: 'bg-warning',
  bad: 'bg-danger',
  idle: 'bg-muted',
};

const API_TONE: Record<ServerStatus, Tone> = {
  checking: 'idle',
  waking: 'busy',
  online: 'good',
  offline: 'bad',
};

function Dot({ tone }: { tone: Tone }) {
  return (
    <span aria-hidden="true" className="relative flex size-2">
      {tone === 'good' && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
      )}
      <span className={cx('relative inline-flex size-2 rounded-full', DOT[tone])} />
    </span>
  );
}

/** Compact API + database health, always visible but out of the way. */
export function SystemStatusPill() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const server = useServerStatus();
  const readiness = useReadiness(server.status === 'online');

  const databaseTone: Tone = readiness.isSuccess ? 'good' : readiness.isError ? 'bad' : 'idle';
  const databaseLabel = readiness.isSuccess
    ? t('status.ready')
    : readiness.isError
      ? t('status.notReady')
      : t('status.checking');
  const databaseError =
    readiness.error instanceof ApiError ? tError(errorKey(readiness.error.code)) : null;

  return (
    <section
      aria-label={t('status.title')}
      className="flex flex-col items-start gap-1 sm:items-end"
    >
      <dl className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-border bg-glass px-3.5 py-1.5 text-xs shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          <Dot tone={API_TONE[server.status]} />
          <dt className="text-muted">{t('status.api')}</dt>
          <dd className="font-medium">
            {t(`status.${server.status}`)}
            {server.health && (
              <span className="ml-1.5 font-normal text-muted">
                {t('status.version', { version: server.health.version })}
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Dot tone={databaseTone} />
          <dt className="text-muted">{t('status.database')}</dt>
          <dd className="font-medium">{databaseLabel}</dd>
        </div>
      </dl>
      {databaseError && <p className="px-2 text-xs text-muted">{databaseError}</p>}
    </section>
  );
}
