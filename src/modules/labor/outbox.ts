import { api, unwrap } from '@/core/api/client';
import type { OutboxItem } from '@/core/offline/outbox-storage';
import type { MarksLater } from '@/modules/labor/outbox-kinds';

/** A mark tapped offline goes as it was, with the mark seen then: sent twice, it changes
 *  nothing more; overtaken by a newer mark, the server refuses it (LABOR_MARK_CHANGED). */
export async function sendMarks(item: OutboxItem): Promise<void> {
  const { project_id, day, marks } = item.payload as MarksLater;
  await unwrap(
    api.PUT('/v1/labor/projects/{project_id}/attendance', {
      params: { path: { project_id }, query: { day } },
      body: { marks },
    }),
  );
}
