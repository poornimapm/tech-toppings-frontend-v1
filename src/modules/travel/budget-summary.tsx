import { CircleAlert, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { formatMoney } from '@/core/utils/money';
import { Alert, Button, Meter, Table } from '@/design-system';
import type { Budget } from '@/modules/travel/budget-api';
import { NS } from '@/modules/travel/i18n';
import { Part } from '@/modules/travel/part';
import { useWords } from '@/modules/travel/words';

type Total = 'budget' | 'estimated' | 'spent' | 'left' | 'over';

/** The trip's money in one place: its budget (or that it has none), what is estimated and what
 *  was really spent, what is left or how far over, all in the trip's currency. */
export function BudgetTotals({ budget, onBudget }: { budget: Budget; onBudget: () => void }) {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number) => formatMoney(minor, budget.currency, i18n.language);
  const { budget_minor: limit, actual_minor: spent, remaining_minor: left } = budget;
  const over = left !== null && left < 0;
  const totals: [Total, string][] = [
    ['budget', limit === null ? t('budget.noBudget') : money(limit)],
    ['estimated', money(budget.estimated_minor)],
    ['spent', money(spent)],
    ...(left === null ? [] : [[over ? 'over' : 'left', money(Math.abs(left))] as [Total, string]]),
  ];

  return (
    <Part
      title={t('budget.summary')}
      action={
        <Button variant="secondary" className="min-h-11" onClick={onBudget}>
          <Pencil aria-hidden="true" className="size-4" />
          {t(limit === null ? 'budget.setBudget' : 'budget.changeBudget')}
        </Button>
      }
    >
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {totals.map(([key, value]) => (
          <div key={key} className="rounded-xl border border-border p-2">
            <dt className="text-xs text-muted">{t(`budget.${key}`)}</dt>
            <dd
              className={cx(
                'text-lg font-bold break-words tabular-nums',
                key === 'over' && 'text-danger',
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {limit !== null && limit > 0 && (
        <Meter
          value={spent}
          max={limit}
          tone={over ? 'over' : 'default'}
          label={t('budget.meter')}
          valueText={
            over
              ? t('budget.overText', {
                  spent: money(spent),
                  over: money(-left),
                  budget: money(limit),
                })
              : t('budget.meterText', { spent: money(spent), budget: money(limit) })
          }
        />
      )}
      <p className="text-sm text-muted">{t('budget.inCurrency', { currency: budget.currency })}</p>
    </Part>
  );
}

/** The costs no rate could convert, said plainly: they are in no total, and no rate is guessed. */
export function Unconverted({ budget }: { budget: Budget }) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  if (budget.unconverted.length === 0) return null;
  return (
    <Alert tone="info" className="space-y-2">
      <p className="flex items-center gap-1.5 font-semibold">
        <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        {t('budget.unconvertedTitle')}
      </p>
      <p>{t('budget.unconvertedIntro', { currency: budget.currency })}</p>
      <ul role="list" className="space-y-1">
        {budget.unconverted.map((cost) => (
          <li key={cost.expense_id}>
            <span className="font-medium break-words">
              {cost.title}: {formatMoney(cost.amount_minor, cost.currency, i18n.language)}
            </span>{' '}
            <span className="text-muted">
              · {t(`budget.kinds.${cost.kind}`)} · {words.category(cost.category)} ·{' '}
              {t(`budget.reasons.${cost.reason}`)}
            </span>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** Estimated against spent, category by category, in the order the app files them. */
export function Categories({ budget }: { budget: Budget }) {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  const money = (minor: number) => formatMoney(minor, budget.currency, i18n.language);
  if (budget.categories.length === 0) return null;
  return (
    <Part title={t('budget.byCategory')}>
      <Table
        caption={t('budget.byCategory')}
        rowKey={(line) => line.category}
        rows={budget.categories}
        columns={[
          {
            key: 'category',
            header: t('budget.category'),
            cell: (line) => words.category(line.category),
          },
          {
            key: 'estimated',
            header: t('budget.estimated'),
            cell: (line) => money(line.estimated_minor),
            className: 'tabular-nums',
          },
          {
            key: 'spent',
            header: t('budget.spent'),
            cell: (line) => money(line.actual_minor),
            className: 'tabular-nums',
          },
        ]}
      />
    </Part>
  );
}
