import type { CSSProperties } from 'react';

import { slugOf } from '@/core/modules/registry';
import type { ModuleTile } from '@/core/modules/types';

/** CSS variables that point the `tile` / `tile-soft` colours at the module's accent pair. */
export function accentStyle(tile: ModuleTile): CSSProperties {
  const accent = tile.definition.accent;
  return {
    '--tile-accent': `var(--tt-accent-${accent})`,
    '--tile-soft': `var(--tt-accent-${accent}-soft)`,
  } as CSSProperties;
}

/** Can the module's own pages be opened from here? */
export function isOpenable(tile: ModuleTile): boolean {
  return tile.view.available && Boolean(tile.definition.routes?.length);
}

/** Where "open" takes a module: its pages when it has them, otherwise its details. */
export function moduleHref(tile: ModuleTile, page = ''): string {
  if (!isOpenable(tile)) return `/?module=${tile.view.key}`;
  return [`/m/${slugOf(tile.view.key)}`, page].filter(Boolean).join('/');
}
