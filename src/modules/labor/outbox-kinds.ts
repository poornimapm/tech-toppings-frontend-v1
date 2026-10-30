import type { components } from '@/core/api/schema';

type MarkStatus = components['schemas']['AttendanceStatus'];

/** Outbox kind (ADR-0010): a mark tapped with no network. Its sender (outbox.ts) loads only
 *  when such a mark waits. */
export const OUTBOX_MARKS = 'labor.marks';

/** What a mark kept offline was: one worker's mark for a day, and the mark the owner saw when
 *  tapping (sent along: changed elsewhere since, it is refused rather than overwriting). */
export interface MarksLater {
  project_id: string;
  day: string;
  marks: { worker_id: string; status: MarkStatus; expected: MarkStatus | 'unmarked' }[];
}
