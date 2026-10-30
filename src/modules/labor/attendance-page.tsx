import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Clock3,
  CloudOff,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { addDays, displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { cx } from '@/core/utils/cx';
import { Alert, Badge, Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import {
  useDay,
  useMark,
  useTaps,
  type Day,
  type MarkStatus,
  type Worker,
} from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import { NoProject } from '@/modules/labor/labor-layout';
import manifest from '@/modules/labor/manifest';
import { draftOf, DRAFT_TOOL, type MarksDraft } from '@/modules/labor/marks-draft';
import { VoiceMarks } from '@/modules/labor/voice-marks';
import { WorkerPhoto } from '@/modules/labor/worker-photo';

/** Each mark: its icon and look, so it reads without colour and without reading. */
const MARKS: { status: MarkStatus; icon: LucideIcon; on: string }[] = [
  {
    status: 'full',
    icon: CircleCheck,
    on: 'border-[var(--tt-accent-emerald)] bg-[var(--tt-accent-emerald-soft)] text-[var(--tt-accent-emerald)]',
  },
  {
    status: 'half',
    icon: Clock3,
    on: 'border-[var(--tt-accent-amber)] bg-[var(--tt-accent-amber-soft)] text-[var(--tt-accent-amber)]',
  },
  {
    status: 'absent',
    icon: CircleSlash,
    on: 'border-[var(--tt-accent-slate)] bg-[var(--tt-accent-slate-soft)] text-[var(--tt-accent-slate)]',
  },
];

/**
 * Attendance for a day, today unless another is chosen: every active worker with their photo
 * and three big marks. A tap saves at once; tapping another mark changes it (one record a day
 * per worker, never two). The day's summary and what it costs stay in view.
 */
export function AttendancePage() {
  const { t, i18n } = useTranslation(NS);
  const { projectId, project } = useLabor();
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const [params, setParams] = useSearchParams();
  const day = params.get('day') ?? today;
  const sheet = useDay(projectId, day);
  const dateId = useId();
  const handed = useHandedDraft();

  if (!projectId) return <NoProject />;
  const currency = project?.currency ?? 'INR';
  const closed = project?.status === 'closed';
  const go = (next: string) => {
    setParams(
      (current) => {
        const out = new URLSearchParams(current);
        if (next === today) out.delete('day');
        else out.set('day', next);
        return out;
      },
      { replace: true },
    );
  };

  return (
    <section aria-labelledby={dateId} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className="min-h-11"
          aria-label={t('day.previous')}
          onClick={() => {
            go(addDays(day, -1));
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <label id={dateId} className="flex items-center gap-2 text-base font-semibold">
          {t('day.label')}
          <input
            type="date"
            value={day}
            max={today}
            onChange={(event) => {
              if (event.target.value) go(event.target.value);
            }}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 text-base"
          />
        </label>
        <Button
          variant="secondary"
          className="min-h-11"
          aria-label={t('day.next')}
          disabled={day >= today}
          onClick={() => {
            go(addDays(day, 1));
          }}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
        {day !== today && (
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              go(today);
            }}
          >
            {t('day.today')}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">
        {displayDate(day).toLocaleDateString(i18n.language, { dateStyle: 'full' })}
      </p>
      {closed && <Alert tone="info">{t('project.closedNote')}</Alert>}
      {!closed && (
        <VoiceMarks project={projectId} day={day} sheet={sheet.data} handed={handed} onDay={go} />
      )}
      {sheet.isPending && sheet.fetchStatus === 'paused' ? (
        // No network, and this day wasn't opened on this device while there was.
        <Alert tone="info">{t('day.offline')}</Alert>
      ) : sheet.isPending ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : sheet.isError && !sheet.data ? (
        <LoadError onRetry={() => void sheet.refetch()}>{t('day.loadError')}</LoadError>
      ) : sheet.data.workers.length === 0 ? (
        <EmptyState icon={manifest.icon} title={t('day.noWorkers')} />
      ) : (
        <Sheet
          sheet={sheet.data}
          project={projectId}
          day={day}
          currency={currency}
          disabled={closed}
        />
      )}
    </section>
  );
}

/** A day's marks the assistant read elsewhere and handed to this page (its client action), taken
 *  once: the history entry then forgets it, and the page shows the draft's project. */
function useHandedDraft(): MarksDraft | null {
  const location = useLocation();
  const navigate = useNavigate();
  const action = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  const [taken, setTaken] = useState<{ action: ClientAction; draft: MarksDraft | null } | null>(
    null,
  );
  if (action && action !== taken?.action) {
    setTaken({ action, draft: action.tool === DRAFT_TOOL ? draftOf(action.arguments) : null });
  }
  const project = taken?.draft?.project_id;
  const { pathname, search } = location;
  useEffect(() => {
    if (!action) return;
    const next = new URLSearchParams(search);
    if (project) next.set('project', project);
    void navigate({ pathname, search: `?${next.toString()}` }, { replace: true, state: null });
  }, [action, navigate, pathname, project, search]);
  return taken?.draft ?? null;
}

function Sheet({
  sheet,
  project,
  day,
  currency,
  disabled,
}: {
  sheet: Day;
  project: string;
  day: string;
  currency: string;
  disabled: boolean;
}) {
  const { t, i18n } = useTranslation(NS);
  const mark = useMark(project, day);
  // What a card shows: a tap still waiting on this device, else what is saved.
  const { waiting, shown, tap } = useTaps(project, day, sheet);
  const marks = new Map(sheet.marks.map((item) => [item.worker_id, item]));
  const unmarked = sheet.workers.filter((worker) => shown(worker.id) === null);
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-live="polite">
        {(['full', 'half', 'absent', 'unmarked'] as const).map((key) => (
          <div key={key} className="rounded-2xl border border-border bg-surface p-3">
            <dt className="text-xs text-muted">{t(`day.counts.${key}`)}</dt>
            <dd className="text-2xl font-bold tabular-nums">{sheet.counts[key] ?? 0}</dd>
          </div>
        ))}
        <div className="col-span-2 rounded-2xl border border-border bg-surface p-3 sm:col-span-1">
          <dt className="text-xs text-muted">{t('day.total')}</dt>
          <dd className="text-2xl font-bold tabular-nums">{money(sheet.total_minor)}</dd>
        </div>
      </dl>
      {waiting.size > 0 && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium">
          <CloudOff aria-hidden="true" className="size-4 shrink-0" />
          {t('day.waiting', { count: waiting.size })}
        </p>
      )}
      {unmarked.length > 0 && !disabled && (
        <Button
          className="min-h-12 w-full text-base"
          aria-disabled={mark.isPending || undefined}
          onClick={() => {
            if (mark.isPending) return;
            mark.mutate(unmarked.map((worker) => tap(worker, 'full')));
          }}
        >
          <CircleCheck aria-hidden="true" className="size-5" />
          {t('day.allPresent', { count: unmarked.length })}
        </Button>
      )}
      <ul role="list" aria-label={t('day.workers')} className="grid gap-3 sm:grid-cols-2">
        {sheet.workers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            project={project}
            status={shown(worker.id)}
            waiting={waiting.has(worker.id)}
            amount={
              marks.has(worker.id) && !waiting.has(worker.id)
                ? money(marks.get(worker.id)?.amount_minor ?? 0)
                : null
            }
            disabled={disabled || mark.isPending}
            onMark={(status) => {
              mark.mutate([tap(worker, status)]);
            }}
          />
        ))}
      </ul>
    </>
  );
}

