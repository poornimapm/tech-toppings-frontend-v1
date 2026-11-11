import { Lock } from 'lucide-react';
import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { Badge, type BadgeTone } from '@/design-system';
import type { TripMode } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';

/** Each mode, how its badge reads, in the order offered. */
const MODES: { mode: TripMode; tone: BadgeTone }[] = [
  { mode: 'static', tone: 'success' },
  { mode: 'basic', tone: 'beta' },
  { mode: 'premium', tone: 'locked' },
];

const CARD =
  'flex cursor-pointer flex-col gap-2 rounded-2xl border border-border bg-surface p-4 ' +
  'has-checked:border-primary has-checked:bg-primary/10 ' +
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--tt-focus)]';

/**
 * The trip's mode as cards, each saying plainly what it does today: Static works fully; Basic AI
 * drafts for the person to check, its use limited each day, and the trip works as Static
 * whenever AI isn't available; Premium is locked. A locked mode's radio is disabled, so neither a
 * tap nor the keyboard can choose it.
 */
export function ModeCards({
  field,
  premiumAvailable,
}: {
  field: UseFormRegisterReturn<'mode'>;
  premiumAvailable: boolean;
}) {
  const { t } = useTranslation(NS);
  const id = useId();
  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold">{t('new.mode.legend')}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map(({ mode, tone }) => {
          const locked = mode === 'premium' && !premiumAvailable;
          // Named by the mode alone, and described by what it does: the whole card is its label,
          // so a tap anywhere on it chooses it.
          return (
            <label key={mode} className={cx(CARD, locked && 'cursor-not-allowed opacity-75')}>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <input
                    {...field}
                    type="radio"
                    value={mode}
                    disabled={locked}
                    aria-labelledby={`${id}-${mode}-name`}
                    aria-describedby={`${id}-${mode}`}
                    className="size-4 accent-[var(--tt-primary)]"
                  />
                  <span id={`${id}-${mode}-name`}>{t(`trip.modes.${mode}`)}</span>
                </span>
                <Badge
                  tone={tone}
                  icon={locked ? <Lock aria-hidden="true" className="size-3" /> : undefined}
                >
                  {t(`new.mode.${mode}.badge`)}
                </Badge>
              </span>
              <span id={`${id}-${mode}`} className="text-sm text-muted">
                {t(`new.mode.${mode}.body`)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
