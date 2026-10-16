import { useQuery } from '@tanstack/react-query';

import { api, unwrap, unwrapOnce } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type Rule = Schemas['RuleOut'];
export type RuleInput = Schemas['RuleIn'];
export type RuleMode = Schemas['RuleMode'];
export type CadenceUnit = Schemas['CadenceUnit'];
export type Suggestion = Schemas['SuggestionOut'];

const root = ['user', 'expenses', 'recurring'] as const;
const rulePath = (id: string) => ({ params: { path: { rule_id: id } } });

/** What repeats and the user's bills, soonest due first. */
export function useRules() {
  return usePages([...root, 'rules'], (page) =>
    unwrap(api.GET('/v1/expenses/recurring', { params: { query: { page } } })),
  );
}

/** What looks like it repeats in the user's own entries. Only a hint: failing is quiet. */
export function useSuggestions() {
  return useQuery({
    queryKey: [...root, 'suggestions'] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/recurring/suggestions')),
  });
}

export interface SaveRule {
  body: RuleInput;
  /** The rule being changed; a new one without. */
  id?: string;
}

/** Add a rule (or confirm a suggestion: its signature is sent), or change one; the whole form
 *  is sent. */
export function useSaveRule() {
  return useChange(
    ({ body, id }: SaveRule) =>
      unwrap(
        id
          ? api.PATCH('/v1/expenses/recurring/{rule_id}', { ...rulePath(id), body })
          : api.POST('/v1/expenses/recurring', { body }),
      ),
    { quiet: true },
  );
}

/** Pause a rule (no entries, no reminders) or switch it back on. */
export function useSwitchRule() {
  return useChange(({ id, active }: { id: string; active: boolean }) =>
    unwrap(api.PATCH('/v1/expenses/recurring/{rule_id}', { ...rulePath(id), body: { active } })),
  );
}

export function useDeleteRule() {
  return useChange((id: string) =>
    unwrap(api.DELETE('/v1/expenses/recurring/{rule_id}', rulePath(id))),
  );
}

/** "Not regular": the suggestion is not made again. */
export function useDismissSuggestion() {
  return useChange((signature: string) =>
    unwrap(api.POST('/v1/expenses/recurring/suggestions/dismiss', { body: { signature } })),
  );
}

export interface MarkPaid {
  id: string;
  due_on: string;
  /** Minor units: what was paid, when not the usual amount. */
  amount_minor: number;
  date: string;
}

/** Mark a bill's due date paid: its entry is added once per due date (`replayed`: it was in
 *  already), and the bill moves on to the next. */
export function useMarkPaid() {
  return useChange(
    ({ id, ...body }: MarkPaid) =>
      unwrapOnce(api.POST('/v1/expenses/recurring/{rule_id}/mark-paid', { ...rulePath(id), body })),
    { quiet: true },
  );
}
