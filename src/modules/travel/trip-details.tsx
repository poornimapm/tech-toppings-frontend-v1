import { Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { formatMoney } from '@/core/utils/money';
import { Button, Card, Dialog, toast } from '@/design-system';
import { useDeleteTrip, useUndeleteTrip } from '@/modules/travel/api';
import { EditTripDialog } from '@/modules/travel/edit-trip-dialog';
import { Failure } from '@/modules/travel/failure';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';
import { useTravellerLine } from '@/modules/travel/traveller-line';
import { daysOf, lengthOf, placesOf } from '@/modules/travel/trip-words';
import { useOnce } from '@/modules/travel/use-once';

/** What is said of the trip, each under the name its check before saving gives it. */
type Fact =
  | 'dates'
  | 'destinations'
  | 'departure'
  | 'travellers'
  | 'type'
  | 'pace'
  | 'budget'
  | 'interests'
  | 'notes'
  | 'remind';

/**
 * What the trip is, as saved: where and when, from where, who is going with what they gave of
 * themselves, its kind, pace, budget, interests, notes and reminder. It can be changed, or
 * deleted with a moment to bring it back.
 */
export function TripDetails() {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const line = useTravellerLine();
  const [open, setOpen] = useState<'edit' | 'delete' | null>(null);
  const language = i18n.language;
  const none = t('new.review.none');
  const rows: [Fact, ReactNode][] = [
    ['dates', `${daysOf(trip, language)} · ${t('new.review.days', { count: lengthOf(trip) })}`],
    ['destinations', placesOf(trip.destinations)],
    ['departure', trip.departure_city ?? none],
    [
      'travellers',
      trip.travellers.length ? (
        <ul role="list" className="space-y-1">
          {trip.travellers.map((person) => (
            <li key={person.id}>{line(person)}</li>
          ))}
        </ul>
      ) : (
        t('new.review.nobody')
      ),
    ],
    ['type', t(`trip.types.${trip.trip_type}`)],
    ['pace', t(`trip.paces.${trip.pace}`)],
    [
      'budget',
      trip.budget_minor === null ? none : formatMoney(trip.budget_minor, trip.currency, language),
    ],
    ['interests', trip.interests.join(', ') || none],
    ['notes', trip.notes ?? none],
    ['remind', t(trip.remind_prepare ? 'new.review.remindOn' : 'new.review.remindOff')],
  ];
  const close = () => {
    setOpen(null);
  };

  return (
    <Card title={t('overview.details')}>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
        {rows.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-muted">{t(`new.review.${key}`)}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            setOpen('edit');
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
          {t('tripEdit.edit')}
        </Button>
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={() => {
            setOpen('delete');
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {t('tripEdit.delete')}
        </Button>
      </div>
      {open === 'edit' && <EditTripDialog key={trip.revision_no} onClose={close} />}
      {open === 'delete' && <DeleteTripDialog onClose={close} />}
    </Card>
  );
}

/** Asked once before it goes. Gone, the question closes at once (not left up, still offering to
 *  keep the trip, while My Trips loads), the page leaves for My Trips, and the toast's Undo
 *  brings it back (refused, with why, if the user has as many trips as one keeps by then). */
function DeleteTripDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { trip } = useTripContext();
  const navigate = useNavigate();
  const remove = useDeleteTrip();
  const restore = useUndeleteTrip();
  const { id, title } = trip;

  const confirm = useOnce(async () => {
    const gone = await remove.mutateAsync(id).then(
      () => true,
      () => false, // shown from remove.error
    );
    if (!gone) return false;
    toast(t('tripEdit.deleted', { title }), {
      action: {
        label: tCommon('actions.undo'),
        onAction: () => {
          // The page has left by now: what answers is said by toast alone.
          void restore.mutateAsync(id).then(
            () => toast(t('tripEdit.restored', { title }), { tone: 'success' }),
            (error: unknown) => toast(failureText(error), { tone: 'danger' }),
          );
        },
      },
    });
    onClose();
    void navigate('..', { relative: 'path' });
    return true;
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('tripEdit.deleteTitle', { title })}
      description={t('tripEdit.deleteBody')}
    >
      <div className="space-y-4">
        <Failure error={remove.error} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="min-h-11 flex-1" onClick={onClose}>
            {t('tripEdit.keep')}
          </Button>
          <Button
            className="min-h-11 flex-1"
            aria-disabled={remove.isPending || undefined}
            onClick={confirm}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {t('tripEdit.deleteConfirm')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
