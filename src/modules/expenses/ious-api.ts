import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type Iou = Schemas['IouOut'];
export type IouDirection = Schemas['IouDirection'];
export type IouInput = Schemas['IouIn'];
export type PersonBalance = Schemas['PersonBalance'];

const root = ['user', 'expenses', 'ious'] as const;
const iouPath = (id: string) => ({ params: { path: { iou_id: id } } });

/** What is owed to the user and what they owe, in all and by person. */
export function useIouSummary() {
  return useQuery({
    queryKey: [...root, 'summary'] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/ious/summary')),
  });
}

/** One person's loans (`person` is their name as compared), open and paid back, most recently
 *  lent first. */
export function usePersonIous(person: string) {
  return usePages([...root, 'person', person], (page) =>
    unwrap(api.GET('/v1/expenses/ious', { params: { query: { state: 'all', person, page } } })),
  );
}

/** One loan, once there is an id: a notification's link names the loan, not the person. */
export function useIou(id: string | null) {
  return useQuery({
    queryKey: [...root, 'one', id] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/ious/{iou_id}', iouPath(id ?? ''))),
    enabled: id !== null,
  });
}

/** One person's loans not yet paid back in full, oldest first: what a payment from or to them
 *  can go towards. Nothing is asked until there is a name. */
export function useOpenIous(person: string) {
  return useQuery({
    queryKey: [...root, 'open', person] as const,
    queryFn: async () => {
      const page = await unwrap(
        api.GET('/v1/expenses/ious', {
          params: { query: { state: 'open', person, page_size: 100 } },
        }),
      );
      return [...page.items].reverse(); // the server lists the most recently lent first
    },
    enabled: person !== '',
  });
}

export interface SaveIou {
  body: IouInput;
  /** A new loan: sent as the Idempotency-Key, so a retried save notes it once. */
  key?: string;
  /** An edit: the loan and the revision that was edited (a stale one is refused). */
  editing?: Pick<Iou, 'id' | 'revision_no'>;
}

/** Note money lent or borrowed, or change a loan (the whole form is sent, so a cleared due date
 *  is cleared). */
export function useSaveIou() {
  return useChange(
    ({ body, key, editing }: SaveIou) =>
      unwrap(
        editing
          ? api.PATCH('/v1/expenses/ious/{iou_id}', {
              ...iouPath(editing.id),
              body: { ...body, revision_no: editing.revision_no },
            })
          : api.POST('/v1/expenses/ious', {
              params: { header: { 'Idempotency-Key': key } },
              body,
            }),
      ),
    { quiet: true },
  );
}

export interface Settle {
  id: string;
  /** Minor units paid back; negative to correct a payment. */
  amount_minor: number;
  date: string;
  note?: string | null;
  /** One per payment, so a retried save counts it once. */
  key: string;
}

/** Record money paid back on a loan, or correct a payment. */
export function useSettle() {
  return useChange(
    ({ id, key, ...body }: Settle) =>
      unwrap(
        api.POST('/v1/expenses/ious/{iou_id}/settlements', {
          params: { path: { iou_id: id }, header: { 'Idempotency-Key': key } },
          body,
        }),
      ),
    { quiet: true },
  );
}

/** Delete a loan; a failure is said where the user asked (the person sheet). */
export function useDeleteIou() {
  return useChange((id: string) => unwrap(api.DELETE('/v1/expenses/ious/{iou_id}', iouPath(id))), {
    quiet: true,
  });
}

/** What is left on the loan, when a payment was refused for being more than that (it can be
 *  less than the page knew: a payment saved on another device). */
export function leftWhenTooMuch(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'EXPENSE_SETTLEMENT_INVALID') return null;
  const details = error.details as { reason?: string; outstanding_minor?: number } | null;
  return details?.reason === 'too_much' && typeof details.outstanding_minor === 'number'
    ? details.outstanding_minor
    : null;
}
