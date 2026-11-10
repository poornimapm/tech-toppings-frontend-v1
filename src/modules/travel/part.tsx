import { useId, type ReactNode } from 'react';

/** A part of a trip's tab under its heading, with what can be done there beside it. */
export function Part({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-base font-semibold">
          {title}
        </h3>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}
