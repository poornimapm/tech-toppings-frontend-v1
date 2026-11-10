import { Banknote, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState } from '@/design-system';
import { useBudget, useExpenses } from '@/modules/travel/budget-api';
import { BudgetForm } from '@/modules/travel/budget-form';
import { BudgetTotals, Categories, Unconverted } from '@/modules/travel/budget-summary';
import { ExpenseForm } from '@/modules/travel/expense-form';
import { ExpenseList } from '@/modules/travel/expense-list';
import { NS } from '@/modules/travel/i18n';
import { Part } from '@/modules/travel/part';
import { SharedCosts } from '@/modules/travel/shared-costs';
import { useTripContext } from '@/modules/travel/trip-context';
import { Waiting } from '@/modules/travel/waiting';

/**
 * The trip's money: its budget against what is estimated and what was really spent, by
 * category, in its own currency (a cost no rate could convert is said, and counted nowhere),
 * who owes whom of what was shared, and every cost, to add to and edit.
 */
export function BudgetTab() {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  const budget = useBudget(trip.id);
  const expenses = useExpenses(trip.id);
  // Open: the cost being edited (id null for a new one), or the trip's budget.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [budgeting, setBudgeting] = useState(false);
  const editingExpense = editing?.id
    ? (expenses.data?.find((each) => each.id === editing.id) ?? null)
    : null;

  return (
    <div className="space-y-4">
      {budget.data ? (
        <>
          <BudgetTotals
            budget={budget.data}
            onBudget={() => {
              setBudgeting(true);
            }}
          />
          <Unconverted budget={budget.data} />
          <Categories budget={budget.data} />
          <SharedCosts budget={budget.data} />
        </>
      ) : (
        <Waiting query={budget} failed={t('budget.loadError')} />
      )}
      <Part
        title={t('budget.costs')}
        action={
          <Button
            className="min-h-11"
            onClick={() => {
              setEditing({ id: null });
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t('budget.add')}
          </Button>
        }
      >
        {!expenses.data ? (
          <Waiting query={expenses} failed={t('budget.listError')} className="h-20 rounded-2xl" />
        ) : expenses.data.length === 0 ? (
          <EmptyState icon={Banknote} title={t('budget.noCosts')} body={t('budget.noCostsBody')} />
        ) : (
          <ExpenseList
            expenses={expenses.data}
            onEdit={(expense) => {
              setEditing({ id: expense.id });
            }}
          />
        )}
      </Part>
      {editing && (editing.id === null || editingExpense) && (
        <ExpenseForm
          key={`${editing.id ?? 'new'}-${String(editingExpense?.revision_no ?? 0)}`}
          expense={editingExpense}
          onClose={() => {
            setEditing(null);
          }}
          onReload={() => void expenses.refetch()}
        />
      )}
      {budgeting && (
        <BudgetForm
          key={trip.revision_no}
          onClose={() => {
            setBudgeting(false);
          }}
        />
      )}
    </div>
  );
}
