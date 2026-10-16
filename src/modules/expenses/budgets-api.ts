import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type Budget = Schemas['BudgetOut'];
export type BudgetInput = Schemas['BudgetIn'];
export type BudgetScope = Schemas['BudgetScope'];
export type BudgetPeriod = Schemas['BudgetPeriod'];

/** The user's budgets, newest first, each with how it stands today. */
export function useBudgets() {
  return usePages(['user', 'expenses', 'budgets'], (page) =>
    unwrap(api.GET('/v1/expenses/budgets', { params: { query: { page } } })),
  );
}

export interface SaveBudget {
  body: BudgetInput;
  /** The budget being edited; a new one without. */
  id?: string;
}

/** Add a budget, or change one (the whole form is sent, so cleared fields are cleared). */
export function useSaveBudget() {
  return useChange(
    ({ body, id }: SaveBudget) =>
      unwrap(
        id
          ? api.PATCH('/v1/expenses/budgets/{budget_id}', {
              params: { path: { budget_id: id } },
              body,
            })
          : api.POST('/v1/expenses/budgets', { body }),
      ),
    { quiet: true },
  );
}

export function useDeleteBudget() {
  return useChange((id: string) =>
    unwrap(api.DELETE('/v1/expenses/budgets/{budget_id}', { params: { path: { budget_id: id } } })),
  );
}
