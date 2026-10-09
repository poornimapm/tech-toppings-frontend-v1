export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** Hour (0-23) of `now` in the user's time zone; an unknown zone falls back to the device's. */
function hourIn(now: Date, timeZone: string | undefined): number {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', hourCycle: 'h23' };
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).format(now));
  } catch {
    return Number(new Intl.DateTimeFormat('en-GB', options).format(now));
  }
}

/** Greeting period in the user's own time zone (their profile setting, not the device's). */
export function partOfDay(now: Date, timeZone?: string): PartOfDay {
  const hour = hourIn(now, timeZone);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** "Friday, 9 October" in the UI language and the user's time zone. */
export function formatToday(now: Date, locale: string, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(now);
  }
}
