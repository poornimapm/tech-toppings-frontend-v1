import { api, unwrap, unwrapOnce } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type Goal = Schemas['GoalOut'];
export type GoalInput = Schemas['GoalIn'];
export type GoalFunding = Schemas['GoalFunding'];

const goalPath = (id: string) => ({ params: { path: { goal_id: id } } });

/** The user's goals, newest first, each with how far it has come. */
export function useGoals() {
  return usePages(['user', 'expenses', 'goals'], (page) =>
    unwrap(api.GET('/v1/expenses/goals', { params: { query: { page } } })),
  );
}

export interface SaveGoal {
  body: GoalInput;
  /** A new goal: sent as the Idempotency-Key, so a retry can't add it twice. */
  key?: string;
  /** An edit: the goal and the revision that was edited (a stale one is refused). */
  editing?: Pick<Goal, 'id' | 'revision_no'>;
}

/** Add a goal, or change one (the whole form is sent, so a cleared date is cleared). */
export function useSaveGoal() {
  return useChange(
    ({ body, key, editing }: SaveGoal) =>
      unwrap(
        editing
          ? api.PATCH('/v1/expenses/goals/{goal_id}', {
              ...goalPath(editing.id),
              body: { ...body, revision_no: editing.revision_no },
            })
          : api.POST('/v1/expenses/goals', {
              params: { header: { 'Idempotency-Key': key } },
              body,
            }),
      ),
    { quiet: true },
  );
}

export interface Contribute {
  id: string;
  /** Minor units; negative takes money out. */
  amount_minor: number;
  date: string;
  note: string | null;
  /** One per form, so a retried save adds the money once. */
  key: string;
}

/** Add money to a goal funded by hand, or take some out. `replayed`: an earlier send with this
 *  key had got through, so the goal holds what that one sent. */
export function useContribute() {
  return useChange(
    ({ id, key, ...body }: Contribute) =>
      unwrapOnce(
        api.POST('/v1/expenses/goals/{goal_id}/contributions', {
          params: { path: { goal_id: id }, header: { 'Idempotency-Key': key } },
          body,
        }),
      ),
    { quiet: true },
  );
}

export function useDeleteGoal() {
  return useChange((id: string) =>
    unwrap(api.DELETE('/v1/expenses/goals/{goal_id}', goalPath(id))),
  );
}

export function useUndeleteGoal() {
  return useChange((id: string) =>
    unwrap(api.POST('/v1/expenses/goals/{goal_id}/undelete', goalPath(id))),
  );
}
