import type { ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export type AlertTone = 'info' | 'danger';

const tones: Record<AlertTone, string> = {
  info: 'border-border text-text',
  danger: 'border-danger text-danger',
};

/** Danger alerts interrupt screen readers (role=alert); info is announced politely. */
export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('rounded-lg border bg-surface px-3 py-2 text-sm', tones[tone])}
    >
      {children}
    </div>
  );
}
