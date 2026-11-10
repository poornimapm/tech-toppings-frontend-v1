import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChevronDown,
  CircleCheckBig,
  Pencil,
  Replace,
  SkipForward,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { cx } from '@/core/utils/cx';
import { Badge, Button } from '@/design-system';
import { NS } from '@/modules/travel/i18n';
import type { Activity, ChangeAction } from '@/modules/travel/plan-api';
import { useWords } from '@/modules/travel/words';

/** What can happen to a planned activity, each with its icon, in the order offered. */
const CHANGES: { action: ChangeAction; icon: LucideIcon }[] = [
  { action: 'done', icon: CircleCheckBig },
  { action: 'skip', icon: SkipForward },
  { action: 'replace', icon: Replace },
  { action: 'reschedule', icon: CalendarClock },
];

/** The dot on the rail: what became of each, also said in words beside it. */
const DOTS: Record<Activity['status'], string> = {
  planned: 'bg-primary',
  done: 'bg-[var(--tt-accent-emerald)]',
  skipped: 'bg-[var(--tt-accent-slate)]',
  replaced: 'bg-[var(--tt-accent-slate)]',
};

export interface TimelineActions {
  onEdit: (activity: Activity) => void;
  onMove: (activity: Activity, by: -1 | 1) => void;
  onChange: (activity: Activity, action: ChangeAction) => void;
  /** Off the plan for good (one added by mistake), with a moment to take it back. */
  onRemove: (activity: Activity) => void;
}

/**
 * One day's activities as a vertical timeline, in the day's order: each says when, what and
 * whether its details are an estimate or confirmed, and opens to its details and what can be
 * done with it. A skipped or replaced one stays in place, struck through, beside what replaced
 * it: the plan and what really happened, side by side.
 */
export function Timeline({
  activities,
  label,
  currency,
  busy,
  ...actions
}: TimelineActions & {
  activities: Activity[];
  label: string;
  currency: string;
  /** A move is on its way: another waits for it. */
  busy: boolean;
}) {
  return (
    <ol aria-label={label} className="ml-2 space-y-3 border-l-2 border-border pl-5">
      {activities.map((activity, index) => (
        <Entry
          key={activity.id}
          activity={activity}
          first={index === 0}
          last={index === activities.length - 1}
          currency={currency}
          busy={busy}
          {...actions}
        />
      ))}
    </ol>
  );
}

function Entry({
  activity,
  first,
  last,
  currency,
  busy,
  onEdit,
  onMove,
  onChange,
  onRemove,
}: TimelineActions & {
  activity: Activity;
  first: boolean;
  last: boolean;
  currency: string;
  busy: boolean;
}) {
  const { t } = useTranslation(NS);
  const words = useWords();
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const off = activity.status === 'skipped' || activity.status === 'replaced';
  const facts = [words.kind(activity.kind), activity.location].filter(Boolean).join(' · ');

  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={cx(
          'absolute top-4 -left-[1.95rem] size-3.5 rounded-full border-2 border-surface',
          DOTS[activity.status],
        )}
      />
      <div className={cx('rounded-2xl border border-border bg-surface', off && 'opacity-80')}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => {
            setOpen(!open);
          }}
          className="flex min-h-11 w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-bg"
        >
          <span className="w-20 shrink-0 text-sm font-semibold tabular-nums">
            {activity.start_time ? words.time(activity.start_time) : t('itinerary.anyTime')}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cx('block font-semibold break-words', off && 'line-through')}>
              {activity.title}
            </span>
            <span className="block text-sm break-words text-muted">{facts}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cx('mt-0.5 size-5 shrink-0 text-muted', open && 'rotate-180')}
          />
        </button>
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {activity.confirmed ? (
            <Badge tone="success">{t('itinerary.confirmed')}</Badge>
          ) : (
            <Badge tone="soon">{t('itinerary.estimate')}</Badge>
          )}
          {activity.status !== 'planned' && (
            <Badge tone={activity.status === 'done' ? 'success' : 'locked'}>
              {t(`itinerary.status.${activity.status}`)}
            </Badge>
          )}
        </div>
        <div id={detailsId} hidden={!open} className="space-y-3 border-t border-border p-3">
          <Details activity={activity} currency={currency} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                onEdit(activity);
              }}
            >
              <Pencil aria-hidden="true" className="size-4" />
              {t('itinerary.edit')}
            </Button>
            {(
              [
                [-1, first, ArrowUp, 'up'],
                [1, last, ArrowDown, 'down'],
              ] as const
            ).map(([by, end, Icon, key]) => (
              <Button
                key={key}
                variant="secondary"
                className="min-h-11"
                // Kept focusable at the end of the day: the button just pressed keeps the focus.
                aria-disabled={end || busy || undefined}
                onClick={() => {
                  if (!end && !busy) onMove(activity, by);
                }}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(`itinerary.${key}`)}
              </Button>
            ))}
            {activity.status === 'planned' &&
              CHANGES.map(({ action, icon: Icon }) => (
                <Button
                  key={action}
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => {
                    onChange(activity, action);
                  }}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {t(`change.actions.${action}`)}
                </Button>
              ))}
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                onRemove(activity);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('itinerary.remove')}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

type Fact = 'duration' | 'location' | 'transport' | 'cost' | 'notes' | 'actual';

/** What there is to know of it, only what was given. */
function Details({ activity, currency }: { activity: Activity; currency: string }) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  const cost = activity.estimated_cost_minor;
  const rows: [Fact, string | null][] = [
    ['duration', activity.duration_minutes ? words.duration(activity.duration_minutes) : null],
    ['location', activity.location],
    ['transport', activity.transport],
    ['cost', cost === null ? null : formatMoney(cost, currency, i18n.language)],
    ['notes', activity.notes],
    ['actual', activity.actual_note],
  ];
  const given = rows.filter((row): row is [Fact, string] => Boolean(row[1]));
  if (given.length === 0) return <p className="text-sm text-muted">{t('itinerary.noDetails')}</p>;
  return (
    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(7rem,auto)_1fr]">
      {given.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted">{t(`itinerary.facts.${key}`)}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
