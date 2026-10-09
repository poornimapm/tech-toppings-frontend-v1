import type { LucideIcon } from 'lucide-react';
import { m } from 'motion/react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}

/** Friendly "nothing here" panel with a gently floating icon and a next step. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center"
    >
      <m.div
        aria-hidden="true"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="grid size-14 place-items-center rounded-2xl bg-bg text-muted"
      >
        <Icon className="size-7" />
      </m.div>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </m.div>
  );
}
