import type { QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { OutboxItem } from '@/core/offline/outbox-storage';
import { laborKeys } from '@/modules/labor/api';
import type { MarksLater } from '@/modules/labor/outbox-kinds';

/** A mark tapped offline goes as it was, with the mark seen then: sent twice, it changes
 *  nothing more; overtaken by a newer mark, the server refuses it (LABOR_MARK_CHANGED). The day
 *  the server answers goes in the cache at once: a refetch may not come soon on a weak
 *  network, and the next tap must see the mark just sent. */
export async function sendMarks(item: OutboxItem, queries?: QueryClient): Promise<void> {
  const { project_id, day, marks } = item.payload as MarksLater;
  const sheet = await unwrap(
    api.PUT('/v1/labor/projects/{project_id}/attendance', {
      params: { path: { project_id }, query: { day } },
      body: { marks },
    }),
  );
  queries?.setQueryData(laborKeys.day(project_id, day), sheet);
}
