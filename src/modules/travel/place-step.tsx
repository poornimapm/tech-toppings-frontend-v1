import { Plus, X } from 'lucide-react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, SelectField, TextField } from '@/design-system';
import type { Options } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import { blankPlace, LIMITS, type TripValues } from '@/modules/travel/trip-form';
import { lengthOf } from '@/modules/travel/trip-words';

/** The time zones this browser knows (IANA names, as the API checks them); none if it can't
 *  list them, and then the trip's today is the person's own. */
const ZONES = (
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
).map((zone) => ({ value: zone, label: zone.replaceAll('_', ' ') }));

/** Step one: the trip's name, where it goes (one place or more) and when. */
export function PlaceStep({
  form,
  options,
}: {
  form: UseFormReturn<TripValues>;
  options: Options;
}) {
  const { t } = useTranslation(NS);
  const { errors } = form.formState;
  const places = useFieldArray({ control: form.control, name: 'destinations' });
  const start = useWatch({ control: form.control, name: 'start_date' });

  return (
    <div className="space-y-5">
      <TextField
        label={t('new.place.tripTitle')}
        hint={t('new.place.tripTitleHint')}
        maxLength={LIMITS.name}
        autoComplete="off"
        error={errors.title?.message}
        {...form.register('title', {
          validate: (value) => value.trim() !== '' || t('new.place.titleError'),
        })}
      />
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">{t('new.place.destinations')}</legend>
        <p className="text-sm text-muted">{t('new.place.timezoneHint')}</p>
        {places.fields.map((field, index) => (
          <fieldset key={field.id} className="space-y-3 rounded-2xl border border-border p-4">
            <legend className="px-1 text-sm font-medium">
              {t('new.place.number', { number: index + 1 })}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={t('new.place.name')}
                maxLength={LIMITS.name}
                autoComplete="off"
                error={errors.destinations?.[index]?.name?.message}
                {...form.register(`destinations.${index}.name`, {
                  validate: (value) => value.trim() !== '' || t('new.place.nameError'),
                })}
              />
              <TextField
                label={t('new.place.country')}
                maxLength={LIMITS.name}
                autoComplete="off"
                error={errors.destinations?.[index]?.country?.message}
                {...form.register(`destinations.${index}.country`, {
                  validate: (value) => value.trim() !== '' || t('new.place.countryError'),
                })}
              />
            </div>
            <SelectField
              label={t('new.place.timezone')}
              placeholder={t('new.place.timezoneNone')}
              options={ZONES}
              {...form.register(`destinations.${index}.timezone`)}
            />
            {places.fields.length > 1 && (
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => {
                  places.remove(index);
                }}
              >
                <X aria-hidden="true" className="size-4" />
                {t('new.place.remove', { number: index + 1 })}
              </Button>
            )}
          </fieldset>
        ))}
        {places.fields.length < options.max_destinations ? (
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              places.append(blankPlace());
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t('new.place.add')}
          </Button>
        ) : (
          <p className="text-sm text-muted">
            {t('new.place.full', { max: options.max_destinations })}
          </p>
        )}
      </fieldset>
      <TextField
        label={t('new.place.departure')}
        maxLength={LIMITS.place}
        autoComplete="off"
        {...form.register('departure_city')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          type="date"
          label={t('new.place.start')}
          error={errors.start_date?.message}
          {...form.register('start_date', {
            deps: ['end_date'],
            validate: (value) => value !== '' || t('new.place.startError'),
          })}
        />
        <TextField
          type="date"
          label={t('new.place.end')}
          min={start || undefined}
          error={errors.end_date?.message}
          {...form.register('end_date', {
            validate: (value, values) => {
              if (value === '' || value < values.start_date) return t('new.place.endError');
              const days = values.start_date
                ? lengthOf({ start_date: values.start_date, end_date: value })
                : 0;
              return (
                days <= options.max_trip_days ||
                t('new.place.tooLong', { max: options.max_trip_days })
              );
            },
          })}
        />
      </div>
    </div>
  );
}
