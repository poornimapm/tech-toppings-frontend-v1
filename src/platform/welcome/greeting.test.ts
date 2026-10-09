import { describe, expect, it } from 'vitest';

import { formatToday, partOfDay } from '@/platform/welcome/greeting';

describe('greeting', () => {
  it.each([
    ['2026-10-09T00:30:00Z', 'morning'], // 06:00 in Kolkata
    ['2026-10-09T07:00:00Z', 'afternoon'], // 12:30
    ['2026-10-09T12:00:00Z', 'evening'], // 17:30
    ['2026-10-09T16:00:00Z', 'night'], // 21:30
    ['2026-10-08T22:00:00Z', 'night'], // 03:30
  ])('%s is %s in Asia/Kolkata', (iso, expected) => {
    expect(partOfDay(new Date(iso), 'Asia/Kolkata')).toBe(expected);
  });

  it('uses the profile time zone, not the device one', () => {
    const instant = new Date('2026-10-09T13:00:00Z');

    expect(partOfDay(instant, 'Asia/Kolkata')).toBe('evening'); // 18:30
    expect(partOfDay(instant, 'America/New_York')).toBe('morning'); // 09:00
  });

  it('falls back to the device time zone for an unknown one', () => {
    const instant = new Date('2026-10-09T13:00:00Z');

    expect(partOfDay(instant, 'Mars/Olympus')).toBe(partOfDay(instant));
    expect(formatToday(instant, 'en', 'Mars/Olympus')).toBe(formatToday(instant, 'en'));
  });

  it('formats today in the UI language', () => {
    const instant = new Date('2026-10-09T06:00:00Z');

    expect(formatToday(instant, 'en-GB', 'Asia/Kolkata')).toBe('Friday 9 October');
    expect(formatToday(instant, 'ta', 'Asia/Kolkata')).toContain('அக்டோபர்');
  });
});
