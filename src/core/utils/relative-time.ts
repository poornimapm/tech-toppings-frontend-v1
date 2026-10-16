const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3600],
  ['minute', 60],
];

/** "tomorrow", "in 3 days", "yesterday": a calendar day (`YYYY-MM-DD`) as seen from `today`. */
export function relativeDay(day: string, today: string, language: string): string {
  const days = Math.round((Date.parse(day) - Date.parse(today)) / 86_400_000);
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(days, 'day');
}

/** "5 minutes ago" in the given language. */
export function relativeTime(iso: string, language: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(seconds, 'second');
}
