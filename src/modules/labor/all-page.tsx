import { useQuery } from '@tanstack/react-query';
import { Download, X } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { addDays, displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import {
  Badge,
  Button,
  FilterChips,
  LoadError,
  SearchField,
  SelectField,
  Skeleton,
  Table,
  toast,
} from '@/design-system';
import {
  everyPage,
  failureCode,
  laborKeys,
  useSaveReportFile,
  WHOLE_PAGE,
} from '@/modules/labor/api';
import { AuditEntryRow } from '@/modules/labor/audit-entry';
import { NS } from '@/modules/labor/i18n';
import { ReportTables } from '@/modules/labor/report-tables';

type AdminProject = components['schemas']['LaborAdminProjectOut'];

const STATES = ['', 'open', 'closed'] as const;
type State = (typeof STATES)[number];
/** How far back a project's report goes when the admin opens it. */
const LAST_DAYS = 30;
const adminKey = [...laborKeys.all, 'admin'] as const;
/** The id of the button that opens a project's details (focus returns to it). */
const openerId = (project: string) => `labor-admin-open-${project}`;

/**
 * The platform admin's view across every owner (read only): the owners given Labor with their
 * projects and workers, every project (found by name, open or closed), one project's workers
 * and report when opened, and every owner's audit trail with each change from and to. The API
 * refuses anyone but an admin; this page is only for them too.
 */
export function AllPage() {
  const isAdmin = useSession((state) => state.user?.role === 'admin');
  return isAdmin ? <AdminView /> : <Navigate to=".." relative="path" replace />;
}

function AdminView() {
  const { t, i18n } = useTranslation(NS);
  const [owner, setOwner] = useState('');
  const [state, setState] = useState<State>('');
  const [words, setWords] = useState('');
  const q = useDeferredValue(words.trim());
  const [opened, setOpened] = useState<AdminProject | null>(null);
  const owners = useQuery({
    queryKey: [...adminKey, 'owners'],
    queryFn: () => unwrap(api.GET('/v1/admin/labor/owners')),
  });
  const projects = usePages([...adminKey, 'projects', owner, state, q], (page) =>
    unwrap(
      api.GET('/v1/admin/labor/projects', {
        params: {
          query: { page, owner: owner || undefined, state: state || undefined, q: q || undefined },
        },
      }),
    ),
  );
  const audit = usePages([...adminKey, 'audit', owner], (page) =>
    unwrap(
      api.GET('/v1/admin/labor/audit', { params: { query: { page, owner: owner || undefined } } }),
    ),
  );
  const currencies = new Map(projects.data?.map((project) => [project.id, project.currency]));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('all.owners')}</h2>
        {owners.isPending ? (
          <Skeleton className="h-32 rounded-3xl" />
        ) : owners.isError ? (
          <LoadError onRetry={() => void owners.refetch()}>{t('all.loadError')}</LoadError>
        ) : (
          <Table
            caption={t('all.owners')}
            rows={owners.data}
            rowKey={(row) => row.id}
            columns={[
              { key: 'name', header: t('all.owner'), cell: (row) => `${row.name} (${row.email})` },
              {
                key: 'open',
                header: t('all.openProjects'),
                cell: (row) => row.open_projects,
                className: 'text-right tabular-nums',
              },
              {
                key: 'projects',
                header: t('all.projects'),
                cell: (row) => row.projects,
                className: 'text-right tabular-nums',
              },
              {
                key: 'workers',
                header: t('all.workers'),
                cell: (row) => row.workers,
                className: 'text-right tabular-nums',
              },
              {
                key: 'active',
                header: t('all.state'),
                cell: (row) => t(row.active ? 'all.active' : 'all.inactive'),
              },
            ]}
            empty={t('all.noOwners')}
          />
        )}
      </section>
      <SelectField
        label={t('all.showOwner')}
        value={owner}
        options={[
          { value: '', label: t('all.everyone') },
          ...(owners.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        ]}
        onChange={(event) => {
          setOwner(event.target.value);
          setOpened(null);
        }}
      />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('all.projectsTitle')}</h2>
        <SearchField label={t('all.search')} value={words} onChange={setWords} maxLength={80} />
        <FilterChips<State>
          label={t('projects.show')}
          chips={STATES.map((value) => ({
            value,
            label: value ? t(`projects.${value}`) : t('workers.all'),
          }))}
          value={state}
          onChange={setState}
        />
        {projects.isPending ? (
          <Skeleton className="h-32 rounded-3xl" />
        ) : projects.isError && !projects.data ? (
          <LoadError onRetry={() => void projects.refetch()}>{t('all.loadError')}</LoadError>
        ) : (
          <Table
            caption={t('all.projectsTitle')}
            rows={projects.data}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'name',
                header: t('projects.name'),
                // Opens the project's workers and report below, read only.
                cell: (row) => (
                  <button
                    id={openerId(row.id)}
                    type="button"
                    aria-expanded={opened?.id === row.id}
                    className="min-h-11 text-start font-semibold text-primary underline underline-offset-4"
                    onClick={() => {
                      setOpened(opened?.id === row.id ? null : row);
                    }}
                  >
                    {row.name}
                  </button>
                ),
              },
              { key: 'owner', header: t('all.owner'), cell: (row) => row.owner_name },
              {
                key: 'since',
                header: t('projects.started'),
                cell: (row) =>
                  displayDate(row.started_on).toLocaleDateString(i18n.language, {
                    dateStyle: 'medium',
                  }),
              },
              { key: 'status', header: t('all.state'), cell: (row) => t(`projects.${row.status}`) },
            ]}
            empty={t('projects.none')}
          />
        )}
        {projects.hasNextPage && (
          <Button variant="secondary" onClick={() => void projects.fetchNextPage()}>
            {t('more')}
          </Button>
        )}
      </section>
      {opened && (
        <ProjectDetails
          key={opened.id}
          project={opened}
          onClose={() => {
            const opener = openerId(opened.id);
            setOpened(null);
            // Back where the admin was: the project's name that opened it.
            requestAnimationFrame(() => document.getElementById(opener)?.focus());
          }}
        />
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('nav.audit')}</h2>
        {audit.isPending ? (
          <Skeleton className="h-32 rounded-3xl" />
        ) : audit.isError && !audit.data ? (
          <LoadError onRetry={() => void audit.refetch()}>{t('audit.loadError')}</LoadError>
        ) : (
          <ol aria-label={t('nav.audit')} className="space-y-2">
            {audit.data.map((entry) => (
              <AuditEntryRow
                key={entry.id}
                entry={entry}
                currency={currencies.get(entry.project_id ?? '') ?? 'INR'}
              />
            ))}
          </ol>
        )}
        {audit.hasNextPage && (
          <Button variant="secondary" onClick={() => void audit.fetchNextPage()}>
            {t('more')}
          </Button>
        )}
      </section>
    </div>
  );
}

