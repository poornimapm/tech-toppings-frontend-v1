import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { niceMax, useMeasuredWidth } from '@/design-system';
import { axisMoney } from '@/modules/expenses/chart-kit';
import { NS } from '@/modules/expenses/i18n';

const HEIGHT = 196;
const PAD = { top: 12, right: 12, bottom: 26, left: 56 };

interface RunningTotal {
  date: string;
  total_minor: number;
}

/** Where the line is heading: the projected total on the period's last day. */
export interface Projection {
  end: string;
  total_minor: number;
  days: number; // from the last point to the end
}

/**
 * The running total of a period day by day (solid), the same days of the period before
 * (dashed, muted) and, while the month isn't over, where it is heading (dashed). Pointing or
 * arrow keys read out a day; the legend names each line in words.
 */
export function RunningChart({
  points,
  previous,
  projection,
  currency,
  name,
  labels,
}: {
  points: readonly RunningTotal[];
  previous: readonly RunningTotal[];
  projection?: Projection | undefined;
  currency: string;
  name: string;
  labels: { now: string; before: string; heading: string };
}) {
  const { i18n } = useTranslation(NS);
  const [ref, width] = useMeasuredWidth();
  const [active, setActive] = useState<number | null>(null);
  const days = Math.max(points.length + (projection?.days ?? 0), previous.length, 1);
  const last = points.length - 1;
  if (last < 0) return null;

  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const axis = axisMoney(currency, i18n.language);
  const day = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });
  const top = niceMax(
    Math.max(
      ...points.map((point) => point.total_minor),
      ...previous.map((point) => point.total_minor),
      projection?.total_minor ?? 0,
    ),
  );
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (days === 1 ? 0 : (index / (days - 1)) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight * (1 - value / top);
  const line = (items: readonly RunningTotal[]) =>
    items
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${String(x(index))},${String(y(point.total_minor))}`,
      )
      .join(' ');
  const shown = active ?? last;
  const now = points[Math.min(shown, last)];
  const before = previous[shown];
  const lastPoint = points[last];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = { ArrowLeft: shown - 1, ArrowRight: shown + 1, Home: 0, End: last }[event.key];
    if (target !== undefined) {
      event.preventDefault();
      setActive(Math.min(last, Math.max(0, target)));
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  }

  const readout = [
    now && `${day.format(displayDate(now.date))}: ${money(now.total_minor)}`,
    before && `${labels.before}: ${money(before.total_minor)}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const legend = [
    { label: labels.now, className: 'border-chart' },
    { label: labels.before, className: 'border-muted border-dashed' },
    ...(projection ? [{ label: labels.heading, className: 'border-chart border-dashed' }] : []),
  ];

  return (
    <div>
      <ul role="list" className="mb-1 flex flex-wrap gap-x-4 text-sm">
        {legend.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`w-4 border-t-2 ${item.className}`} />
            {item.label}
          </li>
        ))}
      </ul>
      <p aria-hidden="true" className="mb-1 text-sm text-muted">
        {readout}
      </p>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={readout}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          const offset =
            event.clientX - event.currentTarget.getBoundingClientRect().left - PAD.left;
          setActive(Math.min(last, Math.max(0, Math.round((offset / innerWidth) * (days - 1)))));
        }}
        onPointerLeave={() => {
          setActive(null);
        }}
        onBlur={() => {
          setActive(null);
        }}
        onKeyDown={onKeyDown}
        className="relative touch-pan-y overflow-hidden rounded-xl"
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
                {axis(tick)}
              </text>
            </g>
          ))}
          <path
            d={line(previous)}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="stroke-muted"
          />
          {projection && lastPoint && (
            <path
              d={`M${String(x(last))},${String(y(lastPoint.total_minor))} L${String(x(last + projection.days))},${String(y(projection.total_minor))}`}
              fill="none"
              strokeWidth={2}
              strokeDasharray="6 4"
              className="stroke-chart"
            />
          )}
          <path
            d={line(points)}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            className="stroke-chart"
          />
          {now && (
            <circle
              cx={x(Math.min(shown, last))}
              cy={y(now.total_minor)}
              r={5}
              strokeWidth={2}
              className="fill-chart stroke-surface"
            />
          )}
          <text x={PAD.left} y={HEIGHT - 6} className="fill-muted text-[11px]">
            {points[0] && day.format(displayDate(points[0].date))}
          </text>
          <text
            x={width - PAD.right}
            y={HEIGHT - 6}
            textAnchor="end"
            className="fill-muted text-[11px]"
          >
            {day.format(displayDate(projection?.end ?? lastPoint?.date ?? points[0]?.date ?? ''))}
          </text>
        </svg>
      </div>
    </div>
  );
}
