import { addDays } from '@/core/utils/dates';

/** Period presets, in days ending today. The first is the default. */
export const PRESETS = [30, 7, 90] as const;
export type Preset = (typeof PRESETS)[number];

export function toPreset(value: string | null): Preset {
  return PRESETS.find((days) => String(days) === value) ?? PRESETS[0];
}

/** The last `days` days, ending `today` (both inclusive), as the API expects them. */
export function periodFor(days: number, today: string): { from: string; to: string } {
  return { from: addDays(today, 1 - days), to: today };
}
