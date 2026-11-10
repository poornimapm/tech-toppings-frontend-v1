import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { toMinor } from '@/core/utils/money';
import { SelectField, Switch, TextField } from '@/design-system';
import type { Options, Pace, TripType } from '@/modules/travel/api';
import { CHOICE } from '@/modules/travel/choice';
import { useCurrencies } from '@/modules/travel/currencies';
import { NS } from '@/modules/travel/i18n';
import { canRemind, interestsOf, LIMITS, type TripValues } from '@/modules/travel/trip-form';

const TYPES: TripType[] = [
  'solo',
  'friends',
  'family',
  'honeymoon',
  'business',
  'adventure',
  'other',
];
const PACES: Pace[] = ['relaxed', 'balanced', 'packed'];

/** Step three: the kind of trip and its pace, its budget, what the travellers enjoy, notes, and
 *  whether to be reminded the day before it starts. A trip starting on its own today, or begun,
 *  has no day before it left: the reminder is then shown off, and says why (the server would
 *  schedule nothing). That is the form's own rule (`remindOf`), so the check and what is saved say
 *  the same however the dates were last changed; the switch here only shows it. */
export function StyleStep({
  form,
  options,
}: {
  form: UseFormReturn<TripValues>;
  options: Options;
}) {
  const { t } = useTranslation(NS);
  const { errors } = form.formState;
  const own = useSession((state) => state.user?.timezone);
  const [currency, start, timezone] = useWatch({
    control: form.control,
    name: ['currency', 'start_date', 'destinations.0.timezone'],
  });
  const currencies = useCurrencies(currency);
  const late = !canRemind({ start_date: start, destinations: [{ timezone }] }, own);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t('new.style.type')}</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <label key={type} className={CHOICE}>
              <input
                type="radio"
                value={type}
                className="sr-only"
                {...form.register('trip_type')}
              />
              {t(`trip.types.${type}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t('new.style.pace')}</legend>
        <p className="mb-2 text-sm text-muted">{t('new.style.paceHint')}</p>
        <div className="flex flex-wrap gap-2">
          {PACES.map((pace) => (
            <label key={pace} className={CHOICE}>
              <input type="radio" value={pace} className="sr-only" {...form.register('pace')} />
              {t(`trip.paces.${pace}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t('new.style.currency')}
          options={currencies}
          {...form.register('currency', { deps: ['budget'] })}
        />
        <TextField
          label={t('new.style.budget', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.budget?.message}
          {...form.register('budget', {
            validate: (value, values) =>
              value.trim() === '' ||
              toMinor(value, values.currency) !== null ||
              t('new.style.budgetError'),
          })}
        />
      </div>
      <TextField
        label={t('new.style.interests')}
        hint={t('new.style.interestsHint')}
        autoComplete="off"
        error={errors.interests?.message}
        {...form.register('interests', {
          validate: (value) => {
            const words = interestsOf(value);
            const fits =
              words.length <= options.max_interests &&
              words.every((word) => word.length <= LIMITS.interest);
            return fits || t('new.style.interestsError', { max: options.max_interests });
          },
        })}
      />
      <TextField
        label={t('new.style.notes')}
        maxLength={LIMITS.notes}
        autoComplete="off"
        {...form.register('notes')}
      />
      <Controller
        control={form.control}
        name="remind_prepare"
        render={({ field }) => (
          <Switch
            label={t('new.style.remind')}
            description={t(late ? 'new.style.remindTooLate' : 'new.style.remindHint')}
            checked={field.value && !late}
            disabled={late}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
