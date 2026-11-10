import { addDays, displayDate, todayIn } from '@/core/utils/dates';

interface Span {
  start_date: string;
  end_date: string;
}

/** A trip's days as one span in the reader's language: "Nov 20 – 27, 2026". */
export function daysOf({ start_date, end_date }: Span, language: string): string {
  const format = new Intl.DateTimeFormat(language, { dateStyle: 'medium' });
  return format.formatRange(displayDate(start_date), displayDate(end_date));
}

/** How many days a span holds, its first and last both counted. */
export function lengthOf({ start_date, end_date }: Span): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(end_date) - Date.parse(start_date)) / day) + 1;
}

/** Where a trip goes, as the person wrote it: "Goa, India · Kochi, India". */
export function placesOf(destinations: readonly { name: string; country: string }[]): string {
  return destinations
    .map(({ name, country }) => [name, country].filter(Boolean).join(', '))
    .join(' · ');
}

/** One calendar day in the reader's language: "Nov 27, 2026". */
export function dayOf(day: string, language: string): string {
  return displayDate(day).toLocaleDateString(language, { dateStyle: 'medium' });
}

/** A day with its weekday, short: "Fri, Nov 20". */
export function weekdayOf(day: string, language: string): string {
  return displayDate(day).toLocaleDateString(language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Every day of a span, first to last. */
export function daysIn({ start_date, end_date }: Span): string[] {
  const days: string[] = [];
  for (let day = start_date; day <= end_date; day = addDays(day, 1)) days.push(day);
  return days;
}

/** A trip's own today: at its first destination, else where the person is (as the server's). */
export function tripToday(
  trip: { destinations: readonly { timezone?: string | null }[] },
  own: string | undefined,
): string {
  return todayIn(trip.destinations[0]?.timezone ?? own);
}
