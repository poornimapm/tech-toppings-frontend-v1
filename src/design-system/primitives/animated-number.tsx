import { useEffect, useMemo, useRef, useState } from 'react';

import { useMediaQuery } from '@/core/utils/use-media-query';

export interface AnimatedNumberProps {
  value: number;
  /** BCP 47 locale for grouping and digits (e.g. the UI language). */
  locale: string;
  /** Format as money in this ISO 4217 currency. */
  currency?: string | null;
  className?: string;
}

const DURATION_MS = 900;
/** Quick start, gentle landing (close to the cubic-bezier(0.16, 1, 0.3, 1) it replaces). */
const easeOut = (progress: number) => 1 - (1 - progress) ** 4;

/** A figure that counts up to its value. Screen readers get only the final value. A few lines
 *  of requestAnimationFrame, so pages that show figures load no animation engine for it. */
export function AnimatedNumber({ value, locale, currency, className }: AnimatedNumberProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [counted, setCounted] = useState(0);
  /** Where the count is now: a new value counts on from there. */
  const current = useRef(0);
  const format = useMemo(() => {
    const formatter = new Intl.NumberFormat(
      locale,
      currency ? { style: 'currency', currency, maximumFractionDigits: 0 } : undefined,
    );
    return (n: number) => formatter.format(Math.round(n));
  }, [locale, currency]);

  useEffect(() => {
    if (reduceMotion) {
      current.current = value;
      return undefined;
    }
    const from = current.current;
    let start: number | undefined; // the first frame's time: frames carry their own clock
    let frame = requestAnimationFrame(function step(now) {
      start ??= now;
      const progress = Math.min((now - start) / DURATION_MS, 1);
      current.current = from + (value - from) * easeOut(progress);
      setCounted(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, reduceMotion]);

  return (
    <span className={className}>
      <span aria-hidden="true">{format(reduceMotion ? value : counted)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
