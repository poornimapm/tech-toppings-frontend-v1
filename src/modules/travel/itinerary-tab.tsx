import { CalendarPlus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { displayDate } from '@/core/utils/dates';
import { Button, EmptyState, toast } from '@/design-system';
import { ActivityForm } from '@/modules/travel/activity-form';
import { ChangeDialog } from '@/modules/travel/change-dialog';
import { DayStrip } from '@/modules/travel/day-strip';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';
import {
  useActivities,
  useRemoveActivity,
  useReorder,
  type Activity,
  type ChangeAction,
} from '@/modules/travel/plan-api';
import { useRemoval, useUndoToast } from '@/modules/travel/removal';
import { Timeline } from '@/modules/travel/timeline';
import { useTripContext } from '@/modules/travel/trip-context';
import { daysIn, tripToday } from '@/modules/travel/trip-words';
import { Waiting } from '@/modules/travel/waiting';

/**
 * The trip day by day: a strip of its days (the one in the address, else today if the trip is
 * on, else its first) and that day's timeline, to add to, edit, put in order, remove from and
 * change as things happen. A move or a removal is said with a way to take it back.
 */
export function ItineraryTab() {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const own = useSession((state) => state.user?.timezone);
  const activities = useActivities(trip.id);
  const reorder = useReorder(trip.id);
  const remove = useRemoveActivity();
  const removal = useRemoval(remove.mutateAsync);
  const moved = useUndoToast();
  const [params, setParams] = useSearchParams();
  // Open: the activity being edited (null for a new one), or the one being changed and how.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [changing, setChanging] = useState<{ id: string; action: ChangeAction } | null>(null);
  const headingId = useId();

  const days = daysIn(trip);
  const asked = params.get('day');
  const today = tripToday(trip, own);
  const day =
    asked && days.includes(asked) ? asked : days.includes(today) ? today : trip.start_date;
  const all = activities.data ?? [];
  const counts = new Map<string, number>();
  for (const each of all) counts.set(each.day, (counts.get(each.day) ?? 0) + 1);
  const planned = all.filter((each) => each.day === day);
  const find = (id: string | null) => all.find((each) => each.id === id) ?? null;
  const date = displayDate(day).toLocaleDateString(i18n.language, { dateStyle: 'full' });

  const move = (activity: Activity, by: -1 | 1) => {
    const order = planned.map((each) => each.id);
    const from = order.indexOf(activity.id);
    order.splice(from, 1);
    order.splice(from + by, 0, activity.id);
    // Said even once the page has moved on: every activity of the day answers the move's event.
    void reorder.mutateAsync({ day, activity_ids: order }).then(
      ([first]) => {
        const place = { title: activity.title, place: from + by + 1, total: order.length };
        moved({ event_id: first?.event_id ?? null }, t('itinerary.moved', place));
      },
      (error: unknown) => toast(failureText(error), { tone: 'danger' }),
    );
  };

  const editingActivity = editing && find(editing.id);
  const changingActivity = changing && find(changing.id);

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <DayStrip
        days={days}
        counts={counts}
        value={day}
        onChange={(next) => {
          setParams({ day: next }, { replace: true });
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={headingId} className="text-lg font-semibold">
          {date}
        </h3>
        <Button
          className="min-h-11"
          onClick={() => {
            setEditing({ id: null });
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('itinerary.add')}
        </Button>
      </div>
      {!activities.data ? (
        <Waiting query={activities} failed={t('itinerary.loadError')} />
      ) : planned.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={t('itinerary.empty')}
          body={t('itinerary.emptyBody')}
        />
      ) : (
        <Timeline
          activities={planned}
          label={t('itinerary.list', { day: date })}
          currency={trip.currency}
          busy={reorder.isPending}
          onEdit={(activity) => {
            setEditing({ id: activity.id });
          }}
          onMove={move}
          onChange={(activity, action) => {
            setChanging({ id: activity.id, action });
          }}
          onRemove={(activity) =>
            void removal(activity.id, t('itinerary.removed', { title: activity.title }))
          }
        />
      )}
      {editing && (editing.id === null || editingActivity) && (
        <ActivityForm
          key={`${editing.id ?? 'new'}-${String(editingActivity?.revision_no ?? 0)}`}
          activity={editingActivity}
          day={day}
          onClose={() => {
            setEditing(null);
          }}
          onReload={() => void activities.refetch()}
        />
      )}
      {changing && changingActivity && (
        <ChangeDialog
          key={`${changing.id}-${changing.action}`}
          activity={changingActivity}
          action={changing.action}
          onClose={() => {
            setChanging(null);
          }}
          onReload={() => void activities.refetch()}
        />
      )}
    </section>
  );
}
