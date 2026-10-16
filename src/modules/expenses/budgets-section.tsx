import { Plus, Target } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import { BudgetCard } from '@/modules/expenses/budget-card';
import { BudgetForm } from '@/modules/expenses/budget-form';
import { useBudgets, type Budget } from '@/modules/expenses/budgets-api';
import { NS } from '@/modules/expenses/i18n';

/** The Plan page's budgets: one card each, and adding or changing one in a dialog. */
export function BudgetsSection({ focus }: { focus: string | null }) {
  const { t } = useTranslation(NS);
  const budgets = useBudgets();
  // undefined: no dialog; null: a new budget.
  const [editing, setEditing] = useState<Budget | null | undefined>(undefined);
  const add = (
    <Button
      onClick={() => {
        setEditing(null);
      }}
    >
      <Plus aria-hidden="true" className="size-4" />
      {t('budgets.add')}
    </Button>
  );

  return (
    <section aria-labelledby="budgets-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="budgets-title" className="text-xl font-semibold">
          {t('budgets.title')}
        </h2>
        {budgets.data && budgets.data.length > 0 && add}
      </div>
      {budgets.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : budgets.isError ? (
        <LoadError onRetry={() => void budgets.refetch()}>{t('budgets.loadError')}</LoadError>
      ) : budgets.data.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t('budgets.emptyTitle')}
          body={t('budgets.emptyBody')}
          action={add}
        />
      ) : (
        <>
          <ul role="list" className="grid gap-4 md:grid-cols-2">
            {budgets.data.map((budget) => (
              <li key={budget.id} className="min-w-0">
                <BudgetCard
                  budget={budget}
                  focused={focus === budget.id}
                  onEdit={() => {
                    setEditing(budget);
                  }}
                />
              </li>
            ))}
          </ul>
          {budgets.hasNextPage && (
            <Button
              variant="secondary"
              disabled={budgets.isFetchingNextPage}
              onClick={() => void budgets.fetchNextPage()}
            >
              {t('list.more')}
            </Button>
          )}
        </>
      )}
      {editing !== undefined && (
        <BudgetForm
          // A fresh form for each budget opened.
          key={editing?.id ?? 'new'}
          budget={editing}
          onClose={() => {
            setEditing(undefined);
          }}
        />
      )}
    </section>
  );
}
