import { ExternalLink, Link2, Pencil, Trash2, Unlink } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge, Button, toast } from '@/design-system';
import { isChecked, useRemoveBooking, type Booking } from '@/modules/travel/booking-api';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';
import { useEditActivity, type Activity } from '@/modules/travel/plan-api';
import { useRemoval } from '@/modules/travel/removal';
import { weekdayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

/**
 * One booking as entered: what and when, where, its reference, notes and page, how sure it is,
 * and the activities that go with it (each leading to its day, and unlinked here). It can be
 * edited, linked to an activity, or removed (while no activity goes with it) with a moment to
 * take it back.
 */
export function BookingCard({
  booking,
  linked,
  unknown,
  onEdit,
  onLink,
}: {
  booking: Booking;
  /** The activities that go with it; null while they can't be told (loading, or failed). */
  linked: Activity[] | null;
  /** What shows instead while they can't be told. */
  unknown: ReactNode;
  onEdit: () => void;
  onLink: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  const remove = useRemoveBooking();
  const removal = useRemoval(remove.mutateAsync);
  const unlink = useEditActivity();
  const { title, starts_at: starts, ends_at: ends } = booking;
  // "Nov 20 9:30 AM – Nov 22 11:00 AM", or the end alone: "until …".
  const span = [starts, ends].filter((at): at is string => Boolean(at)).map(words.moment);
  const when = starts ? span.join(' – ') : ends && t('bookings.until', { at: span[0] });
  const facts = [
    t(`bookings.kinds.${booking.kind}`),
    when,
    booking.location,
    booking.reference && t('bookings.reference', { reference: booking.reference }),
  ];

  const onUnlink = (activity: Activity) => {
    unlink.mutate(
      { id: activity.id, body: { booking_id: null, revision_no: activity.revision_no } },
      {
        onSuccess: () =>
          toast(t('bookings.unlinked', { activity: activity.title, booking: title }), {
            tone: 'success',
          }),
        onError: (error) => toast(failureText(error), { tone: 'danger' }),
      },
    );
  };

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold break-words">
            {title}
            <Badge tone={isChecked(booking) ? 'success' : 'soon'}>
              {t(`bookings.status.${booking.status}`)}
            </Badge>
          </p>
          <p className="text-sm break-words text-muted">{facts.filter(Boolean).join(' · ')}</p>
          {booking.notes && <p className="text-sm break-words">{booking.notes}</p>}
          {booking.link && (
            <a
              href={booking.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`${t('bookings.openLink')} ${t('bookings.newTab')}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              {t('bookings.openLink')}
            </a>
          )}
        </div>
        <Button
          variant="ghost"
          className="min-h-11 min-w-11"
          aria-label={t('bookings.edit', { title })}
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 min-w-11"
          aria-label={t('bookings.remove', { title })}
          onClick={() => void removal(booking.id, t('bookings.removed', { title }))}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-sm font-medium">{t('bookings.goesWith')}</p>
        {linked === null ? (
          unknown
        ) : linked.length === 0 ? (
          <p className="text-sm text-muted">{t('bookings.noActivity')}</p>
        ) : (
          <ul role="list" className="space-y-1">
            {linked.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  to={`../itinerary?day=${activity.day}`}
                  relative="path"
                  className="min-w-0 break-words text-primary underline underline-offset-4"
                >
                  {activity.title} · {weekdayOf(activity.day, i18n.language)}
                </Link>
                <Button
                  variant="ghost"
                  className="min-h-11 min-w-11"
                  aria-label={t('bookings.unlink', { title: activity.title })}
                  aria-disabled={unlink.isPending || undefined}
                  onClick={() => {
                    if (!unlink.isPending) onUnlink(activity);
                  }}
                >
                  <Unlink aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {linked && (
          <Button variant="secondary" className="min-h-11" onClick={onLink}>
            <Link2 aria-hidden="true" className="size-4" />
            {t('bookings.linkTo')}
          </Button>
        )}
      </div>
    </li>
  );
}
