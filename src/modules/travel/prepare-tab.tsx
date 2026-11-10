import { Lightbulb, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { displayDate } from '@/core/utils/dates';
import { Alert, Badge, Button, FilterChips, SelectField } from '@/design-system';
import { isChecked } from '@/modules/travel/booking-api';
import { Checklist } from '@/modules/travel/checklist';
import {
  useChecklist,
  usePrepare,
  type ChecklistItem,
  type DayPlan,
  type When,
} from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';
import { ItemForm } from '@/modules/travel/item-form';
import { Part } from '@/modules/travel/part';
import { SuggestDialog } from '@/modules/travel/suggest-dialog';
import { useTripContext } from '@/modules/travel/trip-context';
import { daysIn, weekdayOf } from '@/modules/travel/trip-words';
import { Waiting } from '@/modules/travel/waiting';
import { useWords } from '@/modules/travel/words';

const WHEN = ['today', 'tomorrow'] as const;
/** A link drawn as text, to where something is looked at in full. */
const MORE = 'mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4';

/**
 * Get Me Ready (today) and Prepare Tomorrow, on the trip's own calendar, or any day of the trip
 * (one ahead, before it starts; those still holding something to do are marked so in the picker):
 * that day's plan, its bookings and how it gets around, what is to do that day, and what is to
 * do for the whole trip (what matters before it starts). An item
 * saved for another day opens that day, so it is never out of sight. Only what the person keeps
 * is shown: no weather, as there is no source for it yet.
 */
export function PrepareTab() {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const [params, setParams] = useSearchParams();
  const days = daysIn(trip);
  const asked = params.get('when') ?? '';
  const when: When = asked === 'tomorrow' || days.includes(asked) ? asked : 'today';
  const open = (next: When) => {
    setParams(next === 'today' ? {} : { when: next }, { replace: true });
  };
  const plan = usePrepare(trip.id, when);
  const checklist = useChecklist(trip.id);
  // Open: the item being edited (id null for a new one, on `day`), or the suggestions.
  const [editing, setEditing] = useState<{ id: string | null; day: string | null } | null>(null);
  const [suggesting, setSuggesting] = useState<string | null>(null);

  const all = [...(plan.data?.checklist ?? []), ...(checklist.data ?? [])];
  const editingItem = editing?.id ? (all.find((item) => item.id === editing.id) ?? null) : null;
  const whole = (checklist.data ?? []).filter((item) => item.day === null && item.bag === null);
  // The days still holding something to do, said in the picker so none is looked for blind.
  const stillOpen = new Set(plan.data?.open_days);
  const edit = (item: ChecklistItem) => {
    setEditing({ id: item.id, day: item.day });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterChips<When>
          label={t('prepare.which')}
          chips={WHEN.map((value) => ({ value, label: t(`prepare.${value}`) }))}
          value={when}
          onChange={open}
        />
        <SelectField
          label={t('prepare.pick')}
          placeholder={t('prepare.pickNone')}
          options={days.map((day, index) => ({
            value: day,
            label: t(stillOpen.has(day) ? 'prepare.pickOpen' : 'prepare.pickDay', {
              number: index + 1,
              date: weekdayOf(day, i18n.language),
            }),
          }))}
          value={days.includes(when) ? when : ''}
          onChange={(event) => {
            open(event.target.value || 'today');
          }}
        />
      </div>
      {plan.data ? (
        <DayView
          plan={plan.data}
          onEdit={edit}
          onAdd={(day) => {
            setEditing({ id: null, day });
          }}
          onSuggest={setSuggesting}
        />
      ) : (
        <Waiting query={plan} failed={t('prepare.loadError')} />
      )}
      <Part
        title={t('prepare.wholeTrip')}
        action={
          <AddButton
            onClick={() => {
              setEditing({ id: null, day: null });
            }}
          />
        }
      >
        {!checklist.data ? (
          <Waiting query={checklist} failed={t('prepare.listError')} className="h-20 rounded-2xl" />
        ) : whole.length === 0 ? (
          <p className="text-sm text-muted">{t('prepare.noWholeTrip')}</p>
        ) : (
          <Checklist items={whole} label={t('prepare.wholeTrip')} onEdit={edit} />
        )}
      </Part>
      {editing && (editing.id === null || editingItem) && (
        <ItemForm
          key={`${editing.id ?? 'new'}-${String(editingItem?.revision_no ?? 0)}`}
          item={editingItem}
          packing={false}
          day={editing.day}
          onClose={() => {
            setEditing(null);
          }}
          onReload={() => {
            void plan.refetch();
            void checklist.refetch();
          }}
          onSaved={(saved) => {
            if (saved.day && saved.day !== plan.data?.day) open(saved.day);
          }}
        />
      )}
      {suggesting && (
        <SuggestDialog
          asked={{ day: suggesting, packing: false }}
          onClose={() => {
            setSuggesting(null);
          }}
        />
      )}
    </div>
  );
}

/** One day: its plan, bookings, transport and what is to do on it. */
function DayView({
  plan,
  onEdit,
  onAdd,
  onSuggest,
}: {
  plan: DayPlan;
  onEdit: (item: ChecklistItem) => void;
  onAdd: (day: string) => void;
  onSuggest: (day: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  const date = displayDate(plan.day).toLocaleDateString(i18n.language, { dateStyle: 'full' });

  return (
    <>
      <h3 className="text-lg font-semibold">{date}</h3>
      {!plan.within_trip && <Alert tone="info">{t('prepare.outside')}</Alert>}
      <Part title={t('prepare.plan')}>
        {plan.activities.length === 0 ? (
          <p className="text-sm text-muted">{t('prepare.noPlan')}</p>
        ) : (
          <ul role="list" className="space-y-2">
            {plan.activities.map((activity) => (
              <li key={activity.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="w-20 shrink-0 font-semibold tabular-nums">
                  {activity.start_time ? words.time(activity.start_time) : t('itinerary.anyTime')}
                </span>
                <span className="min-w-0 flex-1 break-words">
                  {activity.title} <span className="text-muted">· {words.kind(activity.kind)}</span>
                </span>
                {activity.status !== 'planned' && (
                  <Badge tone={activity.status === 'done' ? 'success' : 'locked'}>
                    {t(`itinerary.status.${activity.status}`)}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
        {plan.within_trip && (
          <Link to={`../itinerary?day=${plan.day}`} relative="path" className={MORE}>
            {t('prepare.openDay')}
          </Link>
        )}
      </Part>
      {plan.bookings.length > 0 && (
        <Part title={t('prepare.bookings')}>
          <ul role="list" className="space-y-2">
            {plan.bookings.map((booking) => (
              <li key={booking.id} className="text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium break-words">
                  {booking.title}
                  <Badge tone={isChecked(booking) ? 'success' : 'soon'}>
                    {t(`bookings.status.${booking.status}`)}
                  </Badge>
                </p>
                <p className="text-muted">
                  {[
                    t(`bookings.kinds.${booking.kind}`),
                    booking.starts_at && words.moment(booking.starts_at),
                    booking.reference && t('bookings.reference', { reference: booking.reference }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
          <Link to="../bookings" relative="path" className={MORE}>
            {t('prepare.allBookings')}
          </Link>
        </Part>
      )}
      {plan.transport.length > 0 && (
        <Part title={t('prepare.transport')}>
          <ul role="list" className="space-y-2">
            {plan.transport.map((way) => (
              <li key={way.activity_id} className="text-sm break-words">
                <span className="font-medium">{way.title}</span>{' '}
                <span className="text-muted">
                  {[way.start_time && words.time(way.start_time), way.transport, way.location]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </Part>
      )}
      <Part
        title={t('prepare.checklist')}
        action={
          plan.within_trip && (
            <>
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={() => {
                  onSuggest(plan.day);
                }}
              >
                <Lightbulb aria-hidden="true" className="size-4" />
                {t('prepare.suggest')}
              </Button>
              <AddButton
                onClick={() => {
                  onAdd(plan.day);
                }}
              />
            </>
          )
        }
      >
        {plan.checklist.length === 0 ? (
          <p className="text-sm text-muted">{t('prepare.noChecklist')}</p>
        ) : (
          <Checklist
            items={plan.checklist}
            label={t('prepare.checklist')}
            showBag
            onEdit={onEdit}
          />
        )}
      </Part>
    </>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation(NS);
  return (
    <Button variant="secondary" className="min-h-11" onClick={onClick}>
      <Plus aria-hidden="true" className="size-4" />
      {t('checklist.add')}
    </Button>
  );
}
