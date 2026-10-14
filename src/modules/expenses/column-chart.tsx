import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { formatMoney } from '@/core/utils/money';
import { niceMax, useMeasuredWidth } from '@/design-system';
import { axisMoney, barPath } from '@/modules/expenses/chart-kit';
import { NS } from '@/modules/expenses/i18n';

const HEIGHT = 196;
const PAD = { top: 12, right: 8, bottom: 26, left: 56 };
const GAP = 2; // surface between neighbouring bars
const WIDEST = 32;

export interface Column {
  key: string;
  /** The column's name in the readout and the table ("Oct 2", "Sep 2026"). */
  label: string;
  /** Minor units; below zero draws down from the baseline. */
  value: number;
  /** Where the column leads: the list of what makes it up. */
  to?: string;
}

/**
 * One amount per day or month as columns. Pointing or arrow keys move through them and read
 * each one out; a click or Enter opens what it is made of. Values below zero (an overspent
 * month) draw down in the second series colour, with the legend saying which is which. The
 * same numbers are a table too, with the same links.
 */
export function ColumnChart({
  columns,
  currency,
  name,
  below,
}: {
  columns: readonly Column[];
  currency: string;
  /** What the chart shows, for screen readers and the table's caption. */
  name: string;
  /** Legend words for a value below zero, when there can be one. */
  below?: { above: string; below: string };
}) {
  const { t, i18n } = useTranslation(NS);
  const navigate = useNavigate();
  const [ref, width] = useMeasuredWidth();
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const last = columns.length - 1;
  if (last < 0) return null;

  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const axis = axisMoney(currency, i18n.language);
  const values = columns.map((column) => column.value);
  const top = niceMax(Math.max(0, ...values));
  const bottom = Math.min(...values) < 0 ? -niceMax(-Math.min(...values)) : 0;
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const y = (value: number) => PAD.top + (innerHeight * (top - value)) / (top - bottom);
  const slot = innerWidth / columns.length;
  const barWidth = Math.max(2, Math.min(WIDEST, slot - GAP));
  const x = (index: number) => PAD.left + index * slot + (slot - barWidth) / 2;
  const shown = active ?? last;
  const current = columns[shown];

  const at = (clientX: number, element: Element) =>
    Math.min(
      last,
      Math.max(0, Math.floor((clientX - element.getBoundingClientRect().left - PAD.left) / slot)),
    );
  const open = (index: number) => {
    const target = columns[index]?.to;
    if (target) void navigate(target);
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = { ArrowLeft: shown - 1, ArrowRight: shown + 1, Home: 0, End: last }[event.key];
    if (target !== undefined) {
      event.preventDefault();
      setActive(Math.min(last, Math.max(0, target)));
    } else if (event.key === 'Enter') {
      open(shown);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  }

  return (
    <div>
      {below && (
        <ul role="list" className="mb-1 flex flex-wrap gap-x-4 text-sm">
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-chart" />
            {below.above}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-series-2" />
            {below.below}
          </li>
        </ul>
      )}
      {current && (
        <p aria-hidden="true" className="mb-1 text-sm">
          <span className="font-semibold tabular-nums">{money(current.value)}</span>
          <span className="ml-2 text-muted">{current.label}</span>
        </p>
      )}
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={current ? `${current.label}: ${money(current.value)}` : ''}
        aria-describedby={tableId}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          setActive(at(event.clientX, event.currentTarget));
        }}
        onPointerLeave={() => {
          setActive(null);
        }}
        onBlur={() => {
          setActive(null);
        }}
        onClick={(event) => {
          open(at(event.clientX, event.currentTarget));
        }}
        onKeyDown={onKeyDown}
        className="relative cursor-pointer touch-pan-y overflow-hidden rounded-xl"
      >
        <svg aria-hidden="true" width={width} height={HEIGHT} className="block">
          {[...new Set([bottom, 0, top])].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? 'stroke-muted' : 'stroke-border'}
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
          {columns.map((column, index) =>
            column.value === 0 ? null : (
              <path
                key={column.key}
                d={barPath(x(index), barWidth, y(0), y(column.value))}
                strokeWidth={index === active ? 1.5 : 0}
                className={`${column.value < 0 ? 'fill-series-2' : 'fill-chart'} stroke-text`}
              />
            ),
          )}
          <text x={PAD.left} y={HEIGHT - 6} className="fill-muted text-[11px]">
            {columns[0]?.label}
          </text>
          {last > 0 && (
            <text
              x={width - PAD.right}
              y={HEIGHT - 6}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {columns[last]?.label}
            </text>
          )}
        </svg>
      </div>
      <details className="mt-1 text-sm">
        <summary id={tableId} className="cursor-pointer text-muted">
          {t('overview.table')}
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{name}</caption>
          <tbody>
            {columns.map((column) => (
              <tr key={column.key} className="border-t border-border">
                <td className="py-1">
                  {column.to ? (
                    <Link
                      to={column.to}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {column.label}
                    </Link>
                  ) : (
                    column.label
                  )}
                </td>
                <td className="py-1 text-right tabular-nums">{money(column.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
