import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { Badge, Button } from '@/design-system';
import { useRemoveExpense, type Expense } from '@/modules/travel/budget-api';
import { NS } from '@/modules/travel/i18n';
import { useActivities } from '@/modules/travel/plan-api';
import { useRemoval } from '@/modules/travel/removal';
import { useTripContext } from '@/modules/travel/trip-context';
import { dayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

/**
 * A trip's costs, each in the currency it was in: an estimate or what was spent, filed under
 * what, on which day, for which activity, who paid and who share it. Each can be edited, or
 * removed with a moment to take it back.
 */
export function ExpenseList({
  expenses,
  onEdit,
}: {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const words = useWords();
  const activities = useActivities(trip.id);
  const remove = useRemoveExpense();
  const removal = useRemoval(remove.mutateAsync);
  const name = (id: string) => trip.travellers.find((each) => each.id === id)?.name ?? id;
  const activity = (id: string | null) =>
    id && activities.data?.find((each) => each.id === id)?.title;

  return (
    <ul role="list" aria-label={t('budget.costs')} className="space-y-2">
      {expenses.map((expense) => {
        const facts = [
          words.category(expense.category),
          expense.day && dayOf(expense.day, i18n.language),
          activity(expense.activity_id),
          expense.paid_by && t('budget.paidBy', { name: name(expense.paid_by) }),
          expense.shared_with.length > 0 &&
            t('budget.sharedBy', { names: expense.shared_with.map(name).join(', ') }),
        ];
        return (
          <li key={expense.id} className="rounded-2xl border border-border bg-surface p-3">
            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium break-words">{expense.title}</span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(expense.amount_minor, expense.currency, i18n.language)}
                  </span>
                </p>
                <p className="text-sm break-words text-muted">
                  {facts.filter(Boolean).join(' · ')}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone={expense.kind === 'actual' ? 'success' : 'soon'}>
                    {t(`budget.kinds.${expense.kind}`)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                className="min-h-11 min-w-11"
                aria-label={t('budget.edit', { title: expense.title })}
                onClick={() => {
                  onEdit(expense);
                }}
              >
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 min-w-11"
                aria-label={t('budget.remove', { title: expense.title })}
                onClick={() =>
                  void removal(expense.id, t('budget.removed', { title: expense.title }))
                }
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
