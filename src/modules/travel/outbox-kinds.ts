import type { components } from '@/core/api/schema';

type ChecklistState = components['schemas']['ChecklistState'];

/** Outbox kind (ADR-0010): a checklist or packing tick made with no network. Its sender
 *  (outbox.ts) loads only when such a tick waits. */
export const OUTBOX_TICK = 'travel.tick';

/** What a tick kept offline was: one item's new state. A tick carries no revision, so sent late
 *  or twice it still leaves the item in the state last tapped. */
export interface TickLater {
  trip_id: string;
  item_id: string;
  state: ChecklistState;
}
