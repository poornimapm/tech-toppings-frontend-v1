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

/** One-of-many filter as pill buttons; the highlight grows in under the selected chip (CSS
 *  only: pages that show chips before their first paint load no animation library). */
export function FilterChips<T extends string>({
  label,
  chips,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const selected = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={selected}
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
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md shadow-primary/30 transition-[opacity,scale] duration-200 ease-out starting:scale-75 starting:opacity-0"
              />
            )}
            {chip.label}
            {/* Named from its words ("All (4)"), never a label that differs from what shows. */}
            {chip.count !== undefined && (
              <>
                {' '}
                <span className="sr-only">({chip.count})</span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    selected ? 'bg-primary-contrast/20' : 'bg-bg text-muted',
                  )}
                >
                  {chip.count}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
