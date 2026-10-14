import type { Purchase } from '@/modules/expenses/api';

/** Series colours in tokens.css (--tt-series-1..5): past this many places, the least visited
 *  share the last one as "other places". */
export const SLOTS = 5;

export type Priced = Purchase & { unit_price_minor: number };
export interface Series {
  name: string | null; // a merchant; null = not noted
  other: boolean;
  points: Priced[];
}

/**
 * One line per place, in the order the places were first bought at: a place keeps its colour
 * however often it is visited later. Past five places, those found last share the fifth line
 * as "other places".
 */
export function seriesOf(purchases: readonly Purchase[]): Series[] {
  const priced = purchases.filter((item): item is Priced => item.unit_price_minor !== null);
  const places = [...new Set(priced.map((item) => item.merchant))];
  const own = places.length > SLOTS ? SLOTS - 1 : places.length;
  const named = places.slice(0, own);
  const series: Series[] = named.map((name) => ({
    name,
    other: false,
    points: priced.filter((item) => item.merchant === name),
  }));
  if (own < places.length) {
    const rest = priced.filter((item) => !named.includes(item.merchant));
    series.push({ name: null, other: true, points: rest });
  }
  return series;
}
