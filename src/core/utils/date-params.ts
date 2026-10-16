import { displayDate } from '@/core/utils/dates';

const ON = '_on';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parameters as a template uses them. A calendar day is sent as `<name>_on` (`YYYY-MM-DD`), and a
 * template writes it as `{{<name>}}` in the user's language: `{due_on: '2026-10-20'}` gives
 * `due: 'October 20'` as well.
 */
export function withDates(
  params: Record<string, unknown>,
  language: string,
): Record<string, unknown> {
  const format = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' });
  const found: Record<string, unknown> = { ...params };
  for (const [name, value] of Object.entries(params)) {
    if (name.endsWith(ON) && typeof value === 'string' && DAY.test(value)) {
      found[name.slice(0, -ON.length)] = format.format(displayDate(value));
    }
  }
  return found;
}
