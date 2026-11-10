import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';

/** The last part of a suggestion's key: "activity:ab12:water_bottle" -> "water_bottle". */
const ruleOf = (key: string | null | undefined) => key?.split(':').at(-1) ?? '';

/**
 * The module's words for what the server sends by key, and for times and lengths. A key this
 * build doesn't know is shown as the server sent it, never dropped.
 */
export function useWords() {
  const { t, i18n } = useTranslation(NS);
  const language = i18n.language;
  const unit = (value: number, of: 'hour' | 'minute') =>
    new Intl.NumberFormat(language, { style: 'unit', unit: of, unitDisplay: 'short' }).format(
      value,
    );
  const time = (at: string) =>
    new Intl.DateTimeFormat(language, { timeStyle: 'short', timeZone: 'UTC' }).format(
      new Date(`1970-01-01T${at}:00Z`),
    );
  return {
    kind: (kind: string) => (isKnown(en.kinds, kind) ? t(`kinds.${kind}`) : kind),
    /** What a cost is filed under. */
    category: (category: string) =>
      isKnown(en.budget.categories, category) ? t(`budget.categories.${category}`) : category,
    /** An item's name: the app's own words for a suggestion as it came, else as stored. */
    item: (title: string, key: string | null | undefined, asSuggested: boolean) => {
      const rule = ruleOf(key);
      return asSuggested && isKnown(en.suggestions, rule) ? t(`suggestions.${rule}`) : title;
    },
    /** "09:30", local where it happens, in the reader's way: "9:30 AM". */
    time,
    /** "2026-11-06T09:30", local where it happens: "Nov 6 9:30 AM". */
    moment: (at: string) =>
      `${displayDate(at.slice(0, 10)).toLocaleDateString(language, {
        month: 'short',
        day: 'numeric',
      })} ${time(at.slice(11, 16))}`,
    /** 90 -> "1 hr 30 min". */
    duration: (minutes: number) =>
      [
        minutes >= 60 && unit(Math.floor(minutes / 60), 'hour'),
        minutes % 60 > 0 && unit(minutes % 60, 'minute'),
      ]
        .filter(Boolean)
        .join(' '),
  };
}
