import { m } from 'motion/react';
import { useId, type ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** On/off setting (role="switch"); the knob springs across. */
export function Switch({ label, description, checked, onCheckedChange, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-sm text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => {
          onCheckedChange(!checked);
        }}
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent p-0.5 transition-colors disabled:opacity-60',
          checked ? 'justify-end bg-primary' : 'justify-start bg-border',
        )}
      >
        <m.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          className="block size-5 rounded-full bg-surface shadow"
        />
      </button>
    </div>
  );
}
