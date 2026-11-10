import { useTranslation } from 'react-i18next';

import { NS } from '@/modules/travel/i18n';
import type { TravellerValues } from '@/modules/travel/trip-form';
import { dayOf } from '@/modules/travel/trip-words';

/** What is said of one traveller, as typed or as saved (where what wasn't given is null). */
type Person = { [Field in keyof Omit<TravellerValues, 'id'>]?: string | null };

/** A traveller in one line, with only what was given of them: "Asha (passport: India; food:
 *  vegetarian)". */
export function useTravellerLine() {
  const { t, i18n } = useTranslation(NS);
  return (person: Person) => {
    const said = (value: string | null | undefined) => value?.trim() ?? '';
    const facts = [
      said(person.passport_country) &&
        t('new.review.passportOf', { country: said(person.passport_country) }),
      said(person.residence_country) &&
        t('new.review.residenceOf', { country: said(person.residence_country) }),
      said(person.passport_expiry) &&
        t('new.review.expiryOf', { day: dayOf(said(person.passport_expiry), i18n.language) }),
      said(person.dietary) && t('new.review.dietaryOf', { text: said(person.dietary) }),
      said(person.accessibility) && t('new.review.accessOf', { text: said(person.accessibility) }),
    ].filter(Boolean);
    const name = said(person.name);
    return facts.length ? t('new.review.person', { name, facts: facts.join('; ') }) : name;
  };
}
