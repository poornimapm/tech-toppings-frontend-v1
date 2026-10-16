import type { ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export type AlertTone = 'info' | 'danger';

const tones: Record<AlertTone, string> = {
  info: 'border-border text-text',
  danger: 'border-danger text-danger',
};

/**
 * Danger alerts interrupt screen readers (role=alert); info is announced politely. With nothing
 * in it, an alert is an empty region that takes no room: kept mounted like that, what is put in
 * later is announced, where a region added with its words already in may not be.
 */
export function Alert({
  tone = 'info',
  className,
  children,
}: {
  tone?: AlertTone;
  /** More classes for the alert while it shows something. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={
        children
          ? cx('rounded-lg border bg-surface px-3 py-2 text-sm', tones[tone], className)
          : undefined
      }
    >
      {children}
    </div>
  );
}
