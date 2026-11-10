import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { Button, Dialog, SelectField, Switch, TextField, toast } from '@/design-system';
import {
  isChecked,
  useAddBooking,
  useEditBooking,
  type Booking,
  type BookingInput,
  type BookingKind,
} from '@/modules/travel/booking-api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';

const KINDS: BookingKind[] = ['flight', 'hotel', 'tour', 'transfer', 'insurance', 'visa', 'other'];
const LINK = /^https?:\/\/\S+$/;

/** Everything in the form is as typed; `fieldsOf` turns it into what the API takes. */
interface BookingValues {
  kind: BookingKind;
  title: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  location: string;
  link: string;
  notes: string;
  confirmed: boolean;
}

const given = (text: string) => text.trim() || null;
/** A moment as the API takes it, "YYYY-MM-DDTHH:MM", local where it happens. */
const momentOf = (text: string) => text.slice(0, 16) || null;

function fieldsOf(values: BookingValues): Omit<BookingInput, 'status'> {
  return {
    kind: values.kind,
    title: values.title.trim(),
    reference: given(values.reference),
    starts_at: momentOf(values.starts_at),
    ends_at: momentOf(values.ends_at),
    location: given(values.location),
    link: given(values.link),
    notes: given(values.notes),
  };
}

/**
 * Add a booking, or edit one, in a dialog: only what the person has, as they have it. Nothing
 * is looked up or filled in, and "confirmed" is theirs to say. A new one goes with one key for
 * the form's life; an edit, as of the revision opened.
 */
export function BookingForm({
  booking,
  onClose,
  onReload,
}: {
  /** The booking being edited, or null for a new one. */
  booking: Booking | null;
  onClose: () => void;
  onReload: () => void;
}) {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  const add = useAddBooking(trip.id);
  const edit = useEditBooking();
  const save = booking ? edit : add;
  const [key] = useState(() => crypto.randomUUID());
  const sending = useRef(false);
  const checked = booking ? isChecked(booking) : false;
  const form = useForm<BookingValues>({
    defaultValues: {
      kind: booking?.kind ?? 'flight',
      title: booking?.title ?? '',
      reference: booking?.reference ?? '',
      starts_at: booking?.starts_at ?? '',
      ends_at: booking?.ends_at ?? '',
      location: booking?.location ?? '',
      link: booking?.link ?? '',
      notes: booking?.notes ?? '',
      confirmed: checked,
    },
  });
  const { errors, isDirty } = form.formState;

  const send = async (values: BookingValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const status = values.confirmed ? 'confirmed' : 'entered';
    const saved = await (
      booking
        ? edit.mutateAsync({
            id: booking.id,
            body: {
              ...fieldsOf(values),
              // Said only once changed: what the app found (read, verified) isn't overwritten.
              ...(values.confirmed === checked ? {} : { status }),
              revision_no: booking.revision_no,
            },
          })
        : add.mutateAsync({ body: { ...fieldsOf(values), status }, key })
    ).catch(() => null);
    if (!saved) {
      sending.current = false; // shown from save.error, and can be tried again
      return;
    }
    toast(t(booking ? 'booking.saved' : 'booking.added', { title: saved.title }), {
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
      title={booking ? t('booking.editTitle', { title: booking.title }) : t('booking.addTitle')}
    >
      <UnsavedGuard dirty={isDirty && !save.isSuccess} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(send)(event)}
      >
        <Failure
          error={save.error}
          onReload={() => {
            save.reset();
            onReload();
          }}
        />
        <SelectField
          label={t('booking.kind')}
          options={KINDS.map((kind) => ({ value: kind, label: t(`bookings.kinds.${kind}`) }))}
          {...form.register('kind')}
        />
        <TextField
          label={t('booking.name')}
          hint={t('booking.nameHint')}
          maxLength={120}
          autoComplete="off"
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('booking.nameError'),
          })}
        />
        <TextField
          label={t('booking.reference')}
          hint={t('booking.referenceHint')}
          maxLength={80}
          autoComplete="off"
          {...form.register('reference')}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            type="datetime-local"
            label={t('booking.starts')}
            {...form.register('starts_at', { deps: ['ends_at'] })}
          />
          <TextField
            type="datetime-local"
            label={t('booking.ends')}
            error={errors.ends_at?.message}
            {...form.register('ends_at', {
              validate: (value, values) =>
                !value || !values.starts_at || value >= values.starts_at || t('booking.endsError'),
            })}
          />
        </div>
        <TextField
          label={t('booking.location')}
          maxLength={200}
          autoComplete="off"
          {...form.register('location')}
        />
        <TextField
          type="url"
          label={t('booking.link')}
          maxLength={500}
          autoComplete="off"
          error={errors.link?.message}
          {...form.register('link', {
            validate: (value) =>
              value.trim() === '' || LINK.test(value.trim()) || t('booking.linkError'),
          })}
        />
        <TextField
          label={t('booking.notes')}
          maxLength={1000}
          autoComplete="off"
          {...form.register('notes')}
        />
        <Controller
          control={form.control}
          name="confirmed"
          render={({ field }) => (
            <Switch
              label={t('booking.confirmed')}
              description={t('booking.confirmedHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={save.isPending || save.isSuccess}
        >
          {t('booking.save')}
        </Button>
      </form>
    </Dialog>
  );
}
