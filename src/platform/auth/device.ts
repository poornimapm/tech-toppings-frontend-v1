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
