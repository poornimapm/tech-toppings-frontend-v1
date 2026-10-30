import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, LoadError, SearchField, SelectField, Skeleton } from '@/design-system';
import { useAudit } from '@/modules/labor/api';
import { AuditEntryRow } from '@/modules/labor/audit-entry';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import manifest from '@/modules/labor/manifest';

const ENTITIES = ['', 'project', 'worker', 'rates', 'attendance', 'payment'] as const;

/** Who changed what, when, from what to what: newest first, by project, record, person or
 *  days. Read only: nothing here changes or removes an entry. */
export function AuditPage() {
  const { t } = useTranslation(NS);
  const { projectId, project } = useLabor();
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]>('');
  const [onlyProject, setOnlyProject] = useState(true);
  const [words, setWords] = useState('');
  const actor = useDeferredValue(words.trim());
  const entries = useAudit({
    project_id: onlyProject && projectId ? projectId : undefined,
    entity: entity || undefined,
    actor: actor || undefined,
  });
  const currency = project?.currency ?? 'INR';

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label={t('audit.what')}
          value={entity}
          options={ENTITIES.map((item) => ({
            value: item,
            label: t(`audit.entities.${item || 'all'}`),
          }))}
          onChange={(event) => {
            setEntity(event.target.value as (typeof ENTITIES)[number]);
          }}
        />
        {projectId && (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyProject}
              onChange={() => {
                setOnlyProject((current) => !current);
              }}
            />
            {t('audit.onlyProject', { name: project?.name ?? '' })}
          </label>
        )}
      </div>
      <SearchField label={t('audit.who')} value={words} onChange={setWords} maxLength={80} />
      {entries.isPending ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : entries.isError && !entries.data ? (
        <LoadError onRetry={() => void entries.refetch()}>{t('audit.loadError')}</LoadError>
      ) : entries.data.length === 0 ? (
        <EmptyState icon={manifest.icon} title={t('audit.none')} />
      ) : (
        <ol aria-label={t('nav.audit')} className="space-y-2">
          {entries.data.map((entry) => (
            <AuditEntryRow key={entry.id} entry={entry} currency={currency} />
          ))}
        </ol>
      )}
      {entries.hasNextPage && (
        <Button variant="secondary" onClick={() => void entries.fetchNextPage()}>
          {t('more')}
        </Button>
      )}
    </section>
  );
}
