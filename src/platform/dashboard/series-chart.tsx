import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { SeriesData } from '@/core/dashboard/queries';
import { displayDate } from '@/core/utils/dates';

const HEIGHT = 184;
const PAD = { top: 18, right: 18, bottom: 26, left: 40 };
/** Used until the card has been measured (and in tests, where nothing has a size). */
const FALLBACK_WIDTH = 480;

/** A round number at or above `max`, so the axis reads 0 / 5 / 10 rather than 0 / 3.5 / 7. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(max));
  const lead = max / power;
  return (lead <= 1 ? 1 : lead <= 2 ? 2 : lead <= 5 ? 5 : 10) * power;
}

function useMeasuredWidth() {
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

/**
 * One value per day as an area chart. Pointing or arrow keys move a crosshair that reads out
 * the day under it; the same numbers are available as a table, so nothing depends on hovering
 * or on colour.
 */
export function SeriesChart({ data, title }: { data: SeriesData; title: string }) {
  const { t, i18n } = useTranslation();
  const [ref, width] = useMeasuredWidth();
  const [active, setActive] = useState<number | null>(null);
  const tableLabelId = useId();
  const points = data.points;
  const last = points.length - 1;
  if (last < 0) return null;

  const currency = data.format === 'currency' ? data.currency : null;
  const number = new Intl.NumberFormat(
    i18n.language,
    currency ? { style: 'currency', currency, maximumFractionDigits: 0 } : undefined,
  );
  const day = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });
  const dayOf = (index: number) => day.format(displayDate(points[index]?.day ?? ''));
  const valueOf = (index: number) => points[index]?.value ?? 0;

  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const top = niceMax(Math.max(...points.map((point) => point.value)));
  const x = (index: number) =>
    PAD.left + (last === 0 ? innerWidth / 2 : (index / last) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight * (1 - value / top);
  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`,
    )
    .join(' ');
  const shown = active ?? last;
  const total = points.reduce((sum, point) => sum + point.value, 0);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left - PAD.left;
    setActive(Math.min(last, Math.max(0, Math.round((offset / innerWidth) * last))));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = { ArrowLeft: shown - 1, ArrowRight: shown + 1, Home: 0, End: last }[event.key];
    if (target !== undefined) {
      event.preventDefault();
      setActive(Math.min(last, Math.max(0, target)));
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  }

  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight">{number.format(total)}</p>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={t('dashboard.chart.explore', { title })}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={`${dayOf(shown)}: ${number.format(valueOf(shown))}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setActive(null);
        }}
        onBlur={() => {
          setActive(null);
        }}
        onKeyDown={onKeyDown}
        className="relative mt-2 touch-pan-y overflow-hidden rounded-xl"
      >
        <svg aria-hidden="true" width={width} height={HEIGHT} className="block">
          {[0, top / 2, top].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
              />
              <text
                x={PAD.left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-muted text-[11px] tabular-nums"
              >
                {number.format(tick)}
              </text>
            </g>
          ))}
          <path d={`${line} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`} className="fill-chart/10" />
          <path
            d={line}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-chart"
          />
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className="stroke-muted" />
          )}
          <circle
            cx={x(shown)}
            cy={y(valueOf(shown))}
            r={5}
            strokeWidth={2}
            className="fill-chart stroke-surface"
          />
          <text x={PAD.left} y={HEIGHT - 6} className="fill-muted text-[11px]">
            {dayOf(0)}
          </text>
          {last > 0 && (
            <text
              x={width - PAD.right}
              y={HEIGHT - 6}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {dayOf(last)}
            </text>
          )}
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-surface px-2 py-1 text-xs whitespace-nowrap shadow-md"
            style={{ left: Math.min(width - 48, Math.max(48, x(active))) }}
          >
            <span className="font-semibold">{number.format(valueOf(active))}</span>
            <span className="ml-1.5 text-muted">{dayOf(active)}</span>
          </div>
        )}
      </div>
      <details className="mt-1 text-sm">
        <summary id={tableLabelId} className="cursor-pointer text-muted">
          {t('dashboard.chart.table')}
        </summary>
        <div
          role="group"
          aria-labelledby={tableLabelId}
          // Scrollable, so it must be reachable by keyboard.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="mt-2 max-h-48 overflow-auto rounded-lg"
        >
          <table className="w-full text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">
                  {t('dashboard.chart.day')}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t('dashboard.chart.value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={point.day} className="border-t border-border">
                  <td className="py-1">{dayOf(index)}</td>
                  <td className="py-1 text-right tabular-nums">{number.format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
