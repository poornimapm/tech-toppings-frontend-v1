import type { QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { OutboxItem } from '@/core/offline/outbox-storage';
import { putItem } from '@/modules/travel/item-cache';
import type { TickLater } from '@/modules/travel/outbox-kinds';

/** A tick made offline goes as it was: the item's new state alone, with no revision, so sent
 *  twice it changes nothing more. The item the server answers goes in the cache at once. */
export async function sendTick(item: OutboxItem, queries?: QueryClient): Promise<void> {
  const { item_id, state } = item.payload as TickLater;
  const saved = await unwrap(
    api.PATCH('/v1/travel/checklist/{item_id}', {
      params: { path: { item_id } },
      body: { state },
    }),
  );
  if (queries) putItem(queries, saved);
}
