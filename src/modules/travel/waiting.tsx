import type { FetchStatus } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Alert, LoadError, Skeleton } from '@/design-system';
import { NS } from '@/modules/travel/i18n';

interface Loading {
  data?: unknown;
  isPending: boolean;
  isError: boolean;
  fetchStatus: FetchStatus;
  refetch: () => Promise<unknown>;
}

/**
 * What a section shows while its data isn't there: no network (and nothing kept from an earlier
 * visit), loading, or a first load that failed, with a way to try again. Data once loaded stays
 * on screen through a refetch that fails, so this is only for the first.
 */
export function Waiting({
  query,
  failed,
  className = 'h-40 rounded-3xl',
}: {
  query: Loading;
  /** Says what couldn't be loaded. */
  failed: string;
  /** The placeholder's size, as the section it stands for. */
  className?: string;
}) {
  const { t } = useTranslation(NS);
  if (query.isPending && query.fetchStatus === 'paused') {
    return <Alert tone="info">{t('offline')}</Alert>;
  }
  if (query.isError) return <LoadError onRetry={() => void query.refetch()}>{failed}</LoadError>;
  return <Skeleton className={className} />;
}
