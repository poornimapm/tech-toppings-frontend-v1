import { Link2 } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, SelectField, toast } from '@/design-system';
import type { Booking } from '@/modules/travel/booking-api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useEditActivity, type Activity } from '@/modules/travel/plan-api';
import { weekdayOf } from '@/modules/travel/trip-words';

/**
 * Link a booking to one of the trip's activities that goes with no booking yet: the activity
 * then says it goes with this one (an activity goes with one booking, a booking with any number
 * of activities). Sent as of the activity's revision seen.
 */
export function LinkDialog({
  booking,
  activities,
  onClose,
  onReload,
}: {
  booking: Booking;
  /** The trip's activities, every day's. */
  activities: Activity[];
  onClose: () => void;
  onReload: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const edit = useEditActivity();
  const sending = useRef(false);
  const free = activities.filter((each) => each.booking_id === null);
  const form = useForm({ defaultValues: { activity: free[0]?.id ?? '' } });

  const send = async ({ activity: id }: { activity: string }) => {
    const activity = free.find((each) => each.id === id);
    if (!activity || sending.current) return;
    sending.current = true;
    const saved = await edit
      .mutateAsync({
        id: activity.id,
        body: { booking_id: booking.id, revision_no: activity.revision_no },
      })
      .catch(() => null);
    if (!saved) {
      sending.current = false; // shown from edit.error, and can be tried again
      return;
    }
    toast(t('bookings.linked', { activity: saved.title, booking: booking.title }), {
      tone: 'success',
    });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('bookings.linkTitle', { title: booking.title })}
    >
      {free.length === 0 ? (
        <p className="text-sm">{t('bookings.linkNone')}</p>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => void form.handleSubmit(send)(event)}
        >
          <Failure
            error={edit.error}
            onReload={() => {
              edit.reset();
              onReload();
            }}
          />
          <SelectField
            label={t('bookings.linkActivity')}
            options={free.map((each) => ({
              value: each.id,
              label: `${each.title} · ${weekdayOf(each.day, i18n.language)}`,
            }))}
            {...form.register('activity')}
          />
          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={edit.isPending || edit.isSuccess}
          >
            <Link2 aria-hidden="true" className="size-4" />
            {t('bookings.linkSave')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
