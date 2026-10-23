import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SeriesData } from '@/core/dashboard/queries';
import { addDays, todayIn } from '@/core/utils/dates';
import { Card, LoadError, Meter, SelectField, Skeleton, Table } from '@/design-system';
import { useDbStats, useUsage, type DbStats } from '@/platform/admin/admin-api';
import { describeError } from '@/platform/auth/describe-error';
import { SeriesChart } from '@/platform/dashboard/series-chart';

const SPANS = [7, 30, 90] as const;
const NEAR_FULL_PCT = 80;

/** One figure with its name. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

/** Every day of the span, zero where nobody signed up (the API lists only days with some). */
function daily(start: string, end: string, counts: { date: string; count: number }[]): SeriesData {
  const byDay = new Map(counts.map((item) => [item.date, item.count]));
  const points = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    points.push({ day, value: byDay.get(day) ?? 0 });
  }
  return { kind: 'series', format: 'number', points };
}

/** Who signs up and comes back, how the assistant answers, which errors happen, how full the
 *  database is. Counts only: nobody's records. */
export function UsagePage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const [days, setDays] = useState<number>(30);
  const end = todayIn('UTC'); // the API counts UTC days
  const start = addDays(end, -(days - 1));
  const usage = useUsage(start, end);
  const db = useDbStats();
  const number = new Intl.NumberFormat(i18n.language);
  const megabytes = (value: number) => t('admin.usage.mb', { value: number.format(value) });
  const usedText = (stats: DbStats) =>
    t('admin.usage.used', {
      used: megabytes(stats.storage_mb + stats.index_mb),
      quota: megabytes(stats.quota_mb),
      pct: number.format(stats.used_pct),
    });

  return (
    <div className="space-y-6">
      <div className="max-w-48">
        <SelectField
          label={t('admin.usage.span')}
          value={String(days)}
          options={SPANS.map((count) => ({
            value: String(count),
            label: t('admin.usage.days', { count }),
          }))}
          onChange={(event) => {
            setDays(Number(event.target.value));
          }}
        />
      </div>

      {usage.isPending && <Skeleton className="h-40" />}
      {usage.isError && (
        <LoadError onRetry={() => void usage.refetch()}>
          {describeError(usage.error, t, tError)}
        </LoadError>
      )}
      {usage.data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Figure
              label={t('admin.usage.totalUsers')}
              value={number.format(usage.data.total_users)}
            />
            <Figure
              label={t('admin.usage.activeUsers')}
              value={number.format(usage.data.active_users)}
            />
            <Figure label={t('admin.usage.aiRuns')} value={number.format(usage.data.ai.runs)} />
            <Figure
              label={t('admin.usage.fallbackRate')}
              value={
                usage.data.ai.fallback_rate_pct === null
                  ? '—'
                  : t('admin.usage.percent', {
                      value: number.format(usage.data.ai.fallback_rate_pct),
                    })
              }
            />
          </div>
          <Card title={t('admin.usage.signups')}>
            <SeriesChart
              data={daily(usage.data.start, usage.data.end, usage.data.signups)}
              title={t('admin.usage.signups')}
            />
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={t('admin.usage.assistant')}>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted">{t('admin.usage.byAi')}</dt>
                <dd>{number.format(usage.data.ai.by_ai)}</dd>
                <dt className="text-muted">{t('admin.usage.byRules')}</dt>
                <dd>{number.format(usage.data.ai.by_rules)}</dd>
                <dt className="text-muted">{t('admin.usage.fellBack')}</dt>
                <dd>{number.format(usage.data.ai.fell_back)}</dd>
                {Object.entries(usage.data.ai.calls_by_provider).map(([provider, calls]) => (
                  <div key={provider} className="contents">
                    <dt className="text-muted">{t('admin.usage.providerCalls', { provider })}</dt>
                    <dd>{number.format(calls)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title={t('admin.usage.errors')}>
              <Table
                caption={t('admin.usage.errors')}
                rows={usage.data.errors}
                rowKey={(row) => row.code}
                empty={t('admin.usage.noErrors')}
                columns={[
                  {
                    key: 'code',
                    header: t('admin.usage.code'),
                    cell: (row) => <code>{row.code}</code>,
                  },
                  {
                    key: 'count',
                    header: t('admin.usage.count'),
                    cell: (row) => number.format(row.count),
                  },
                ]}
              />
            </Card>
          </div>
        </>
      )}

      <Card title={t('admin.usage.database')}>
        {db.isPending && <Skeleton className="h-24" />}
        {db.isError && (
          <LoadError onRetry={() => void db.refetch()}>
            {describeError(db.error, t, tError)}
          </LoadError>
        )}
        {db.data && (
          <div className="space-y-4">
            <p className="text-sm">{usedText(db.data)}</p>
            <Meter
              value={db.data.used_pct}
              max={100}
              tone={db.data.used_pct >= NEAR_FULL_PCT ? 'over' : 'default'}
              label={t('admin.usage.storage')}
              valueText={usedText(db.data)}
            />
            <Table
              caption={t('admin.usage.collections')}
              rows={db.data.collections}
              rowKey={(row) => row.name}
              columns={[
                {
                  key: 'name',
                  header: t('admin.usage.collection'),
                  cell: (row) => <code>{row.name}</code>,
                },
                {
                  key: 'count',
                  header: t('admin.usage.records'),
                  cell: (row) => number.format(row.count),
                },
                {
                  key: 'storage',
                  header: t('admin.usage.storage'),
                  cell: (row) => megabytes(row.storage_mb),
                },
                {
                  key: 'index',
                  header: t('admin.usage.indexes'),
                  cell: (row) => megabytes(row.index_mb),
                },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
