import { useId, type ComponentProps } from 'react';

import { cx } from '@/core/utils/cx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'children'> {
  label: string;
  options: readonly SelectOption[];
  /** Text of the "nothing chosen" option; leave out when a choice is required. */
  placeholder?: string;
  /** Validation message; marks the select invalid and is announced with it. */
  error?: string | undefined;
  /** Keep the label for screen readers only (e.g. in a table row, under a column heading). */
  hideLabel?: boolean;
}

/** A labelled native select: the platform's own picker on phones, and fully keyboard-operable. */
export function SelectField({
  label,
  options,
  placeholder,
  error,
  hideLabel = false,
  id,
  className,
  ...select
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'block text-sm font-medium'}>
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text aria-[invalid=true]:border-danger"
        {...select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
