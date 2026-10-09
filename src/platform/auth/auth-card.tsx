import type { ReactNode } from 'react';

/** Centered single-column container for the sign-in style pages. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">{title}</h1>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
