import { Check } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { Button, Dialog, toast } from '@/design-system';
import { useEditTrip, useTrip } from '@/modules/travel/api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { PeopleStep } from '@/modules/travel/people-step';
import { PlaceStep } from '@/modules/travel/place-step';
import { StyleStep } from '@/modules/travel/style-step';
import { useTripContext } from '@/modules/travel/trip-context';
import { bodyOf, valuesOf, type TripValues } from '@/modules/travel/trip-form';

/**
 * Change a saved trip: where and when, who is going (each keeping their id, so what names them
 * still does) and its style and budget, the same parts as planning it. Sent as of the revision
 * opened; changed elsewhere since, the latest is offered instead. The mode has its own setting,
 * as switching it alone changes nothing else. A change the trip's records can't take (dates that
 * would leave out an activity, a traveller a cost still names) is refused and said.
 */
export function EditTripDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const { refetch } = useTrip(trip.id);
  const own = useSession((state) => state.user?.timezone);
  const edit = useEditTrip();
  const sending = useRef(false);
  const form = useForm<TripValues>({ defaultValues: valuesOf(trip) });
  const { isDirty } = form.formState;

  const send = async (values: TripValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    // All of it goes, the mode as it is: the server writes only what differs.
    const saved = await edit
      .mutateAsync({ id: trip.id, body: { ...bodyOf(values, own), revision_no: trip.revision_no } })
      .catch(() => null);
    if (!saved) {
      sending.current = false; // shown from edit.error, and can be tried again
      return;
    }
    toast(t('tripEdit.saved', { title: saved.title }), { tone: 'success' });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('tripEdit.title', { title: trip.title })}
      description={t('tripEdit.intro')}
    >
      <UnsavedGuard dirty={isDirty && !edit.isSuccess} />
      <form
        noValidate
        className="space-y-6"
        onSubmit={(event) => void form.handleSubmit(send)(event)}
      >
        <Section title={t('new.steps.place')}>
          <PlaceStep form={form} options={options} />
        </Section>
        <Section title={t('new.steps.people')}>
          <PeopleStep form={form} options={options} />
        </Section>
        <Section title={t('new.steps.style')}>
          <StyleStep form={form} options={options} />
        </Section>
        <Failure
          error={edit.error}
          onReload={() => {
            edit.reset();
            void refetch();
          }}
        />
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={!isDirty || edit.isPending || edit.isSuccess}
        >
          <Check aria-hidden="true" className="size-4" />
          {t('tripEdit.save')}
        </Button>
      </form>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h3 id={headingId} className="text-base font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}
