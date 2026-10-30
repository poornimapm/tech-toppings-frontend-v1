import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { userKeys } from '@/core/auth/queries';
import i18n, { errorKey } from '@/core/i18n';
import { toast } from '@/design-system';

export type Receipt = components['schemas']['ReceiptsItemOut'];
export type ReceiptInput = components['schemas']['ReceiptsItemIn'];
export type ReceiptOptions = components['schemas']['ReceiptsOptions'];
export type WarrantyStatus = components['schemas']['WarrantyStatus'];

/** As long as the API lets a receipt's name be (TEXT_MAX in the backend module's schemas.py). */
export const TEXT_MAX = 200;
const receiptsKey = [...userKeys.all, 'receipts'] as const;

export interface ReceiptFilters {
  warranty?: WarrantyStatus;
  q?: string;
}

/** The user's receipts, latest bought first, a page at a time ("show more"). */
export function useReceipts(filters: ReceiptFilters) {
  return usePages([...receiptsKey, 'items', filters], (page) =>
    unwrap(api.GET('/v1/receipts/items', { params: { query: { page, ...filters } } })),
  );
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: [...receiptsKey, 'item', id],
    queryFn: () =>
      unwrap(api.GET('/v1/receipts/items/{item_id}', { params: { path: { item_id: id ?? '' } } })),
    enabled: id !== undefined,
  });
}

/** What the form offers and starts with: the server's, so the two never disagree. */
export function useReceiptOptions() {
  return useQuery({
    queryKey: [...receiptsKey, 'options'],
    queryFn: () => unwrap(api.GET('/v1/receipts/options')),
    staleTime: Infinity,
  });
}

/** A failure's code, for the form to say what went wrong. */
export function failureCode(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.code : 'UNKNOWN';
}

/** Keep a new receipt or change one; everything of the user's is refreshed after (the tile, the
 *  dashboard and the reminders count receipts too). Failures are the form's to show. */
export function useSaveReceipt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ReceiptInput }) =>
      unwrap(
        id
          ? api.PATCH('/v1/receipts/items/{item_id}', { params: { path: { item_id: id } }, body })
          : api.POST('/v1/receipts/items', { body }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteReceipt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/v1/receipts/items/{item_id}', { params: { path: { item_id: id } } })),
    // Not awaited: the page showing the deleted receipt leaves before its refetch could fail.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast(i18n.t(errorKey(failureCode(error) ?? 'UNKNOWN'), { ns: 'errors' }), {
        tone: 'danger',
      });
    },
  });
}
