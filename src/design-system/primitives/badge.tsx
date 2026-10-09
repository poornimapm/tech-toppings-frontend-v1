import type { ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export type BadgeTone = 'neutral' | 'beta' | 'soon' | 'locked' | 'success';

// Accent pairs are contrast-checked in tokens.test.ts.
const tones: Record<BadgeTone, string> = {
  neutral: 'bg-bg text-muted border-border',
  beta: 'bg-[var(--tt-accent-violet-soft)] text-[var(--tt-accent-violet)] border-transparent',
  soon: 'bg-[var(--tt-accent-amber-soft)] text-[var(--tt-accent-amber)] border-transparent',
  locked: 'bg-[var(--tt-accent-slate-soft)] text-[var(--tt-accent-slate)] border-transparent',
  success: 'bg-[var(--tt-accent-emerald-soft)] text-[var(--tt-accent-emerald)] border-transparent',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        tones[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}
