import { slugOf } from '@/core/modules/registry';
import manifest from '@/modules/expenses/manifest';

/** Where the module's pages live (`/m/expenses/...`), for links between them. */
const base = `/m/${slugOf(manifest.key)}`;

/** What a chart's mark drills into: the entries list showing just that. */
export interface Drill {
  show?: 'expense' | 'income';
  from?: string;
  to?: string;
  category?: string;
  person?: string;
  merchant?: string;
}

export const paths = {
  entries: base,
  list: (drill: Drill) => {
    const query = new URLSearchParams(
      Object.entries(drill).filter((pair): pair is [string, string] => Boolean(pair[1])),
    );
    return `${base}?${query.toString()}`;
  },
  overview: `${base}/overview`,
  entry: (id: string) => `${base}/entries/${id}`,
  prices: `${base}/prices`,
  product: (id: string) => `${base}/prices/${id}`,
};
