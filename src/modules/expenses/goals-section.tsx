import { PiggyBank, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import { ContributionForm } from '@/modules/expenses/contribution-form';
import { GoalCard, type MoneyMode } from '@/modules/expenses/goal-card';
import { GoalForm } from '@/modules/expenses/goal-form';
import { useGoals, type Goal } from '@/modules/expenses/goals-api';
import { NS } from '@/modules/expenses/i18n';

/** The Plan page's goals: one card each, and adding, changing or putting money in, in a dialog. */
export function GoalsSection({ focus }: { focus: string | null }) {
  const { t } = useTranslation(NS);
  const goals = useGoals();
  // undefined: no dialog; null: a new goal; else the id of the goal being changed.
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [money, setMoney] = useState<{ id: string; mode: MoneyMode } | null>(null);
  // Looked up as the list now is, so a reload brings an open dialog the latest revision.
  const find = (id: string): Goal | undefined => goals.data?.find((goal) => goal.id === id);
  const edited = typeof editing === 'string' ? find(editing) : editing;
  const moneyFor = money && find(money.id);
  const add = (
    <Button
      onClick={() => {
        setEditing(null);
      }}
    >
      <Plus aria-hidden="true" className="size-4" />
      {t('goals.add')}
    </Button>
  );

  return (
    <section aria-labelledby="goals-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="goals-title" className="text-xl font-semibold">
          {t('goals.title')}
        </h2>
        {goals.data && goals.data.length > 0 && add}
      </div>
      {goals.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : goals.isError ? (
        <LoadError onRetry={() => void goals.refetch()}>{t('goals.loadError')}</LoadError>
      ) : goals.data.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={t('goals.emptyTitle')}
          body={t('goals.emptyBody')}
          action={add}
        />
      ) : (
        <>
          <ul role="list" className="grid gap-4 md:grid-cols-2">
            {goals.data.map((goal) => (
              <li key={goal.id} className="min-w-0">
                <GoalCard
                  goal={goal}
                  focused={focus === goal.id}
                  onEdit={() => {
                    setEditing(goal.id);
                  }}
                  onMoney={(mode) => {
                    setMoney({ id: goal.id, mode });
                  }}
                />
              </li>
            ))}
          </ul>
          {goals.hasNextPage && (
            <Button
              variant="secondary"
              disabled={goals.isFetchingNextPage}
              onClick={() => void goals.fetchNextPage()}
            >
              {t('list.more')}
            </Button>
          )}
        </>
      )}
      {edited !== undefined && (
        <GoalForm
          // A fresh form for each goal opened, and again once it is reloaded at a newer revision.
          key={edited ? `${edited.id}-${String(edited.revision_no)}` : 'new'}
          goal={edited}
          onClose={() => {
            setEditing(undefined);
          }}
          onReload={() => void goals.refetch()}
        />
      )}
      {money && moneyFor && (
        <ContributionForm
          // Not keyed by revision: the form keeps its Idempotency-Key while the goal refreshes.
          key={`${money.id}-${money.mode}`}
          goal={moneyFor}
          mode={money.mode}
          onClose={() => {
            setMoney(null);
          }}
        />
      )}
    </section>
  );
}
