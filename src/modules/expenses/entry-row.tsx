import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cx } from '@/core/utils/cx';
import { formatMoney } from '@/core/utils/money';
import { Button } from '@/design-system';
import type { Category, Entry } from '@/modules/expenses/api';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';
import { useUnitText } from '@/modules/expenses/units';

export interface EntryRowProps {
  entry: Entry;
  category: Category | undefined;
  categoryName: string;
  /** Given for a deleted entry: brings it back. */
  onUndelete?: (() => void) | undefined;
  /** Given while choosing entries for a bulk change: a box to tick, above the row's link. */
  selection?: { selected: boolean; onToggle: () => void } | undefined;
}

/** One entry in the list. The whole row opens it; money in is marked with a plus as well as
 *  a colour. */
export function EntryRow({ entry, category, categoryName, onUndelete, selection }: EntryRowProps) {
  const { t, i18n } = useTranslation(NS);
  const unitText = useUnitText();
  const income = entry.kind === 'income';
  const details = [
    entry.quantity && entry.unit && unitText.quantity(entry.quantity, entry.unit),
    categoryName,
    entry.merchant,
    entry.for_whom,
    ...entry.tags.map((tag) => `#${tag}`),
  ].filter(Boolean);

  return (
    <li
      className={cx(
        'relative flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface/70',
        selection?.selected && 'bg-primary/10',
      )}
    >
      {selection && (
        <input
          type="checkbox"
          aria-label={t('bulk.selectLabel', { title: entry.title })}
          checked={selection.selected}
          onChange={selection.onToggle}
          className="relative z-10 size-5 shrink-0 accent-primary"
        />
      )}
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
      {entry.recurring_id && (
        // Above the row's own link, so it opens the rule rather than the entry.
        <Link
          to={paths.plan('bills', entry.recurring_id)}
          aria-label={t('entry.repeatsLabel', { title: entry.title })}
          title={t('entry.repeats')}
          className="relative shrink-0 rounded-full p-1 text-muted hover:text-primary"
        >
          <Repeat aria-hidden="true" className="size-4" />
        </Link>
      )}
      <span className="flex shrink-0 flex-col items-end">
        <span className={cx('font-semibold tabular-nums', income && 'text-success')}>
          {income ? '+' : '−'}
          {formatMoney(entry.amount_minor, entry.currency, i18n.language)}
        </span>
        {/* Paid in another currency: what it counts as in the totals. */}
        {entry.base_currency &&
          entry.base_currency !== entry.currency &&
          typeof entry.amount_base_minor === 'number' && (
            <span className="text-xs text-muted tabular-nums">
              {t('entry.counted', {
                amount: formatMoney(entry.amount_base_minor, entry.base_currency, i18n.language),
              })}
            </span>
          )}
      </span>
      {onUndelete && (
        <Button variant="secondary" className="relative shrink-0" onClick={onUndelete}>
          {t('entry.undelete')}
        </Button>
      )}
    </li>
  );
}