/** One project as the admin sees it: its workers (whether an ID picture is kept, never the
 *  picture) and its report for the last days. */
function ProjectDetails({ project, onClose }: { project: AdminProject; onClose: () => void }) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const from = addDays(today, 1 - LAST_DAYS);
  const period = { from, to: today, group: 'week' } as const;
  const save = useSaveReportFile(project.id, { admin: true });
  const heading = useRef<HTMLHeadingElement>(null);
  const path = { project_id: project.id };
  const workers = useQuery({
    queryKey: [...adminKey, 'workers', project.id],
    queryFn: () =>
      everyPage((page) =>
        unwrap(
          api.GET('/v1/admin/labor/projects/{project_id}/workers', {
            params: { path, query: { page, page_size: WHOLE_PAGE } },
          }),
        ),
      ),
  });
  const report = useQuery({
    queryKey: [...adminKey, 'report', project.id, from, today],
    queryFn: () =>
      unwrap(
        api.GET('/v1/admin/labor/projects/{project_id}/report', {
          params: { path, query: period },
        }),
      ),
  });
  // Opened from the table: the reader is taken to it.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby={`labor-admin-${project.id}`}
      className="space-y-4 rounded-3xl border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={`labor-admin-${project.id}`}
            ref={heading}
            tabIndex={-1}
            className="text-xl font-semibold focus:outline-none"
          >
            {t('all.projectTitle', { name: project.name, owner: project.owner_name })}
          </h2>
          <p className="text-sm text-muted">{t('all.readOnly')}</p>
        </div>
        <Button
          variant="ghost"
          className="min-h-11"
          aria-label={t('all.closeProject')}
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <h3 className="font-semibold">{t('workers.title', { project: project.name })}</h3>
      {workers.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : workers.isError ? (
        <LoadError onRetry={() => void workers.refetch()}>{t('workers.loadError')}</LoadError>
      ) : (
        <Table
          caption={t('workers.title', { project: project.name })}
          rows={workers.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: t('reports.worker'),
              cell: (row) => `${row.name} (${row.code})`,
            },
            {
              key: 'wage',
              header: t('all.wage'),
              cell: (row) =>
                t('workers.perDay', {
                  amount: formatMoney(row.daily_wage_minor, project.currency, i18n.language),
                }),
            },
            {
              key: 'state',
              header: t('all.state'),
              cell: (row) =>
                row.active ? t('workers.active') : <Badge>{t('workers.inactiveBadge')}</Badge>,
            },
            {
              key: 'id',
              header: t('all.idCard'),
              cell: (row) => t(row.has_id_card ? 'audit.yes' : 'audit.no'),
            },
          ]}
          empty={t('workers.none')}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{t('history.period', { count: LAST_DAYS })}</h3>
        <Button
          variant="secondary"
          className="min-h-11"
          aria-disabled={save.isPending || undefined}
          onClick={() => {
            if (save.isPending) return;
            save.mutate(period, {
              onSuccess: (name) => {
                toast(t('reports.downloaded', { name }), { tone: 'success' });
              },
              onError: (error) => {
                toast(tError(errorKey(failureCode(error) ?? 'UNKNOWN')), { tone: 'danger' });
              },
            });
          }}
        >
          <Download aria-hidden="true" className="size-4" />
          {t('reports.csv')}
        </Button>
      </div>
      {report.isPending ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : report.isError ? (
        <LoadError onRetry={() => void report.refetch()}>{t('reports.loadError')}</LoadError>
      ) : (
        <ReportTables report={report.data} currency={project.currency} />
      )}
    </section>
  );
}
