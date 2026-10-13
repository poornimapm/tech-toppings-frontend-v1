import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { useDashboard, type WidgetView } from '@/core/dashboard/queries';
import { cx } from '@/core/utils/cx';
import { displayDate, todayIn } from '@/core/utils/dates';
import { EmptyState, FilterChips, LoadError, Skeleton, Switch } from '@/design-system';
import { periodFor, PRESETS, toPreset } from '@/platform/dashboard/range';
import { WidgetCard } from '@/platform/dashboard/widget-card';
import { pages } from '@/platform/shell/pages';

/** Figures share a row equally, however many there are (two abreast on a phone). */
const TILES = 'grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4';
/** Charts (two columns wide) sit beside lists. The columns are explicit: an implicit one
 *  would grow to fit its widest card instead of the screen. */
const PANELS = 'grid grid-cols-1 gap-4 lg:grid-cols-3';

/** Figures for a period, from every module and platform area that contributes a widget. */
export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useSession((state) => state.user);
  const [params, setParams] = useSearchParams();
  const days = toPreset(params.get('range'));
  const allUsers = user?.role === 'admin' && params.get('view') === 'all';
  const period = periodFor(days, todayIn(user?.timezone));
  const dashboard = useDashboard({ ...period, allUsers });

  function update(name: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  const widgets = dashboard.data?.widgets ?? [];
  const ofKind = (kind: WidgetView['kind']) => widgets.filter((widget) => widget.kind === kind);
  const rows = [
    { layout: TILES, widgets: ofKind('kpi') },
    { layout: PANELS, widgets: [...ofKind('series'), ...ofKind('list')] },
  ].filter((row) => row.widgets.length > 0);
  const range = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <p className="mt-1 text-muted">
          {allUsers ? t('dashboard.allUsersHint') : t('dashboard.subtitle')}
          {' · '}
          {range.formatRange(displayDate(period.from), displayDate(period.to))}
        </p>
      </header>

      {/* One row of filters above everything they scope. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterChips
          label={t('dashboard.period')}
          value={String(days)}
          chips={PRESETS.map((preset) => ({
            value: String(preset),
            label: t('dashboard.lastDays', { count: preset }),
          }))}
          onChange={(value) => {
            update('range', value === String(PRESETS[0]) ? null : value);
          }}
        />
        {user?.role === 'admin' && (
          <Switch
            label={t('dashboard.allUsers')}
            checked={allUsers}
            onCheckedChange={(checked) => {
              update('view', checked ? 'all' : null);
            }}
          />
        )}
      </div>

      {dashboard.isPending ? (
        <div className={PANELS}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : dashboard.isError ? (
        <LoadError onRetry={() => void dashboard.refetch()}>{t('dashboard.loadError')}</LoadError>
      ) : widgets.length === 0 ? (
        <EmptyState icon={pages.dashboard.icon} title={t('dashboard.empty')} />
      ) : (
        // While another period loads, the previous figures stay, dimmed: no jump, no flash.
        <div
          aria-busy={dashboard.isPlaceholderData}
          className={cx(
            'space-y-4 transition-opacity',
            dashboard.isPlaceholderData && 'opacity-60',
          )}
        >
          {rows.map((row) => (
            <div key={row.layout} className={row.layout}>
              {row.widgets.map((widget) => (
                <WidgetCard key={widget.key} widget={widget} days={days} />
              ))}
            </div>
          ))}
        </div>
      )}

      {!allUsers && (
        <Link
          to={pages.activity.path}
          className="inline-block font-medium text-primary underline underline-offset-4"
        >
          {t('dashboard.seeActivity')}
        </Link>
      )}
    </div>
  );
}
