/** Calendar days as the API sends them: `YYYY-MM-DD`, with no time and no time zone. */

/** Today in the user's time zone; an unknown zone falls back to the device's. */
export function todayIn(timeZone: string | undefined, now: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  try {
    return new Intl.DateTimeFormat('en-CA', { ...options, timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', options).format(now);
  }
}

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** A calendar day for display: local noon, so no time zone can shift it to a neighbour. */
export function displayDate(day: string): Date {
  return new Date(`${day}T12:00:00`);
}
