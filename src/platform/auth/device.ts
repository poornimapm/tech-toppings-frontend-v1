const BROWSERS: [marker: string, name: string][] = [
  ['Edg/', 'Edge'],
  ['Firefox/', 'Firefox'],
  ['Chrome/', 'Chrome'],
  ['Safari/', 'Safari'],
];
const SYSTEMS: [marker: string, name: string][] = [
  ['Android', 'Android'],
  ['iPhone', 'iOS'],
  ['iPad', 'iOS'],
  ['Windows', 'Windows'],
  ['Mac OS X', 'macOS'],
  ['Linux', 'Linux'],
];

function firstMatch(userAgent: string, table: [string, string][]): string | null {
  return table.find(([marker]) => userAgent.includes(marker))?.[1] ?? null;
}

/** "Chrome · Windows" style label from a user-agent string (order matters: Edge says Chrome too). */
export function describeDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const parts = [firstMatch(userAgent, BROWSERS), firstMatch(userAgent, SYSTEMS)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3600],
  ['minute', 60],
];

/** "5 minutes ago" in the given language. */
export function relativeTime(iso: string, language: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(seconds, 'second');
}
