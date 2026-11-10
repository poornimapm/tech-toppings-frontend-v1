import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { travelKeys, tripPath, useTravelChange } from '@/modules/travel/api';

type Schemas = components['schemas'];
export type Expense = Schemas['TravelExpenseOut'];
export type ExpenseInput = Schemas['TravelExpenseIn'];
export type ExpensePatch = Schemas['TravelExpensePatch'];
export type ExpenseKind = Schemas['ExpenseKind'];
export type Budget = Schemas['TravelBudgetOut'];

const expensePath = (expense_id: string) => ({ params: { path: { expense_id } } });

/** A trip's estimates and actual costs, each in the currency it was in, by day. */
export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: travelKeys.expenses(tripId),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/expenses', tripPath(tripId))),
  });
}

/** Estimated against spent by category in the trip's currency, and who owes whom: worked out by
 *  the server, which lists what it had no rate for rather than guess one. */
export function useBudget(tripId: string) {
  return useQuery({
    queryKey: travelKeys.budget(tripId),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/budget', tripPath(tripId))),
  });
}

/** A new cost, sent with one key however often it is tried. */
export function useAddExpense(tripId: string) {
  return useTravelChange(({ body, key }: { body: ExpenseInput; key: string }) =>
    unwrap(
      api.POST('/v1/travel/trips/{trip_id}/expenses', {
        ...tripPath(tripId),
        body,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  );
}

/** An edit, as of the revision seen: changed elsewhere since, it's refused (VERSION_CONFLICT). */
export function useEditExpense() {
  return useTravelChange(({ id, body }: { id: string; body: ExpensePatch }) =>
    unwrap(api.PATCH('/v1/travel/expenses/{expense_id}', { ...expensePath(id), body })),
  );
}

/** Removed; its history event takes it back. */
export function useRemoveExpense() {
  return useTravelChange((id: string) =>
    unwrap(api.DELETE('/v1/travel/expenses/{expense_id}', expensePath(id))),
  );
}
