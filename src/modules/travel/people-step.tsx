import { Plus, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { Button, TextField } from '@/design-system';
import type { Options } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import {
  blankTraveller,
  LIMITS,
  TRAVELLER_DETAILS,
  type TripValues,
} from '@/modules/travel/trip-form';

/**
 * Step two: who is going, each by name with their own passport country, asked as optional and
 * never guessed, and, folded away, where they live, until when their passport runs, and what
 * they need of food and access. Nobody is assumed, the person planning included: one tap adds
 * them.
 */
export function PeopleStep({
  form,
  options,
}: {
  form: UseFormReturn<TripValues>;
  options: Options;
}) {
  const { t } = useTranslation(NS);
  const { errors } = form.formState;
  const travellers = useFieldArray({ control: form.control, name: 'travellers' });
  const listed = useWatch({ control: form.control, name: 'travellers' });
  const you = useSession((state) => state.user?.name);
  const youListed = listed.some((person) => person.name.trim() === you);
  const full = travellers.fields.length >= options.max_travellers;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('new.people.hint')}</p>
      {travellers.fields.length === 0 && <p>{t('new.people.none')}</p>}
      {travellers.fields.map((field, index) => (
        <fieldset key={field.id} className="space-y-3 rounded-2xl border border-border p-4">
          <legend className="px-1 text-sm font-medium">
            {t('new.people.number', { number: index + 1 })}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={t('new.people.name')}
              maxLength={LIMITS.name}
              autoComplete="off"
              error={errors.travellers?.[index]?.name?.message}
              {...form.register(`travellers.${index}.name`, {
                validate: (value) => value.trim() !== '' || t('new.people.nameError'),
              })}
            />
            <TextField
              label={t('new.people.passport')}
              hint={t('new.people.passportHint')}
              maxLength={LIMITS.place}
              autoComplete="off"
              {...form.register(`travellers.${index}.passport_country`)}
            />
          </div>
          <MoreAbout form={form} index={index} />
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              travellers.remove(index);
            }}
          >
            <X aria-hidden="true" className="size-4" />
            {t('new.people.remove', { number: index + 1 })}
          </Button>
        </fieldset>
      ))}
      {full ? (
        <p className="text-sm text-muted">
          {t('new.people.full', { max: options.max_travellers })}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {you && !youListed && (
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                travellers.append(blankTraveller(you));
              }}
            >
              <UserPlus aria-hidden="true" className="size-4" />
              {t('new.people.addYou', { name: you })}
            </Button>
          )}
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              travellers.append(blankTraveller());
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t('new.people.add')}
          </Button>
        </div>
      )}
    </div>
  );
}

/** What more a traveller may say of themselves, folded away. It opens already for someone who
 *  gave some of it, as found when the step is shown; from then on it is the person's to open and
 *  shut, so clearing a field as they type never folds it round them. */
function MoreAbout({ form, index }: { form: UseFormReturn<TripValues>; index: number }) {
  const { t } = useTranslation(NS);
  const [open, setOpen] = useState(() =>
    TRAVELLER_DETAILS.some((name) => form.getValues(`travellers.${index}.${name}`) !== ''),
  );
  return (
    <details
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-primary">
        {t('new.people.more')}
      </summary>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <TextField
          label={t('new.people.residence')}
          maxLength={LIMITS.place}
          autoComplete="off"
          {...form.register(`travellers.${index}.residence_country`)}
        />
        <TextField
          type="date"
          label={t('new.people.expiry')}
          hint={t('new.people.expiryHint')}
          {...form.register(`travellers.${index}.passport_expiry`)}
        />
        <TextField
          label={t('new.people.dietary')}
          maxLength={LIMITS.need}
          autoComplete="off"
          {...form.register(`travellers.${index}.dietary`)}
        />
        <TextField
          label={t('new.people.accessibility')}
          maxLength={LIMITS.need}
          autoComplete="off"
          {...form.register(`travellers.${index}.accessibility`)}
        />
      </div>
    </details>
  );
}
