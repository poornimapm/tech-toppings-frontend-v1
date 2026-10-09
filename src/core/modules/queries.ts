import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api, unwrap } from '@/core/api/client';
import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import type { ModuleTile, ModuleView } from '@/core/modules/types';

/** Under ['user', ...] so signing out drops it with the rest of the user's data. */
export const moduleKeys = {
  list: ['user', 'modules'] as const,
};

/** The API's page limit; the catalog is far smaller, so one page holds every module. */
const CATALOG_PAGE_SIZE = 100;

export function useModuleViews() {
  return useQuery({
    queryKey: moduleKeys.list,
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/v1/modules', { params: { query: { page_size: CATALOG_PAGE_SIZE } } }),
        )
      ).items,
  });
}

/** Modules merged with their definitions and localised strings, in the user's order. */
export function useModuleTiles() {
  const query = useModuleViews();
  const registry = useModuleRegistry();
  const { i18n } = useTranslation();
  const tiles = useMemo<ModuleTile[]>(
    () =>
      [...(query.data ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((view) => {
          const definition = registry.definitionFor(view.key);
          return { view, definition, text: textFor(definition, i18n.language) };
        }),
    [query.data, registry, i18n.language],
  );
  return { ...query, tiles };
}

/** Recompute `available` the way the server does, for optimistic updates. */
function withAvailability(view: ModuleView): ModuleView {
  return {
    ...view,
    available: view.global_enabled && view.enabled && view.status !== 'coming_soon',
  };
}

function replaceView(client: QueryClient, updated: ModuleView): void {
  client.setQueryData<ModuleView[]>(moduleKeys.list, (views) =>
    views?.map((view) => (view.key === updated.key ? updated : view)),
  );
}

/** Snapshot, apply an optimistic change, and hand back a rollback for onError. */
async function optimistic(
  client: QueryClient,
  change: (views: ModuleView[]) => ModuleView[],
): Promise<{ previous: ModuleView[] | undefined }> {
  await client.cancelQueries({ queryKey: moduleKeys.list });
  const previous = client.getQueryData<ModuleView[]>(moduleKeys.list);
  if (previous) client.setQueryData(moduleKeys.list, change(previous));
  return { previous };
}

function rollback(
  client: QueryClient,
  context: { previous: ModuleView[] | undefined } | undefined,
) {
  if (context?.previous) client.setQueryData(moduleKeys.list, context.previous);
}

export interface PreferenceChange {
  key: string;
  pinned?: boolean;
  enabled?: boolean;
}

/** Pin/unpin or turn a module on/off for me. The UI updates at once and rolls back on error. */
export function useModulePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...changes }: PreferenceChange) =>
      unwrap(
        api.PATCH('/v1/modules/{key}/preferences', { params: { path: { key } }, body: changes }),
      ),
    onMutate: ({ key, ...changes }) =>
      optimistic(client, (views) =>
        views.map((view) => (view.key === key ? withAvailability({ ...view, ...changes }) : view)),
      ),
    onError: (_error, _change, context) => {
      rollback(client, context);
    },
    onSuccess: (updated) => {
      replaceView(client, updated);
    },
  });
}

/** Save a new arrangement (keys first to last). */
export function useReorderModules() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => unwrap(api.PUT('/v1/modules/order', { body: { keys } })),
    onMutate: (keys) =>
      optimistic(client, (views) =>
        views.map((view) => ({ ...view, position: keys.indexOf(view.key) })),
      ),
    onError: (_error, _keys, context) => {
      rollback(client, context);
    },
  });
}

/** "Notify me when it launches" for a coming-soon module. */
export function useModuleInterest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ key, wanted }: { key: string; wanted: boolean }) => {
      const options = { params: { path: { key } } };
      return unwrap(
        wanted
          ? api.POST('/v1/modules/{key}/interest', options)
          : api.DELETE('/v1/modules/{key}/interest', options),
      );
    },
    onMutate: ({ key, wanted }) =>
      optimistic(client, (views) =>
        views.map((view) => (view.key === key ? { ...view, notify_requested: wanted } : view)),
      ),
    onError: (_error, _change, context) => {
      rollback(client, context);
    },
    onSuccess: (updated) => {
      replaceView(client, updated);
    },
  });
}
