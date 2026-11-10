import { Check } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, toast } from '@/design-system';
import { useEditTrip, useTrip, type Options, type Trip, type TripMode } from '@/modules/travel/api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { ModeCards } from '@/modules/travel/mode-cards';

/**
 * The trip's mode, shown and changeable. Saving sends the mode alone, as of the revision seen,
 * so nothing else of the trip moves; Premium stays locked until the server allows it. Mounted
 * afresh for each revision, so it always starts from the trip as it is.
 */
export function ModeSettings({ trip, options }: { trip: Trip; options: Options }) {
  const { t } = useTranslation(NS);
  const { refetch } = useTrip(trip.id);
  const edit = useEditTrip();
  const form = useForm<{ mode: TripMode }>({ defaultValues: { mode: trip.mode } });
  const mode = useWatch({ control: form.control, name: 'mode' });

  const save = form.handleSubmit(async (values) => {
    const saved = await edit
      .mutateAsync({ id: trip.id, body: { mode: values.mode, revision_no: trip.revision_no } })
      .catch(() => null); // shown from edit.error
    if (saved) {
      toast(t('settings.saved', { mode: t(`trip.modes.${saved.mode}`) }), { tone: 'success' });
    }
  });

  return (
    <form noValidate className="space-y-3" onSubmit={(event) => void save(event)}>
      <p className="text-sm">{t('settings.now', { mode: t(`trip.modes.${trip.mode}`) })}</p>
      <Failure
        error={edit.error}
        onReload={() => {
          edit.reset();
          void refetch();
        }}
      />
      <ModeCards field={form.register('mode')} premiumAvailable={options.premium_available} />
      <p className="text-sm text-muted">{t('settings.keeps')}</p>
      <Button
        type="submit"
        className="min-h-11"
        disabled={mode === trip.mode || edit.isPending || edit.isSuccess}
      >
        <Check aria-hidden="true" className="size-4" />
        {t('settings.save')}
      </Button>
    </form>
  );
}
