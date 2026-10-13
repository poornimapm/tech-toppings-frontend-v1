import type { CSSProperties } from 'react';

import { ACCENTS } from '@/core/modules/types';
import { cx } from '@/core/utils/cx';
import type { Category } from '@/modules/expenses/api';

/** The category's emoji on its colour. Decorative: its name is always written beside it. */
export function CategoryIcon({
  category,
  className,
}: {
  category: Category | undefined;
  className?: string;
}) {
  const accent = ACCENTS.find((name) => name === category?.accent) ?? 'slate';
  const style: CSSProperties = {
    background: `var(--tt-accent-${accent}-soft)`,
    color: `var(--tt-accent-${accent})`,
  };
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cx('grid size-10 shrink-0 place-items-center rounded-2xl text-lg', className)}
    >
      {category?.icon ?? '🏷️'}
    </span>
  );
}
