import { animate, m, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useMemo } from 'react';

export interface AnimatedNumberProps {
  value: number;
  /** BCP 47 locale for grouping and digits (e.g. the UI language). */
  locale: string;
  /** Format as money in this ISO 4217 currency. */
  currency?: string | null;
  className?: string;
}

/** A figure that counts up to its value. Screen readers get only the final value. */
export function AnimatedNumber({ value, locale, currency, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const format = useMemo(() => {
    const formatter = new Intl.NumberFormat(
      locale,
      currency ? { style: 'currency', currency, maximumFractionDigits: 0 } : undefined,
    );
    return (n: number) => formatter.format(Math.round(n));
  }, [locale, currency]);
  const text = useTransform(count, format);

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return undefined;
    }
    const controls = animate(count, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => {
      controls.stop();
    };
  }, [count, value, reduceMotion]);

  return (
    <span className={className}>
      <m.span aria-hidden="true" className="tabular-nums">
        {text}
      </m.span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
