import { describe, expect, it } from 'vitest';

import { displayDate, todayIn } from '@/core/utils/dates';
import { periodFor, PRESETS, toPreset } from '@/platform/dashboard/range';

describe('dashboard period', () => {
  it('accepts only the presets, defaulting to the first', () => {
    expect(toPreset('7')).toBe(7);
    expect(toPreset('8')).toBe(PRESETS[0]);
    expect(toPreset(null)).toBe(PRESETS[0]);
  });

  it("takes today from the user's time zone, not the device's", () => {
    const lateEvening = new Date('2026-10-08T20:00:00Z'); // already the 9th in Kolkata
    expect(todayIn('Asia/Kolkata', lateEvening)).toBe('2026-10-09');
    expect(todayIn('America/Los_Angeles', lateEvening)).toBe('2026-10-08');
  });

  it("falls back to the device's zone when the user's is unknown", () => {
    expect(todayIn('Not/AZone', new Date('2026-10-08T12:00:00Z'))).toMatch(/^2026-10-0[89]$/);
  });

  it('counts both ends of the period, across month and year boundaries', () => {
    expect(periodFor(7, '2026-10-08')).toEqual({ from: '2026-10-02', to: '2026-10-08' });
    expect(periodFor(30, '2026-01-10')).toEqual({ from: '2025-12-12', to: '2026-01-10' });
    expect(periodFor(1, '2026-03-01')).toEqual({ from: '2026-03-01', to: '2026-03-01' });
  });

  it('shows a calendar day as that day wherever the device is', () => {
    expect(displayDate('2026-10-08').getDate()).toBe(8);
  });
});
