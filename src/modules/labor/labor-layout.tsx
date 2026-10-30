import {
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  FolderKanban,
  History,
  IndianRupee,
  LayoutDashboard,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { cx } from '@/core/utils/cx';
import { EmptyState, Skeleton } from '@/design-system';
import { useProject, useProjects } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import type { LaborContext } from '@/modules/labor/labor-context';
import manifest from '@/modules/labor/manifest';

/** The module's sections, in tab order; the project ones carry the chosen project along. */
const SECTIONS: { to: string; key: string; icon: LucideIcon; perProject: boolean }[] = [
  { to: '', key: 'overview', icon: LayoutDashboard, perProject: false },
  { to: 'projects', key: 'projects', icon: FolderKanban, perProject: false },
  { to: 'attendance', key: 'attendance', icon: CalendarCheck, perProject: true },
  { to: 'workers', key: 'workers', icon: Users, perProject: true },
  { to: 'wages', key: 'wages', icon: IndianRupee, perProject: true },
  { to: 'payments', key: 'payments', icon: Wallet, perProject: true },
  { to: 'reports', key: 'reports', icon: FileBarChart, perProject: true },
  { to: 'audit', key: 'audit', icon: History, perProject: false },
];

const REMEMBERED = 'tt-labor-project';

function remembered(): string | null {
  try {
    return localStorage.getItem(REMEMBERED);
  } catch {
    return null;
  }
}

function remember(id: string) {
  try {
    localStorage.setItem(REMEMBERED, id);
  } catch {
    // a private window: the project is chosen again next time
  }
}

/**
 * Labor Management's frame: its name, the project every section works on (chosen once, kept in
 * the address and remembered on this device), and the sections as tabs with icons and words.
 */
export function LaborLayout() {
  const { t } = useTranslation(NS);
  const isAdmin = useSession((state) => state.user?.role === 'admin');
  const [params, setParams] = useSearchParams();
  const projects = useProjects({ state: 'open' });
  const chosen = params.get('project') ?? remembered();
  const known = projects.data?.find((item) => item.id === chosen);
  const projectId = known?.id ?? projects.data?.[0]?.id ?? null;
  const project = useProject(projectId);
  const pickerId = useId();

  useEffect(() => {
    if (projectId) remember(projectId);
  }, [projectId]);

  const withProject = (to: string, perProject: boolean) =>
    perProject && projectId ? `${to}?project=${projectId}` : to;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* A printed page is the section itself: no picker, no tabs. */}
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        {projects.data && projects.data.length > 0 && (
          <label htmlFor={pickerId} className="flex items-center gap-2 text-sm font-medium">
            <ClipboardList aria-hidden="true" className="size-5 text-muted" />
            {t('project.pick')}
            <select
              id={pickerId}
              value={projectId ?? ''}
              onChange={(event) => {
                remember(event.target.value);
                setParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set('project', event.target.value);
                    return next;
                  },
                  { replace: true },
                );
              }}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 text-base"
            >
              {projects.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon ? `${item.icon} ` : ''}
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>
      <nav aria-label={t('title')} className="-mx-1 flex gap-1 overflow-x-auto pb-1 print:hidden">
        {SECTIONS.map(({ to, key, icon: Icon, perProject }) => (
          <NavLink
            key={key}
            to={withProject(to, perProject)}
            end={to === ''}
            className={({ isActive }) =>
              cx(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text hover:bg-bg',
              )
            }
          >
            <Icon aria-hidden="true" className="size-4" />
            {t(`nav.${key}`, { defaultValue: key })}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="all"
            className={({ isActive }) =>
              cx(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface',
              )
            }
          >
            {t('nav.all')}
          </NavLink>
        )}
      </nav>
      {projects.isPending ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <Outlet context={{ projectId, project: project.data } satisfies LaborContext} />
      )}
    </div>
  );
}

/** For a section that needs a project while there is none yet. */
export function NoProject() {
  const { t } = useTranslation(NS);
  return <EmptyState icon={manifest.icon} title={t('project.none')} />;
}
