import { Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState } from '@/design-system';
import { useBookings } from '@/modules/travel/booking-api';
import { BookingCard } from '@/modules/travel/booking-card';
import { BookingForm } from '@/modules/travel/booking-form';
import { NS } from '@/modules/travel/i18n';
import { LinkDialog } from '@/modules/travel/link-dialog';
import { useActivities } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { Waiting } from '@/modules/travel/waiting';

/**
 * The trip's bookings as the person entered them, soonest first, each saying how sure it is
 * (as entered, or confirmed by them) and which activities go with it. Added and edited by hand:
 * the app never makes one up or says it checked one.
 */
export function BookingsTab() {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  const bookings = useBookings(trip.id);
  const activities = useActivities(trip.id);
  // Open: the booking being edited (id null for a new one), or the one being linked.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const find = (id: string | null) => bookings.data?.find((each) => each.id === id) ?? null;
  const editingBooking = find(editing?.id ?? null);
  const linkingBooking = find(linking);
  // Not loaded (yet, or it failed) isn't "none": each card says which, and links nothing.
  const all = activities.data;
  const unknown = (
    <Waiting
      query={activities}
      failed={t('bookings.activitiesError')}
      className="h-11 rounded-xl"
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm text-muted">{t('bookings.intro')}</p>
        <Button
          className="min-h-11"
          onClick={() => {
            setEditing({ id: null });
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('bookings.add')}
        </Button>
      </div>
      {!bookings.data ? (
        <Waiting query={bookings} failed={t('bookings.loadError')} />
      ) : bookings.data.length === 0 ? (
        <EmptyState icon={Ticket} title={t('bookings.empty')} body={t('bookings.emptyBody')} />
      ) : (
        <ul role="list" aria-label={t('tabs.bookings')} className="space-y-3">
          {bookings.data.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              linked={all?.filter((each) => each.booking_id === booking.id) ?? null}
              unknown={unknown}
              onEdit={() => {
                setEditing({ id: booking.id });
              }}
              onLink={() => {
                setLinking(booking.id);
              }}
            />
          ))}
        </ul>
      )}
      {editing && (editing.id === null || editingBooking) && (
        <BookingForm
          key={`${editing.id ?? 'new'}-${String(editingBooking?.revision_no ?? 0)}`}
          booking={editingBooking}
          onClose={() => {
            setEditing(null);
          }}
          onReload={() => void bookings.refetch()}
        />
      )}
      {linkingBooking && all && (
        <LinkDialog
          booking={linkingBooking}
          activities={all}
          onClose={() => {
            setLinking(null);
          }}
          onReload={() => void activities.refetch()}
        />
      )}
    </div>
  );
}
