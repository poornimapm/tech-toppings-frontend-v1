import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { NS } from '@/modules/expenses/i18n';

/** Field names and enum values in history come from the server at runtime. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

/**
 * Words for an entry's fields and their values, as stored (what the API and revisions hold):
 * amounts as money, the category by its name, days as dates, nothing as "none".
 */
export function useFieldText(currency: string) {
  const { t, i18n } = useTranslation(NS);
  const book = useCategoryBook();
  const loose = t as unknown as LooseT;

  const formats: Record<string, (value: never) => string> = {
    amount_minor: (value: number) => formatMoney(value, currency, i18n.language),
    category_id: (value: string) => book.nameOf(book.find(value)),
    kind: (value: string) => loose(`kind.${value}`, { defaultValue: value }),
    payment_mode: (value: string) => loose(`paymentMode.${value}`, { defaultValue: value }),
    source: (value: string) => loose(`entry.source.${value}`, { defaultValue: value }),
    date: (value: string) =>
      new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(displayDate(value)),
    time: (value: string) => value.slice(0, 5),
    tags: (value: string[]) => value.map((tag) => `#${tag}`).join(' '),
    attachments: (value: { url: string }[]) => value.map((item) => item.url).join(', '),
  };

  return {
    label: (field: string) => loose(`entry.field.${field}`, { defaultValue: field }),
    value(field: string, value: unknown): string {
      const empty = value === null || value === undefined || value === '';
      if (empty || (Array.isArray(value) && value.length === 0)) return t('entry.none');
      const format = formats[field];
      if (format) return format(value as never);
      return typeof value === 'string' ? value : JSON.stringify(value);
    },
  };
}
