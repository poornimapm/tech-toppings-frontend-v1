import { cx } from '@/core/utils/cx';

/** Shimmering placeholder while content loads (static when motion is reduced). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'animate-shimmer rounded-xl bg-[length:200%_100%]',
        'bg-[linear-gradient(90deg,var(--tt-border)_0%,var(--tt-surface)_50%,var(--tt-border)_100%)]',
        'opacity-60',
        className,
      )}
    />
  );
}
