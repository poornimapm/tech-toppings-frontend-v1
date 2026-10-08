import { useId, type ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export interface CardProps {
  /** Visible heading; also labels the region for assistive technology. */
  title: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cx('rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}
    >
      <h2 id={headingId} className="text-base font-semibold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
