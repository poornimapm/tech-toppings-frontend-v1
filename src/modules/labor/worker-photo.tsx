import { cx } from '@/core/utils/cx';
import { usePicture, type Worker } from '@/modules/labor/api';

const SIZES = { md: 'size-12 text-base', lg: 'size-16 text-xl' } as const;

/** A worker's photo, or their initials on a tile when there is none: a face to tap by. The
 *  photo is the owner's, fetched with their session and shown from memory. */
export function WorkerPhoto({
  project,
  worker,
  size = 'md',
}: {
  project: string;
  worker: Worker;
  size?: keyof typeof SIZES;
}) {
  const url = usePicture(project, worker, 'photo');
  const initials = worker.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return url ? (
    <img src={url} alt="" className={cx('shrink-0 rounded-2xl object-cover', SIZES[size])} />
  ) : (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-2xl bg-[var(--tt-accent-orange-soft)] font-bold text-[var(--tt-accent-orange)]',
        SIZES[size],
      )}
    >
      {initials}
    </span>
  );
}
