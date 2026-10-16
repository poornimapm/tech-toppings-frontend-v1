import { slugOf } from '@/core/modules/registry';
import manifest from '@/modules/expenses/manifest';

/** Where the module's pages live (`/m/expenses/...`), for links between them. */
const base = `/m/${slugOf(manifest.key)}`;

/** What a chart's mark or a budget drills into: the entries list showing just that. */
export interface Drill {
  show?: 'expense' | 'income';
  from?: string;
  to?: string;
  category?: string;
  tag?: string;
  person?: string;
  merchant?: string;
}

/** A query string of the values given (empty ones left out), with its `?`. */
function query(values: Record<string, string | undefined>): string {
  const found = new URLSearchParams(
    Object.entries(values).filter((pair): pair is [string, string] => Boolean(pair[1])),
  ).toString();
  return found ? `?${found}` : '';
}

/** The Plan page's sections, kept in its `?show`. */
export type PlanSection = 'budgets' | 'bills' | 'goals' | 'loans';

export const paths = {
  entries: base,
  list: (drill: Drill) => `${base}${query({ ...drill })}`,
  overview: `${base}/overview`,
  entry: (id: string) => `${base}/entries/${id}`,
  prices: `${base}/prices`,
  product: (id: string) => `${base}/prices/${id}`,
  /** The Plan page, on a section, with one of its cards picked out (`focus`). */
  plan: (show?: PlanSection, focus?: string) => `${base}/plan${query({ show, focus })}`,
};
