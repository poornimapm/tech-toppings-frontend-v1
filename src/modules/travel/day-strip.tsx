import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { NS } from '@/modules/travel/i18n';
import { weekdayOf } from '@/modules/travel/trip-words';

/**
 * The trip's days as a strip that scrolls sideways, each with its number, date and how much is
 * planned on it. The chosen one is pressed and scrolled into view.
 */
export function DayStrip({
  days,
  counts,
  value,
  onChange,
}: {
  days: string[];
  counts: Map<string, number>;
  value: string;
  onChange: (day: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const chosen = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    chosen.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [value]);

  return (
    <div
      role="group"
      aria-label={t('itinerary.days')}
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
    >
      {days.map((day, index) => {
        const pressed = day === value;
        const count = counts.get(day) ?? 0;
        return (
          <button
            key={day}
            ref={pressed ? chosen : undefined}
            type="button"
            aria-pressed={pressed}
            onClick={() => {
              onChange(day);
            }}
            className={cx(
              'flex min-h-14 shrink-0 flex-col items-start rounded-2xl border px-3 py-2 text-left text-sm',
              pressed
                ? 'border-primary bg-primary/10 font-semibold text-primary'
                : 'border-border bg-surface hover:bg-bg',
            )}
          >
            <span>{t('itinerary.day', { number: index + 1 })}</span>
            <span className="text-xs">{weekdayOf(day, i18n.language)}</span>
            <span className="text-xs text-muted">{t('itinerary.planned', { count })}</span>
          </button>
        );
      })}
    </div>
  );
}
