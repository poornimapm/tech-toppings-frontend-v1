import { HistoryIcon, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import {
  Badge,
  Button,
  EmptyState,
  FilterChips,
  LoadError,
  SearchField,
  Skeleton,
  toast,
} from '@/design-system';
import { useOptions, useSetActive, useWorkers, type Worker } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import { NoProject } from '@/modules/labor/labor-layout';
import manifest from '@/modules/labor/manifest';
import { rowButton, rowName } from '@/modules/labor/row-label';
import { WorkerForm } from '@/modules/labor/worker-form';
import { WorkerHistory } from '@/modules/labor/worker-history';
import { WorkerPhoto } from '@/modules/labor/worker-photo';

const SHOWN = ['active', 'inactive', 'all'] as const;
type Shown = (typeof SHOWN)[number];

/** The project's workers, with their photos: registered here, changed, and made inactive (never
 *  removed: their days and payments stay). */
export function WorkersPage() {
  const { t, i18n } = useTranslation(NS);
  const { projectId, project } = useLabor();
  const options = useOptions();
  const [shown, setShown] = useState<Shown>('active');
  const [words, setWords] = useState('');
  const q = useDeferredValue(words.trim());
  const workers = useWorkers(projectId, {
    active: shown === 'all' ? undefined : shown === 'active',
    q: q || undefined,
  });
  const setActive = useSetActive();
  const [editing, setEditing] = useState<Worker | 'new' | null>(null);
  const [viewing, setViewing] = useState<Worker | null>(null);

  if (!projectId) return <NoProject />;
  const closed = project?.status === 'closed';

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {t('workers.title', { project: project?.name ?? '' })}
        </h2>
        {!closed && (
          <Button
            className="min-h-11"
            disabled={!options.data || !project}
            onClick={() => {
              setEditing('new');
            }}
          >
            <Plus aria-hidden="true" className="size-5" />
            {t('workers.add')}
          </Button>
        )}
      </div>
      <SearchField label={t('workers.search')} value={words} onChange={setWords} maxLength={80} />
      <FilterChips<Shown>
        label={t('workers.show')}
        chips={SHOWN.map((value) => ({ value, label: t(`workers.${value}`) }))}
        value={shown}
        onChange={setShown}
      />
      {workers.isPending ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : workers.isError && !workers.data ? (
        <LoadError onRetry={() => void workers.refetch()}>{t('workers.loadError')}</LoadError>
      ) : workers.data.length === 0 ? (
        <EmptyState icon={manifest.icon} title={t(q ? 'workers.noneFound' : 'workers.none')} />
      ) : (
        <ul role="list" aria-label={t('nav.workers')} className="space-y-2">
          {workers.data.map((worker) => (
            <li
              key={worker.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <WorkerPhoto project={projectId} worker={worker} />
              <div className="min-w-0 flex-1">
                <p id={rowName(worker.id)} className="truncate font-semibold">
                  {worker.name}
                </p>
                <p className="text-sm text-muted">
                  {worker.code} ·{' '}
                  {t('workers.perDay', {
                    amount: formatMoney(
                      worker.daily_wage_minor,
                      project?.currency ?? 'INR',
                      i18n.language,
                    ),
                  })}
                </p>
              </div>
              {!worker.active && <Badge>{t('workers.inactiveBadge')}</Badge>}
              <Button
                variant="ghost"
                className="min-h-11"
                aria-label={t('workers.history', { name: worker.name })}
                onClick={() => {
                  setViewing(worker);
                }}
              >
                <HistoryIcon aria-hidden="true" className="size-4" />
              </Button>
              {!closed && (
                <>
                  <Button
                    variant="ghost"
                    className="min-h-11"
                    aria-label={t('workers.edit', { name: worker.name })}
                    onClick={() => {
                      setEditing(worker);
                    }}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-11"
                    {...rowButton(`labor-active-${worker.id}`, rowName(worker.id))}
                    aria-disabled={setActive.isPending || undefined}
                    onClick={() => {
                      if (setActive.isPending) return;
                      setActive.mutate(
                        { id: worker.id, active: !worker.active },
                        {
                          onSuccess: () => {
                            toast(
                              t(worker.active ? 'workers.madeInactive' : 'workers.madeActive', {
                                name: worker.name,
                              }),
                              {
                                tone: 'success',
                              },
                            );
                          },
                        },
                      );
                    }}
                  >
                    {worker.active ? (
                      <UserX aria-hidden="true" className="size-4" />
                    ) : (
                      <UserCheck aria-hidden="true" className="size-4" />
                    )}
                    {t(worker.active ? 'workers.deactivate' : 'workers.activate')}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {workers.hasNextPage && (
        <Button variant="secondary" onClick={() => void workers.fetchNextPage()}>
          {t('more')}
        </Button>
      )}
      {editing && project && options.data && (
        <WorkerForm
          project={project}
          worker={editing === 'new' ? null : editing}
          options={options.data}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      {viewing && project && (
        <WorkerHistory
          project={project}
          worker={viewing}
          onClose={() => {
            setViewing(null);
          }}
        />
      )}
    </section>
  );
}
