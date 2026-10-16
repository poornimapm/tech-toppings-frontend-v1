import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type SavedFilter = Schemas['SavedFilterOut'];
export type SavedView = Schemas['SavedView'];

/** The user's saved views of the entries list, by name. */
export function useSavedFilters() {
  return useQuery({
    queryKey: [...userKeys.all, 'expenses', 'saved-filters'] as const,
    queryFn: () => unwrap(api.GET('/v1/expenses/saved-filters')),
  });
}

/** A new view (a name and the list's filters), or a change to one: a name, its filters, or both. */
export type SaveFilter =
  | { id?: undefined; name: string; view: SavedView }
  | { id: string; name?: string; view?: SavedView };

/** Save the list's filters under a name, or rename a view or replace its filters. */
export function useSaveFilter() {
  return useChange(
    (input: SaveFilter) =>
      unwrap(
        input.id === undefined
          ? api.POST('/v1/expenses/saved-filters', {
              body: { name: input.name, view: input.view },
            })
          : api.PATCH('/v1/expenses/saved-filters/{saved_id}', {
              params: { path: { saved_id: input.id } },
              body: { name: input.name, view: input.view },
            }),
      ),
    { quiet: true },
  );
}

export function useDeleteFilter() {
  return useChange((id: string) =>
    unwrap(
      api.DELETE('/v1/expenses/saved-filters/{saved_id}', { params: { path: { saved_id: id } } }),
    ),
  );
}
