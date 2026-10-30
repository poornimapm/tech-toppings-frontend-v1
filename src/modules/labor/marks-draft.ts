import type { components } from '@/core/api/schema';

/** A day's marks as said (the `labor_attendance_draft` client tool's arguments: `draft`), as
 *  the attendance page takes them. Nothing is saved until the owner saves it. */
export type MarksDraft = components['schemas']['AttendanceDraftIn'];
type DraftMark = MarksDraft['marks'][number];
type DraftStatus = NonNullable<DraftMark['status']>;

export const DRAFT_TOOL = 'labor_attendance_draft';

const STATUSES: readonly string[] = ['full', 'half', 'absent'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);
const statusOf = (value: unknown): DraftStatus | null =>
  typeof value === 'string' && STATUSES.includes(value) ? (value as DraftStatus) : null;
const listOf = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function markOf(value: unknown): DraftMark | null {
  if (typeof value !== 'object' || value === null) return null;
  const mark = value as Record<string, unknown>;
  const name = text(mark.name);
  if (!name) return null;
  return {
    worker_id: text(mark.worker_id),
    name,
    status: statusOf(mark.status),
    uncertain: listOf(mark.uncertain).filter(
      (item): item is 'worker' | 'status' => item === 'worker' || item === 'status',
    ),
  };
}

/** A draft handed over (by the page's own read, or the assistant's), taken defensively: nothing
 *  about its shape is trusted. */
export function draftOf(args: Record<string, unknown>): MarksDraft | null {
  const raw = args.draft;
  if (typeof raw !== 'object' || raw === null) return null;
  const draft = raw as Record<string, unknown>;
  const day = text(draft.day);
  return {
    project_id: text(draft.project_id),
    day: day && DAY.test(day) ? day : null,
    marks: Array.isArray(draft.marks)
      ? draft.marks.map(markOf).filter((mark): mark is DraftMark => mark !== null)
      : [],
    rest: statusOf(draft.rest),
    uncertain: [],
  };
}
