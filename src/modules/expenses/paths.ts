import { slugOf } from '@/core/modules/registry';
import manifest from '@/modules/expenses/manifest';

/** Where the module's pages live (`/m/expenses/...`), for links between them. */
const base = `/m/${slugOf(manifest.key)}`;

export const paths = {
  entries: base,
  entry: (id: string) => `${base}/entries/${id}`,
  prices: `${base}/prices`,
  product: (id: string) => `${base}/prices/${id}`,
};
