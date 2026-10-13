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
}

/** A labelled native select: the platform's own picker on phones, and fully keyboard-operable. */
export function SelectField({
  label,
  options,
  placeholder,
  id,
  className,
  ...select
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={selectId} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={selectId}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text"
        {...select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
