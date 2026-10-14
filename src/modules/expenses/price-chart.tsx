import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { niceRange, useMeasuredWidth } from '@/design-system';
import type { Purchase } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { seriesOf, type Priced, type Series } from '@/modules/expenses/price-series';
import { useUnitText } from '@/modules/expenses/units';

const HEIGHT = 220;
const PAD = { top: 16, right: 20, bottom: 28, left: 56 };
const DAY = 86_400_000;
// The series colours (price-series.ts), in order: written out in full so Tailwind finds them.
const STROKES = [
  'stroke-series-1',
  'stroke-series-2',
  'stroke-series-3',
  'stroke-series-4',
  'stroke-series-5',
];
const FILLS = ['fill-series-1', 'fill-series-2', 'fill-series-3', 'fill-series-4', 'fill-series-5'];
const SWATCHES = ['bg-series-1', 'bg-series-2', 'bg-series-3', 'bg-series-4', 'bg-series-5'];

/**
 * What a product cost per unit each time it was bought, a line per place. Pointing or arrow
 * keys move through the purchases and read each one out; the page lists them all as well, so
 * nothing depends on hovering or on colour.
 */
export function PriceChart({
  purchases,
  currency,
  unit,
  name,
}: {
  purchases: readonly Purchase[];
  currency: string;
  unit: string;
  name: string;
}) {
  const { t, i18n } = useTranslation(NS);
  const units = useUnitText();
  const [ref, width] = useMeasuredWidth();
  const [active, setActive] = useState<number | null>(null);
  const series = seriesOf(purchases);
  const points = series
    .flatMap((line, index) => line.points.map((point) => ({ point, slot: index })))
    .sort((a, b) => a.point.date.localeCompare(b.point.date));
  const last = points.length - 1;
  if (last < 0) return null;

  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const day = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });
  const placeOf = (line: Series) =>
    line.other ? t('product.otherPlaces') : (line.name ?? t('product.notNoted'));
  const times = points.map(({ point }) => displayDate(point.date).getTime());
  const prices = points.map(({ point }) => point.unit_price_minor);
  const [low, high] = niceRange(Math.min(...prices), Math.max(...prices));
  const first = times[0] ?? 0;
  const span = Math.max((times[last] ?? 0) - first, DAY);
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (time: number) =>
    PAD.left + (last === 0 ? innerWidth / 2 : ((time - first) / span) * innerWidth);
  const y = (minor: number) => PAD.top + innerHeight * (1 - (minor - low) / (high - low));
  const xy = (item: Priced) => [x(displayDate(item.date).getTime()), y(item.unit_price_minor)];
  const shown = active ?? last;
  const current = points[shown];
  const trend = points
    .map(({ point }, index) => `${index === 0 ? 'M' : 'L'}${xy(point).join(',')}`)
    .join(' ');

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const nearest = times.reduce(
      (best, time, index) =>
        Math.abs(x(time) - offset) < Math.abs(x(times[best] ?? 0) - offset) ? index : best,
      0,
    );
    setActive(nearest);
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

  const describe = ({ point, slot }: { point: Priced; slot: number }) =>
    [
      units.perUnit(point.unit_price_minor, currency, unit),
      day.format(displayDate(point.date)),
      series[slot] && placeOf(series[slot]),
    ].join(', ');

  return (
    <div>
      {series.length > 1 && (
        <ul role="list" className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {series.map((line, index) => (
            <li key={placeOf(line)} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${SWATCHES[index]}`} />
              {placeOf(line)}
              <span className="text-muted">({line.points.length})</span>
            </li>
          ))}
        </ul>
      )}
      {/* What the crosshair is on (the latest purchase until then); said by the slider too. */}
      {current && (
        <p aria-hidden="true" className="mb-1 flex flex-wrap items-center gap-x-2 text-sm">
          <span className={`size-2.5 rounded-full ${SWATCHES[current.slot] ?? ''}`} />
          <span className="font-semibold tabular-nums">
            {units.perUnit(current.point.unit_price_minor, currency, unit)}
          </span>
          <span className="text-muted">{describe(current).split(', ').slice(1).join(' · ')}</span>
        </p>
      )}
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={t('product.chartExplore', { name })}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={current ? describe(current) : ''}
        onPointerMove={onPointerMove}
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
          {[low, (low + high) / 2, high].map((tick) => (
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
                {money(tick)}
              </text>
            </g>
          ))}
          {active !== null && current && (
            <line
              x1={xy(current.point)[0]}
              x2={xy(current.point)[0]}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              className="stroke-muted"
            />
          )}
          {/* Every purchase in order, whatever the place: the trend when places alternate. */}
          <path
            d={trend}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="stroke-muted/60"
          />
          {series.map((line, index) => (
            <g key={placeOf(line)}>
              <path
                d={line.points
                  .map((point, at) => `${at === 0 ? 'M' : 'L'}${xy(point).join(',')}`)
                  .join(' ')}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={STROKES[index]}
              />
              {line.points.map((point) => (
                <circle
                  key={point.entry_id}
                  cx={xy(point)[0]}
                  cy={xy(point)[1]}
                  r={current?.point.entry_id === point.entry_id ? 6 : 4}
                  strokeWidth={2}
                  className={`${FILLS[index] ?? ''} stroke-surface`}
                />
              ))}
            </g>
          ))}
          <text x={PAD.left} y={HEIGHT - 8} className="fill-muted text-[11px]">
            {day.format(new Date(first))}
          </text>
          {last > 0 && (
            <text
              x={width - PAD.right}
              y={HEIGHT - 8}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {day.format(new Date(times[last] ?? first))}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
