import type { Language } from '@/core/i18n';

/** Outbox kinds (ADR-0010): an entry saved offline, and words said or typed offline. Their
 *  senders (outbox.ts) load only when such an item waits. */
export const OUTBOX_ENTRY = 'expenses.entry';
export const OUTBOX_CAPTURE = 'expenses.capture';

/** Words said or typed offline, read once the device is back online. */
export interface CaptureLater {
  input: string;
  inputType: 'text' | 'speech';
  locale: Language;
  /** The day it was said: "yesterday" means the day before this one. */
  day: string;
}
