import { useLayoutEffect, useRef, useState } from 'react';

/** Used until the chart has been measured (and in tests, where nothing has a size). */
const FALLBACK_WIDTH = 480;

/** A round number at or above `max`, so the axis reads 0 / 5 / 10 rather than 0 / 3.5 / 7. */
export function niceMax(max: number): number {
  if (max <= 4) return 4;
  return niceStep(max);
}

/** The round step (1, 2 or 5 times a power of ten) at or above `value`. */
function niceStep(value: number): number {
  const power = 10 ** Math.floor(Math.log10(value));
  const lead = value / power;
  return (lead <= 1 ? 1 : lead <= 2 ? 2 : lead <= 5 ? 5 : 10) * power;
}

/**
 * Round bounds around `low`..`high` with `steps` equal gaps: what a line chart needs when
 * its values sit far from zero (prices of ₹35 to ₹50 read on 30 / 40 / 50, not 0 / 25 / 50).
 */
export function niceRange(low: number, high: number, steps = 2): [number, number] {
  const spread = high - low || Math.abs(high) * 0.2 || 1;
  const step = niceStep(spread / steps);
  const bottom = Math.max(0, Math.floor(low / step) * step);
  return [bottom, Math.max(bottom + step * steps, Math.ceil(high / step) * step)];
}

/** The width a chart has to draw in, followed as its container resizes. */
export function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  // Before paint, so the chart is never drawn at the fallback width first.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      const measured = node.getBoundingClientRect().width;
      if (measured > 0) setWidth(measured);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, width] as const;
}
