import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';
import { useTripContext } from '@/modules/travel/trip-context';
import { dayOf, weekdayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

/** Whether a field is one a change shows: the rest (an item's place in its day, ids, an amount
 *  whose currency the change doesn't carry) are the app's own bookkeeping or can't be said
 *  truly, so they say nothing to the person. */
export const isShownField = (field: string) => isKnown(en.changes.fields, field);

const text = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

/** One field's name and value in words, as "What changed?" shows them: a state by its name, a
 *  day by its date, an amount in the trip's currency, a traveller by name. A field means what
 *  its kind of record (`entity`) says: a booking's status isn't an activity's. A key this build
 *  doesn't word is shown as sent. */
export function useFieldWords(currency: string) {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const words = useWords();
  const person = (id: string) => trip.travellers.find((each) => each.id === id)?.name ?? id;
  const by: Record<string, (value: string) => string> = {
    status: (value) =>
      isKnown(en.itinerary.status, value) ? t(`itinerary.status.${value}`) : value,
    state: (value) =>
      isKnown(en.checklist.states, value) ? t(`checklist.states.${value}`) : value,
    bag: (value) => (isKnown(en.bags, value) ? t(`bags.${value}`) : value),
    kind: (value) => words.kind(value),
    day: (value) => weekdayOf(value, i18n.language),
    start_time: (value) => words.time(value),
    confirmed: (value) => t(value === 'true' ? 'itinerary.confirmed' : 'itinerary.estimate'),
    duration_minutes: (value) => words.duration(Number(value)),
    estimated_cost_minor: (value) => formatMoney(Number(value), currency, i18n.language),
    mode: (value) => (isKnown(en.trip.modes, value) ? t(`trip.modes.${value}`) : value),
    start_date: (value) => dayOf(value, i18n.language),
    end_date: (value) => dayOf(value, i18n.language),
    paid_by: person,
    'booking.kind': (value) =>
      isKnown(en.bookings.kinds, value) ? t(`bookings.kinds.${value}`) : value,
    'booking.status': (value) =>
      isKnown(en.bookings.status, value) ? t(`bookings.status.${value}`) : value,
    'booking.starts_at': (value) => words.moment(value),
    'booking.ends_at': (value) => words.moment(value),
    'expense.kind': (value) =>
      isKnown(en.budget.kinds, value) ? t(`budget.kinds.${value}`) : value,
    'expense.category': (value) => words.category(value),
    budget_minor: (value) => formatMoney(Number(value), currency, i18n.language),
  };
  return {
    label: (field: string) =>
      isKnown(en.changes.fields, field) ? t(`changes.fields.${field}`) : field,
    value: (field: string, value: unknown, entity = '') => {
      if (value === null || value === undefined || value === '') return t('changes.none');
      // Those sharing a cost, by name.
      if (Array.isArray(value)) {
        return value.length ? value.map((id) => person(text(id))).join(', ') : t('changes.none');
      }
      const said = text(value);
      return (by[`${entity}.${field}`] ?? by[field])?.(said) ?? said;
    },
  };
}
