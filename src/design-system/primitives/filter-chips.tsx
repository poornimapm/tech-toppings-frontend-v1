import { m } from 'motion/react';
import { useId } from 'react';

import { cx } from '@/core/utils/cx';

export interface FilterChip<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  label: string;
  chips: readonly FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** One-of-many filter as pill buttons; the highlight glides to the selected chip. */
export function FilterChips<T extends string>({
  label,
  chips,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const highlightId = useId();
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const selected = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={selected}
            aria-label={chip.count === undefined ? undefined : `${chip.label} (${chip.count})`}
            onClick={() => {
              onChange(chip.value);
            }}
            className={cx(
              'relative isolate inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'border-transparent text-primary-contrast'
                : 'border-border bg-surface/60 text-text hover:bg-surface',
            )}
          >
            {selected && (
              <m.span
                layoutId={highlightId}
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md shadow-primary/30"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {chip.label}
            {chip.count !== undefined && (
              <span
                className={cx(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  selected ? 'bg-primary-contrast/20' : 'bg-bg text-muted',
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
