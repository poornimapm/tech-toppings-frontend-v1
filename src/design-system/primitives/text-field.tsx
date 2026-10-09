import { useId, type ComponentProps, type ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'children'> {
  label: string;
  /** Validation message; marks the input invalid and is announced with it. */
  error?: string | undefined;
  /** Help shown under the field (also linked via aria-describedby). */
  hint?: ReactNode;
  /** Control rendered at the end of the input row (e.g. show-password toggle). */
  action?: ReactNode;
}

export function TextField({ label, error, hint, action, id, className, ...input }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = cx(hint ? hintId : false, error ? errorId : false) || undefined;

  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text aria-[invalid=true]:border-danger"
          {...input}
        />
        {action}
      </div>
      {hint && (
        <div id={hintId} className="text-sm text-muted">
          {hint}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
