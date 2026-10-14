import { formatMoney } from '@/core/utils/money';

const MINOR = '_minor';

/**
 * Parameters as a template uses them. Money is sent in minor units, named `<name>_minor` beside
 * a `currency`, and a template writes it as `{{<name>}}` in the user's language:
 * `{price_minor: 6000, currency: 'INR'}` gives `price: '₹60'` as well.
 */
export function withMoney(
  params: Record<string, unknown>,
  language: string,
): Record<string, unknown> {
  const currency = params.currency;
  if (typeof currency !== 'string') return params;
  const found: Record<string, unknown> = { ...params };
  for (const [name, value] of Object.entries(params)) {
    if (name.endsWith(MINOR) && typeof value === 'number') {
      found[name.slice(0, -MINOR.length)] = formatMoney(value, currency, language);
    }
  }
  return found;
}
