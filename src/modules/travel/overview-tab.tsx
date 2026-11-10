import { ArrowRight, CalendarPlus, ClipboardCheck, Clock, Luggage, Sunrise } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card } from '@/design-system';
import { useOverview, type NextAction, type Overview } from '@/modules/travel/api';
import { SIDE_LINK } from '@/modules/travel/choice';
import { NS } from '@/modules/travel/i18n';
import { ModeSettings } from '@/modules/travel/mode-settings';
import { useTripContext } from '@/modules/travel/trip-context';
import { TripDetails } from '@/modules/travel/trip-details';
import { Countdown, NextStep, Readiness } from '@/modules/travel/trip-glance';
import { weekdayOf } from '@/modules/travel/trip-words';
import { Waiting } from '@/modules/travel/waiting';
import { useWords } from '@/modules/travel/words';

/** Where each next action is done, among the sections built: none for the rest. */
const DONE_IN: Partial<Record<NextAction['action'], string>> = {
  add_activities: 'itinerary',
  prepare_today: 'prepare',
  prepare_tomorrow: 'prepare?when=tomorrow',
  confirm_bookings: 'bookings',
  finish_packing: 'packing',
  start_packing: 'packing',
  finish_checklist: 'prepare',
  add_tasks: 'prepare',
};

/** Where the next action is done. What is left of the checklist opens on the first day still
 *  holding some of it (the server's `day`), or on Prepare as it is when only the whole trip's is. */
function doneIn({ action, params }: NextAction): string | undefined {
  const to = DONE_IN[action];
  const day = action === 'finish_checklist' ? params.day : null;
  return to && typeof day === 'string' ? `${to}?when=${day}` : to;
}

/** The ways in from here: plan a day, get ready today or for tomorrow, pack. */
const QUICK = [
  { to: 'itinerary', key: 'plan', icon: CalendarPlus },
  { to: 'prepare', key: 'today', icon: ClipboardCheck },
  { to: 'prepare?when=tomorrow', key: 'tomorrow', icon: Sunrise },
  { to: 'packing', key: 'pack', icon: Luggage },
] as const;

/**
 * A trip at a glance: the countdown, how ready it is from its real tasks (or that it has none
 * yet), the next thing to do with why, what is coming up and still open, quick ways in, what the
 * trip is (to change or delete it), and its mode.
 */
export function OverviewTab() {
  const { t } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const overview = useOverview(trip.id);

  return (
    <div className="space-y-4">
      {overview.data ? (
        <Glance overview={overview.data} />
      ) : (
        <Waiting query={overview} failed={t('glance.loadError')} />
      )}
      <Card title={t('overview.quick')}>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(({ to, key, icon: Icon }) => (
            <Link key={key} to={to} className={SIDE_LINK}>
              <Icon aria-hidden="true" className="size-5" />
              {t(`overview.go.${key}`)}
            </Link>
          ))}
        </div>
      </Card>
      <TripDetails />
      <Card title={t('overview.settings')}>
        <ModeSettings key={trip.revision_no} trip={trip} options={options} />
      </Card>
    </div>
  );
}

function Glance({ overview }: { overview: Overview }) {
  const { t } = useTranslation(NS);
  const where = doneIn(overview.next_action);
  const { pending } = overview;
  return (
    <>
      <Card title={t('overview.glance')}>
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 font-semibold">
            <Clock aria-hidden="true" className="size-4 text-muted" />
            <Countdown overview={overview} />
          </p>
          <Readiness readiness={overview.readiness} />
          <NextStep next={overview.next_action} />
          {where && (
            <Link to={where} className={SIDE_LINK}>
              {t('overview.next')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={t('overview.upcoming')}>
          <Upcoming overview={overview} />
        </Card>
        <Card title={t('overview.pending')}>
          {/* One row each: a name in some languages is one word longer than a third of a phone. */}
          <dl className="space-y-2">
            {(['checklist', 'packing', 'bookings'] as const).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
              >
                <dt className="min-w-0 text-sm break-words text-muted">
                  {t(`overview.open.${key}`)}
                </dt>
                <dd className="text-2xl font-bold tabular-nums">{pending[key]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}

/** What is still planned from today on, soonest first, each leading to its day. */
function Upcoming({ overview }: { overview: Overview }) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  if (overview.next_activities.length === 0) {
    return <p className="text-sm text-muted">{t('overview.nothingAhead')}</p>;
  }
  return (
    <ul role="list" className="space-y-2">
      {overview.next_activities.map((activity) => (
        <li key={activity.id}>
          <Link
            to={`itinerary?day=${activity.day}`}
            className="block rounded-xl border border-border p-2 hover:bg-bg"
          >
            <span className="block font-medium break-words">{activity.title}</span>
            <span className="block text-sm text-muted">
              {[
                weekdayOf(activity.day, i18n.language),
                activity.start_time && words.time(activity.start_time),
                words.kind(activity.kind),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