function WorkerCard({
  worker,
  project,
  status,
  waiting,
  amount,
  disabled,
  onMark,
}: {
  worker: Worker;
  project: string;
  status: MarkStatus | null;
  /** The mark shown is on this device, not sent yet. */
  waiting: boolean;
  amount: string | null;
  disabled: boolean;
  onMark: (status: MarkStatus) => void;
}) {
  const { t } = useTranslation(NS);
  const groupId = useId();
  return (
    <li className="rounded-3xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <WorkerPhoto project={project} worker={worker} size="lg" />
        <div className="min-w-0 flex-1">
          <p id={groupId} className="truncate text-lg font-semibold">
            {worker.name}
          </p>
          <p className="text-sm text-muted">
            {worker.code}
            {amount !== null && ` · ${t('day.earned', { amount })}`}
          </p>
        </div>
        {waiting && (
          <Badge icon={<CloudOff aria-hidden="true" className="size-3" />}>
            {t('day.waitingBadge')}
          </Badge>
        )}
      </div>
      <div role="group" aria-labelledby={groupId} className="mt-3 grid grid-cols-3 gap-2">
        {MARKS.map(({ status: value, icon: Icon, on }) => {
          const chosen = status === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={chosen}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (!disabled && !chosen) onMark(value);
              }}
              className={cx(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-sm font-semibold',
                chosen ? on : 'border-border bg-bg text-text hover:bg-surface',
                disabled && 'opacity-60',
              )}
            >
              <Icon aria-hidden="true" className="size-6" />
              {t(`mark.${value}`)}
            </button>
          );
        })}
      </div>
    </li>
  );
}
