import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { userKeys } from '@/core/auth/queries';
import i18n, { errorKey } from '@/core/i18n';
import { toast } from '@/design-system';

type Schemas = components['schemas'];
export type Entry = Schemas['EntryOut'];
export type EntryInput = Schemas['EntryIn'];
export type EntryKind = Schemas['EntryKind'];
export type Category = Schemas['CategoryOut'];
export type Revision = Schemas['RevisionOut'];
export type Unit = Schemas['UnitOut'];
export type Product = Schemas['ProductOut'];
export type ProductSummary = Schemas['ProductSummary'];
export type ProductDetail = Schemas['ProductDetail'];
export type ProductPatch = Schemas['ProductPatch'];
export type Purchase = Schemas['Purchase'];

export const PAYMENT_MODES = [
  'cash',
  'upi',
  'card',
  'bank',
  'wallet',
  'other',
] as const satisfies readonly Schemas['PaymentMode'][];

export interface EntryFilters {
  kind?: EntryKind;
  from?: string;
  to?: string;
  category_id?: string;
  q?: string;
  deleted?: boolean;
}

/** Under ['user', ...] so signing out drops it with the rest of the user's data. */
const root = ['user', 'expenses'] as const;

export function useEntries(filters: EntryFilters) {
  return usePages([...root, 'entries', filters], (page) =>
    unwrap(api.GET('/v1/expenses/entries', { params: { query: { ...filters, page } } })),
  );
}

/** Totals of everything the filters match (not just the pages loaded so far), per currency. */
export function useSummary(filters: EntryFilters) {
  return useQuery({
    queryKey: [...root, 'summary', filters] as const,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/expenses/entries/summary', { params: { query: filters } })))
        .totals,
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: [...root, 'entry', id] as const,
    queryFn: () =>
      unwrap(api.GET('/v1/expenses/entries/{entry_id}', { params: { path: { entry_id: id } } })),
  });
}

export function useRevisions(id: string) {
  return usePages([...root, 'revisions', id], (page) =>
    unwrap(
      api.GET('/v1/expenses/entries/{entry_id}/revisions', {
        params: { path: { entry_id: id }, query: { page } },
      }),
    ),
  );
}

export function useCategories() {
  return useQuery({
    queryKey: [...root, 'categories'] as const,
    queryFn: async () => (await unwrap(api.GET('/v1/expenses/categories'))).items,
  });
}

/** Units a quantity can be in; they change only with a new release. */
export function useUnits() {
  return useQuery({
    queryKey: [...root, 'units'] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/units')),
    staleTime: Infinity,
  });
}

/** What the user buys, recently bought first; with `title`, only the product that claims it. */
export function useProducts(title?: string) {
  return usePages([...root, 'products', title ?? null], (page) =>
    unwrap(
      api.GET('/v1/expenses/products', {
        params: { query: { page, ...(title ? { title } : {}) } },
      }),
    ),
  );
}

export function useProduct(id: string, range: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...root, 'product', id, range] as const,
    queryFn: () =>
      unwrap(
        api.GET('/v1/expenses/products/{product_id}', {
          params: { path: { product_id: id }, query: range },
        }),
      ),
  });
}

/** Tags, people and places used before, to suggest while typing. */
export function useFacets() {
  return useQuery({
    queryKey: [...root, 'facets'] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/entries/facets')),
  });
}

/** The server's code for a failed change (translated from the `errors` namespace). */
export function failureCode(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.code : 'UNKNOWN';
}

function sayWhyNot(error: unknown): void {
  toast(i18n.t(errorKey(failureCode(error) ?? 'UNKNOWN'), { ns: 'errors' }), { tone: 'danger' });
}

/**
 * A change to the user's money shows up in many places (tile, dashboard, activity), so
 * everything of theirs is refreshed, not just this module's lists. A failure is said in a
 * toast, unless the caller is a form that shows it where the user is looking (`quiet`).
 */
function useChange<TInput, TResult>(
  run: (input: TInput) => Promise<TResult>,
  { quiet = false } = {},
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.all }),
    onError: quiet ? undefined : sayWhyNot,
  });
}

export interface SaveEntry {
  body: EntryInput;
  /** A new entry: sent as the Idempotency-Key, so a retry can't add it twice. */
  key?: string;
  /** An edit: the entry and the revision that was edited. */
  editing?: Pick<Entry, 'id' | 'revision_no'>;
}

export function useSaveEntry() {
  return useChange(
    ({ body, key, editing }: SaveEntry) =>
      unwrap(
        editing
          ? api.PUT('/v1/expenses/entries/{entry_id}', {
              params: { path: { entry_id: editing.id } },
              body: { ...body, revision_no: editing.revision_no },
            })
          : api.POST('/v1/expenses/entries', {
              params: { header: { 'Idempotency-Key': key } },
              body,
            }),
      ),
    { quiet: true },
  );
}

const entryPath = (id: string) => ({ params: { path: { entry_id: id } } });

export function useDeleteEntry() {
  return useChange((id: string) =>
    unwrap(api.DELETE('/v1/expenses/entries/{entry_id}', entryPath(id))),
  );
}

export function useUndeleteEntry() {
  return useChange((id: string) =>
    unwrap(api.POST('/v1/expenses/entries/{entry_id}/undelete', entryPath(id))),
  );
}

export function useRestoreEntry() {
  return useChange(({ id, revision_no }: { id: string; revision_no: number }) =>
    unwrap(
      api.POST('/v1/expenses/entries/{entry_id}/restore', {
        ...entryPath(id),
        body: { revision_no },
      }),
    ),
  );
}

export function useAddCategory() {
  return useChange(
    (body: Schemas['CategoryIn']) => unwrap(api.POST('/v1/expenses/categories', { body })),
    { quiet: true },
  );
}

export function useArchiveCategory() {
  return useChange((id: string) =>
    unwrap(
      api.DELETE('/v1/expenses/categories/{category_id}', {
        params: { path: { category_id: id } },
      }),
    ),
  );
}

const productPath = (id: string) => ({ params: { path: { product_id: id } } });

/** Follow the price of what an entry is called. */
export function useTrackProduct() {
  return useChange((title: string) =>
    unwrap(api.POST('/v1/expenses/products', { body: { title } })),
  );
}

export function useUpdateProduct() {
  return useChange(
    ({ id, body }: { id: string; body: ProductPatch }) =>
      unwrap(api.PATCH('/v1/expenses/products/{product_id}', { ...productPath(id), body })),
    { quiet: true },
  );
}

/** `other` joins `id`: its names, and so its purchases. */
export function useMergeProduct() {
  return useChange(({ id, other }: { id: string; other: string }) =>
    unwrap(
      api.POST('/v1/expenses/products/{product_id}/merge', {
        ...productPath(id),
        body: { product_id: other },
      }),
    ),
  );
}

/** The two are different things: they won't be suggested together again. */
export function useKeepApart() {
  return useChange(({ id, other }: { id: string; other: string }) =>
    unwrap(
      api.POST('/v1/expenses/products/{product_id}/apart', {
        ...productPath(id),
        body: { product_id: other },
      }),
    ),
  );
}

export function useStopProduct() {
  return useChange((id: string) =>
    unwrap(api.DELETE('/v1/expenses/products/{product_id}', productPath(id))),
  );
}
