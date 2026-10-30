import { CalendarCheck, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { formatMoney } from '@/core/utils/money';
import { EmptyState, LoadError, Skeleton } from '@/design-system';
import { useOverview } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import manifest from '@/modules/labor/manifest';

/**
 * Today at a glance: the open projects, their workers, who is marked, what today costs and what
 * is owed, each with the day's most common task one tap away, and the latest changes.
 */
export function OverviewPage() {
  const { t, i18n } = useTranslation(NS);
  const currency = useSession((state) => state.user?.base_currency) ?? 'INR';
  const overview = useOverview();
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);

  if (overview.isPending) return <Skeleton className="h-64 rounded-3xl" />;
  if (overview.isError && !overview.data)
    return <LoadError onRetry={() => void overview.refetch()}>{t('overview.loadError')}</LoadError>;
  const data = overview.data;

  if (data.open_projects === 0) {
    return (
      <div className="space-y-4">
        <EmptyState icon={manifest.icon} title={t('overview.empty')} />
        <Link
          to="projects"
          className="mx-auto flex min-h-12 w-fit items-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-contrast"
        >
          <Plus aria-hidden="true" className="size-5" />
          {t('projects.add')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['overview.projects', String(data.open_projects)],
            ['overview.workers', String(data.workers)],
            ['overview.today', money(data.today_minor)],
            ['overview.owed', money(data.owed_minor)],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-border bg-surface p-3">
            <dt className="text-xs text-muted">{t(key)}</dt>
            <dd className="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <ul role="list" aria-label={t('overview.projectsList')} className="grid gap-3 sm:grid-cols-2">
        {data.projects.map((project) => {
          const marked =
            (project.counts.full ?? 0) + (project.counts.half ?? 0) + (project.counts.absent ?? 0);
          return (
            <li
              key={project.id}
              className="space-y-3 rounded-3xl border border-border bg-surface p-4"
            >
              <p className="flex items-center gap-2 text-lg font-semibold">
                <span aria-hidden="true" className="text-2xl">
                  {project.icon ?? '📋'}
                </span>
                {project.name}
              </p>
              <p className="text-sm text-muted">
                {t('overview.marked', { marked, count: project.workers })} ·{' '}
                {t('overview.todayCost', { amount: money(project.today_minor) })} ·{' '}
                {t('overview.owedHere', { amount: money(project.owed_minor) })}
              </p>
              <Link
                to={`attendance?project=${project.id}`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-medium text-primary-contrast"
              >
                <CalendarCheck aria-hidden="true" className="size-5" />
                {t('overview.recordToday')}
              </Link>
            </li>
          );
        })}
      </ul>
      {data.recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('overview.recent')}</h2>
          <ul
            role="list"
            className="divide-y divide-border rounded-2xl border border-border bg-surface"
          >
            {data.recent.map((entry) => (
              <li key={entry.id} className="p-3 text-sm">
                {t(`audit.actions.${entry.action}`, { defaultValue: entry.action })} ·{' '}
                {t(`audit.entities.${entry.entity}`, { defaultValue: entry.entity })}{' '}
                <span className="text-muted">
                  {t('audit.by', {
                    name: entry.actor_name,
                    when: new Date(entry.at).toLocaleString(i18n.language, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
