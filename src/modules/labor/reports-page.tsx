import { Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { addDays, displayDate, todayIn } from '@/core/utils/dates';
import { Button, FilterChips, LoadError, Skeleton, TextField, toast } from '@/design-system';
import { failureCode, useReport, useSaveReportFile, type ReportFilters } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import { NoProject } from '@/modules/labor/labor-layout';
import { ReportTables } from '@/modules/labor/report-tables';

const GROUPS = ['day', 'week', 'month'] as const;
const LAST_DAYS = 30;

/** Days, weeks or months between two days: who worked how much, what it earned, what was
 *  paid, and what each worker is owed to the end of the period. Kept in the address. */
export function ReportsPage() {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const { projectId, project } = useLabor();
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const [params, setParams] = useSearchParams();
  const filters: ReportFilters = {
    from: params.get('from') ?? addDays(today, 1 - LAST_DAYS),
    to: params.get('to') ?? today,
    group: (GROUPS as readonly string[]).includes(params.get('group') ?? '')
      ? (params.get('group') as ReportFilters['group'])
      : 'day',
  };
  const report = useReport(projectId, filters);
  const save = useSaveReportFile(projectId);

  if (!projectId) return <NoProject />;
  const date = (day: string) =>
    displayDate(day).toLocaleDateString(i18n.language, { dateStyle: 'medium' });
  const set = (name: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(name, value);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-5">
      {/* On paper, what the page is about: the controls above it don't print. */}
      <h2 className="hidden text-xl font-semibold print:block">
        {t('reports.printTitle', {
          project: project?.name ?? '',
          from: date(filters.from),
          to: date(filters.to),
        })}
      </h2>
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <TextField
          type="date"
          label={t('reports.from')}
          value={filters.from}
          max={filters.to}
          onChange={(event) => {
            if (event.target.value) set('from', event.target.value);
          }}
        />
        <TextField
          type="date"
          label={t('reports.to')}
          value={filters.to}
          max={today}
          onChange={(event) => {
            if (event.target.value) set('to', event.target.value);
          }}
        />
        <FilterChips
          label={t('reports.by')}
          chips={GROUPS.map((value) => ({ value, label: t(`reports.groups.${value}`) }))}
          value={filters.group}
          onChange={(value) => {
            set('group', value);
          }}
        />
      </div>
      {/* The browser's own "Save as PDF" makes the PDF (D5): Tamil and Hindi shaped right. */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            window.print();
          }}
        >
          <Printer aria-hidden="true" className="size-4" />
          {t('reports.print')}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          aria-disabled={save.isPending || undefined}
          onClick={() => {
            if (save.isPending) return;
            save.mutate(filters, {
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
        <Skeleton className="h-64 rounded-3xl" />
      ) : report.isError && !report.data ? (
        <LoadError onRetry={() => void report.refetch()}>{t('reports.loadError')}</LoadError>
      ) : (
        <ReportTables report={report.data} currency={project?.currency ?? 'INR'} />
      )}
    </div>
  );
}
