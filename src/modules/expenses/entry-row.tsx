import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cx } from '@/core/utils/cx';
import { formatMoney } from '@/core/utils/money';
import { Button } from '@/design-system';
import type { Category, Entry } from '@/modules/expenses/api';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { NS } from '@/modules/expenses/i18n';

export interface EntryRowProps {
  entry: Entry;
  category: Category | undefined;
  categoryName: string;
  /** Given for a deleted entry: brings it back. */
  onUndelete?: (() => void) | undefined;
}

/** One entry in the list. The whole row opens it; money in is marked with a plus as well as
 *  a colour. */
export function EntryRow({ entry, category, categoryName, onUndelete }: EntryRowProps) {
  const { t, i18n } = useTranslation(NS);
  const income = entry.kind === 'income';
  const details = [
    categoryName,
    entry.merchant,
    entry.for_whom,
    ...entry.tags.map((tag) => `#${tag}`),
  ].filter(Boolean);

  return (
    <li className="relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface/70">
      <CategoryIcon category={category} />
      <div className="min-w-0 flex-1">
        <Link
          to={`entries/${entry.id}`}
          className="block truncate font-medium after:absolute after:inset-0 after:rounded-2xl"
        >
          {entry.title}
        </Link>
        <p className="truncate text-sm text-muted">{details.join(' · ')}</p>
      </div>
      <span className={cx('shrink-0 font-semibold tabular-nums', income && 'text-success')}>
        {income ? '+' : '−'}
        {formatMoney(entry.amount_minor, entry.currency, i18n.language)}
      </span>
      {onUndelete && (
        <Button variant="secondary" className="relative shrink-0" onClick={onUndelete}>
          {t('entry.undelete')}
        </Button>
      )}
    </li>
  );
}
