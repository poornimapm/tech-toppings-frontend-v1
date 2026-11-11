import { Pencil } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { formatMoney, toMinor } from '@/core/utils/money';
import { Button } from '@/design-system';
import { NS } from '@/modules/travel/i18n';
import { useTravellerLine } from '@/modules/travel/traveller-line';
import { interestsOf, remindOf, type Step, type TripValues } from '@/modules/travel/trip-form';
import { daysOf, lengthOf, placesOf } from '@/modules/travel/trip-words';

/**
 * The last step: everything the person gave, step by step, as it will be saved, each part with
 * a button back to its step to change it.
 */
export function TripReview({
  values,
  onEdit,
}: {
  values: TripValues;
  onEdit: (step: Exclude<Step, 'review'>) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const line = useTravellerLine();
  const own = useSession((state) => state.user?.timezone);
  const language = i18n.language;
  const none = t('new.review.none');
  const budget = values.budget.trim() ? toMinor(values.budget, values.currency) : null;
  const travellers = values.travellers.map(line);
  const span = { start_date: values.start_date, end_date: values.end_date };
  // As it will be saved: asked for, but with no day before it left, it is none, and says why.
  const reminder = remindOf(values, own)
    ? t('new.review.remindOn')
    : [t('new.review.remindOff'), values.remind_prepare && t('new.style.remindTooLate')]
        .filter(Boolean)
        .join(' · ');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('new.review.intro')}</p>
      <Part step="place" onEdit={onEdit}>
        <Row label={t('new.review.title')} value={values.title.trim()} />
        <Row label={t('new.review.destinations')} value={placesOf(values.destinations)} />
        <Row
          label={t('new.review.dates')}
          value={`${daysOf(span, language)} · ${t('new.review.days', { count: lengthOf(span) })}`}
        />
        <Row label={t('new.review.departure')} value={values.departure_city.trim() || none} />
      </Part>
      <Part step="people" onEdit={onEdit}>
        <Row
          label={t('new.review.travellers')}
          value={travellers.length ? travellers.join(', ') : t('new.review.nobody')}
        />
      </Part>
      <Part step="style" onEdit={onEdit}>
        <Row label={t('new.review.type')} value={t(`trip.types.${values.trip_type}`)} />
        <Row label={t('new.review.pace')} value={t(`trip.paces.${values.pace}`)} />
        <Row
          label={t('new.review.budget')}
          value={budget === null ? none : formatMoney(budget, values.currency, language)}
        />
        <Row
          label={t('new.review.interests')}
          value={interestsOf(values.interests).join(', ') || none}
        />
        <Row label={t('new.review.notes')} value={values.notes.trim() || none} />
        <Row label={t('new.review.remind')} value={reminder} />
      </Part>
      <Part step="mode" onEdit={onEdit}>
        <Row label={t('new.review.mode')} value={t(`trip.modes.${values.mode}`)} />
      </Part>
    </div>
  );
}

/** One step's answers under its name, with its Edit button ("Edit Where and when" to a screen
 *  reader, so one part's button is told from the next). */
function Part({
  step,
  onEdit,
  children,
}: {
  step: Exclude<Step, 'review'>;
  onEdit: (step: Exclude<Step, 'review'>) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation(NS);
  const headingId = useId();
  const editId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-3 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold">
          {t(`new.steps.${step}`)}
        </h3>
        <Button
          variant="secondary"
          id={editId}
          aria-labelledby={`${editId} ${headingId}`}
          className="min-h-11"
          onClick={() => {
            onEdit(step);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
          {t('new.review.edit')}
        </Button>
      </div>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
        {children}
      </dl>
    </section>
  );
}

/** One answer under its label, in a `<dl>`. */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{value}</dd>
    </>
  );
}
