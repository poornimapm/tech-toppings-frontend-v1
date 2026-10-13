import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, LoadError, Skeleton } from '@/design-system';

export interface FeedPageProps<T> {
  title: string;
  subtitle: string;
  /** Page-level actions, beside the title. */
  action?: ReactNode;
  query: UseInfiniteQueryResult<T[]>;
  /** Shown when there is nothing in the feed. */
  empty: { icon: LucideIcon; title: string; body: string };
  errorText: string;
  /** Renders one entry as a keyed `FeedRow`. */
  children: (item: T) => ReactNode;
}

/** A page that is one feed: heading, then the entries with loading, error and empty states,
 *  and "show more" while the server has older ones. */
export function FeedPage<T>({
  title,
  subtitle,
  action,
  query,
  empty,
  errorText,
  children,
}: FeedPageProps<T>) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        {action}
      </header>
      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-11" />
          ))}
        </div>
      ) : query.isError ? (
        <LoadError onRetry={() => void query.refetch()}>{errorText}</LoadError>
      ) : query.data.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        <>
          <ul
            role="list"
            className="divide-y divide-border rounded-3xl border border-border bg-glass px-5 py-1 shadow-sm backdrop-blur-xl"
          >
            {query.data.map(children)}
          </ul>
          {query.hasNextPage && (
            <Button
              variant="secondary"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t('actions.showMore')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
