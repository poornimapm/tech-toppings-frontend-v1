import { cx } from '@/core/utils/cx';

/** `over` draws the bar in the second series colour; the words must say so too. */
export type MeterTone = 'default' | 'over';

export interface MeterProps {
  value: number;
  max: number;
  /** A point to compare with, drawn as a tick (e.g. where an even pace would be today). */
  marker?: number;
  tone?: MeterTone;
  /** What is measured, e.g. the budget's name. */
  label: string;
  /** The reading in words, e.g. "78% used: ₹6,200 of ₹8,000". */
  valueText: string;
  className?: string;
}

const share = (amount: number, max: number) =>
  max > 0 ? Math.min(100, Math.max(0, (amount / max) * 100)) : 0;

/**
 * How much of something is used (role="meter"): one hue, the second series colour only when it
 * is over. Screen readers get the reading in words; colour is never the only sign.
 */
export function Meter({
  value,
  max,
  marker,
  tone = 'default',
  label,
  valueText,
  className,
}: MeterProps) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      // A meter's value stays within its range; how far over is in the words.
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={valueText}
      className={cx('relative h-2.5 rounded-full bg-border/50', className)}
    >
      <div
        className={cx('h-full rounded-full', tone === 'over' ? 'bg-series-2' : 'bg-chart')}
        style={{ width: `${String(share(value, max))}%` }}
      />
      {marker !== undefined && (
        <div
          aria-hidden="true"
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-text"
          style={{ left: `${String(share(marker, max))}%` }}
        />
      )}
    </div>
  );
}
