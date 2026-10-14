import { toMajor } from '@/core/utils/money';

/** Axis figures: short ("₹4.6K", "₹1.2L" in en-IN), as people read an axis. */
export function axisMoney(currency: string, language: string) {
  const format = new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  return (minor: number) => format.format(toMajor(minor, currency));
}

/**
 * A bar from the baseline to its value, rounded only at the value's end (4px, or less on a thin
 * bar), so every bar visibly stands on the same line.
 */
export function barPath(x: number, width: number, base: number, end: number): string {
  const radius = Math.min(4, width / 2, Math.abs(base - end));
  const up = end < base;
  const tip = up ? end + radius : end - radius;
  const corner = up ? -radius : radius;
  return [
    `M${String(x)},${String(base)}`,
    `L${String(x)},${String(tip)}`,
    `Q${String(x)},${String(end)} ${String(x + radius)},${String(end)}`,
    `L${String(x + width - radius)},${String(end)}`,
    `Q${String(x + width)},${String(end)} ${String(x + width)},${String(end - corner)}`,
    `L${String(x + width)},${String(base)}`,
    'Z',
  ].join(' ');
}
