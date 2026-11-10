import { Circle, CircleCheckBig, CircleSlash, Clock3, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import type { ChecklistState } from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';

/** Each state: its icon and look, so it reads without colour and without reading. */
const STATES: { state: ChecklistState; icon: LucideIcon; on: string }[] = [
  {
    state: 'not_started',
    icon: Circle,
    on: 'border-primary bg-primary/10 text-primary',
  },
  {
    state: 'in_progress',
    icon: Clock3,
    on: 'border-[var(--tt-accent-amber)] bg-[var(--tt-accent-amber-soft)] text-[var(--tt-accent-amber)]',
  },
  {
    state: 'completed',
    icon: CircleCheckBig,
    on: 'border-[var(--tt-accent-emerald)] bg-[var(--tt-accent-emerald-soft)] text-[var(--tt-accent-emerald)]',
  },
  {
    state: 'not_applicable',
    icon: CircleSlash,
    on: 'border-[var(--tt-accent-slate)] bg-[var(--tt-accent-slate-soft)] text-[var(--tt-accent-slate)]',
  },
];

/**
 * An item's four states as one group of buttons, named after the item: the one it is in is
 * pressed (a screen reader says so), and Tab, Enter and Space work them. A press on another
 * state changes it; the list it is in says the new state aloud. Two by two until there is room
 * for four in a row: a state's name is one long word in some languages (Tamil's are), and is
 * never cut or run into the next.
 */
export function StateControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: ChecklistState;
  disabled: boolean;
  onChange: (state: ChecklistState) => void;
}) {
  const { t } = useTranslation(NS);
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {STATES.map(({ state, icon: Icon, on }) => {
        const chosen = state === value;
        return (
          <button
            key={state}
            type="button"
            aria-pressed={chosen}
            aria-disabled={disabled || undefined}
            onClick={() => {
              if (!disabled && !chosen) onChange(state);
            }}
            className={cx(
              'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 text-center text-xs leading-tight font-semibold wrap-anywhere',
              chosen ? on : 'border-border bg-bg text-text hover:bg-surface',
              disabled && 'opacity-60',
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            {t(`checklist.states.${state}`)}
          </button>
        );
      })}
    </div>
  );
}
