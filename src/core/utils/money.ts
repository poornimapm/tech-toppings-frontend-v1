/**
 * Money travels as whole minor units (paise, cents) with an ISO-4217 currency, so sums are
 * exact. These helpers are the only place that converts to and from what people read and type.
 */

/** Decimal places of a currency (2 for INR, 0 for JPY), as the browser knows them. */
export function minorDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function toMajor(minor: number, currency: string): number {
  return minor / 10 ** minorDigits(currency);
}

/** `12550` INR -> `₹125.50` in the given language (no decimals shown for whole amounts). */
export function formatMoney(minor: number, currency: string, locale: string): string {
  const digits = minor % 10 ** minorDigits(currency) === 0 ? 0 : minorDigits(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toMajor(minor, currency));
}

/**
 * What someone typed ("1,250.5") as minor units, or `null` when it isn't an amount. Done on
 * the digits themselves, never through floating point, so 19.99 is exactly 1999.
 */
export function toMinor(text: string, currency: string): number | null {
  const digits = minorDigits(currency);
  const match = /^(\d+)(?:\.(\d*))?$/.exec(text.replace(/[\s,]/g, ''));
  const fraction = match?.[2] ?? '';
  if (!match?.[1] || fraction.length > digits) return null;
  const minor = Number(match[1] + fraction.padEnd(digits, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Minor units as the text of an amount box: `12550` INR -> `125.50`. */
export function toInput(minor: number, currency: string): string {
  return toMajor(minor, currency).toFixed(minorDigits(currency));
}
