import { ArrowRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Meter } from '@/design-system';
import { useOverview, type NextAction, type Overview, type Trip } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import { dayOf } from '@/modules/travel/trip-words';
import { Waiting } from '@/modules/travel/waiting';

/** The reasons a next action gives (backend overview.py), each worded here by its key. */
const REASONS = [
  'trip_over',
  'no_activities',
  'open_today',
  'open_tomorrow',
  'bookings_unconfirmed',
  'packing_open',
  'no_packing',
  'checklist_open',
  'no_tasks',
  'nothing_open',
] as const;
type Reason = (typeof REASONS)[number];
const isReason = (value: string): value is Reason => REASONS.some((reason) => reason === value);

/** A figure the server sent with a reason, if it is one. */
const figure = (value: unknown) => (typeof value === 'number' ? value : 0);

/**
 * How a trip stands, on its own calendar: how long until it starts (or which day of it this is),
 * how ready it is from its real tasks only, and the next thing to do, with why. With no tasks
 * there is no figure at all, never a made-up one.
 */
export function TripGlance({ trip }: { trip: Trip }) {
  const { t } = useTranslation(NS);
  const overview = useOverview(trip.id);
  if (!overview.data) {
    return <Waiting query={overview} failed={t('glance.loadError')} className="h-20 rounded-2xl" />;
  }
  const data = overview.data;
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Clock aria-hidden="true" className="size-4 text-muted" />
        <Countdown overview={data} />
      </p>
      <Readiness readiness={data.readiness} />
      <NextStep next={data.next_action} />
    </div>
  );
}

export function Countdown({ overview }: { overview: Overview }) {
  const { t } = useTranslation(NS);
  if (overview.phase === 'past') return t('glance.ended');
  if (overview.phase === 'active') {
    return t('glance.dayOf', { day: overview.day_number ?? 1, total: overview.trip_days });
  }
  return overview.days_to_start === 1
    ? t('glance.startsTomorrow')
    : t('glance.startsIn', { count: overview.days_to_start });
}

export function Readiness({ readiness }: { readiness: Overview['readiness'] }) {
  const { t } = useTranslation(NS);
  if (!readiness) return <p className="text-sm text-muted">{t('glance.noTasks')}</p>;
  const percent = Math.round(readiness.ratio * 100);
  const done = t('glance.done', {
    completed: readiness.completed,
    applicable: readiness.applicable,
  });
  return (
    <div className="space-y-1">
      <p className="flex flex-wrap justify-between gap-x-3 text-sm">
        <span className="font-medium">{t('glance.ready', { percent })}</span>
        <span className="text-muted">{done}</span>
      </p>
      <Meter
        value={readiness.completed}
        max={readiness.applicable}
        label={t('glance.readiness')}
        valueText={`${t('glance.ready', { percent })}: ${done}`}
      />
    </div>
  );
}

export function NextStep({ next }: { next: NextAction }) {
  const { t, i18n } = useTranslation(NS);
  const { params } = next;
  const end = typeof params.end_date === 'string' ? dayOf(params.end_date, i18n.language) : '';
  const why = isReason(next.reason)
    ? t(`glance.reasons.${next.reason}`, { count: figure(params.open ?? params.count), end })
    : '';
  return (
    <p className="flex items-start gap-1.5 text-sm">
      <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>
        <span className="font-semibold">
          {t('glance.next', { action: t(`glance.actions.${next.action}`) })}
        </span>{' '}
        {why}
      </span>
    </p>
  );
}
