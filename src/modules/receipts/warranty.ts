/** Warranty dates, as the server reckons them (app/modules/receipts/warranty.py). Days are
 *  `YYYY-MM-DD`, read and written in UTC so no time zone can shift them. */

const DAY_MS = 86_400_000;

function utc(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** The same day `months` later, or that month's last day (31 Jan + 1 month: 28 Feb). */
export function monthsAfter(day: string, months: number): string {
  const start = utc(day);
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}

/** Whole days from `today` to `day` (0 on the day itself). */
export function daysUntil(today: string, day: string): number {
  return Math.round((utc(day).getTime() - utc(today).getTime()) / DAY_MS);
}

/** How long a warranty is, as the form offers it: none, one of the quick lengths (in months),
 *  or another end date. */
export type Length = 'none' | 'other' | `${number}`;

export function lengthOf(bought: string, ends: string | null, quick: readonly number[]): Length {
  if (!ends) return 'none';
  const months = quick.find((count) => monthsAfter(bought, count) === ends);
  return months === undefined ? 'other' : `${months}`;
}

/** The end date a length gives, from the day of buying; '' when there is none to give. */
export function endsOn(bought: string, length: Length, other: string): string {
  if (length === 'none') return '';
  if (length === 'other') return other;
  return bought ? monthsAfter(bought, Number(length)) : '';
}
