import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isTransient } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useSession } from '@/core/auth/session-store';
import { discard, enqueue, useOutbox } from '@/core/offline/outbox';
import { toast } from '@/design-system';
import { travelKeys, tripPath, useTravelChange } from '@/modules/travel/api';
import { failureText } from '@/modules/travel/failure-text';
import { putItem } from '@/modules/travel/item-cache';
import { OUTBOX_TICK, type TickLater } from '@/modules/travel/outbox-kinds';

type Schemas = components['schemas'];
export type ChecklistItem = Schemas['TravelChecklistOut'];
export type ChecklistInput = Schemas['TravelChecklistIn'];
export type ChecklistPatch = Schemas['TravelChecklistPatch'];
export type ChecklistState = Schemas['ChecklistState'];
export type Bag = Schemas['PackingBag'];
export type DayPlan = Schemas['TravelPrepareOut'];
export type SuggestResult = Schemas['TravelSuggestOut'];
/** What to suggest for: a day's activities, or what to pack. */
export type SuggestAsk = Omit<Schemas['TravelSuggestIn'], 'apply'>;
/** Today or tomorrow on the trip's own calendar, or a day (YYYY-MM-DD). */
export type When = 'today' | 'tomorrow' | (string & {});

const itemPath = (item_id: string) => ({ params: { path: { item_id } } });

/** A suggestion is shown as one (and in the app's words) while it is as its rule words it: the
 *  server's to say, as only a new name makes it the person's words (a tick doesn't). */
export const asSuggested = (item: ChecklistItem) => item.as_suggested;

/** Every checklist and packing item of a trip: those for no day first, then day by day. */
export function useChecklist(tripId: string) {
  return useQuery({
    queryKey: travelKeys.checklist(tripId),
    queryFn: () => unwrap(api.GET('/v1/travel/trips/{trip_id}/checklist', tripPath(tripId))),
  });
}

/** One day's plan: today or tomorrow on the trip's own calendar, or any day. */
export function usePrepare(tripId: string, when: When) {
  return useQuery({
    queryKey: travelKeys.prepare(tripId, when),
    queryFn: () =>
      unwrap(
        api.GET('/v1/travel/trips/{trip_id}/prepare', {
          params: { path: { trip_id: tripId }, query: { when } },
        }),
      ),
  });
}

/** A new item, sent with one key however often it is tried. */
export function useAddItem(tripId: string) {
  return useTravelChange(({ body, key }: { body: ChecklistInput; key: string }) =>
    unwrap(
      api.POST('/v1/travel/trips/{trip_id}/checklist', {
        ...tripPath(tripId),
        body,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  );
}

/** An edit, as of the revision seen: changed elsewhere since, it's refused (VERSION_CONFLICT). */
export function useEditItem() {
  return useTravelChange(({ id, body }: { id: string; body: ChecklistPatch }) =>
    unwrap(api.PATCH('/v1/travel/checklist/{item_id}', { ...itemPath(id), body })),
  );
}

/** Removed for good from the lists (a suggestion removed isn't suggested again); its history
 *  event (checklist_removed) takes it back. */
export function useRemoveItem() {
  return useTravelChange((id: string) =>
    unwrap(api.DELETE('/v1/travel/checklist/{item_id}', itemPath(id))),
  );
}

/** What the rules would add (a preview, written nowhere), or the suggestions added, as one change
 *  whose event takes them all back. */
export const suggest = (tripId: string, asked: SuggestAsk, apply: boolean) =>
  unwrap(
    api.POST('/v1/travel/trips/{trip_id}/checklist/suggest', {
      ...tripPath(tripId),
      body: { ...asked, apply },
    }),
  );

/** The ticks waiting on this device for a trip's items, by item (the latest tap wins). */
export function useWaitingTicks(tripId: string): Map<string, ChecklistState> {
  const owner = useSession((state) => state.user?.id);
  const items = useOutbox((state) => state.items);
  const waiting = new Map<string, ChecklistState>();
  for (const item of items) {
    if (item.owner !== owner || item.kind !== OUTBOX_TICK || item.failure) continue;
    const later = item.payload as TickLater;
    if (later.trip_id === tripId) waiting.set(later.item_id, later.state);
  }
  return waiting;
}

/** The ids of one item's ticks waiting now: a newer tick of it overtakes them. */
function waitingIds(owner: string | undefined, itemId: string): string[] {
  return useOutbox
    .getState()
    .items.filter(
      (item) =>
        item.owner === owner &&
        item.kind === OUTBOX_TICK &&
        !item.failure &&
        (item.payload as TickLater).item_id === itemId,
    )
    .map((item) => item.id);
}

/** A tap on an item's state, with words for it if it has to wait (the device's outbox shows
 *  them). */
export interface Tick {
  item: ChecklistItem;
  state: ChecklistState;
  label: string;
}

/**
 * An item's state, saved as it is tapped. With no network (or the server out of reach) the tap
 * waits on the device and goes when it can; the answer is then null. Either way it overtakes
 * the item's taps still waiting, so only the latest is ever sent.
 */
export function useTick(tripId: string) {
  const client = useQueryClient();
  const owner = useSession((state) => state.user?.id);
  return useMutation({
    // Tried even with no network, so the tap is kept at once rather than paused unseen.
    networkMode: 'always',
    onMutate: ({ item }: Tick) => ({ older: waitingIds(owner, item.id) }),
    mutationFn: async ({ item, state, label }: Tick) => {
      try {
        return await unwrap(
          api.PATCH('/v1/travel/checklist/{item_id}', { ...itemPath(item.id), body: { state } }),
        );
      } catch (error) {
        if (!isTransient(error) || !owner) throw error;
        const payload: TickLater = { trip_id: tripId, item_id: item.id, state };
        await enqueue({ id: crypto.randomUUID(), kind: OUTBOX_TICK, owner, label, payload });
        return null;
      }
    },
    onSuccess: async (saved, _tick, context) => {
      for (const id of context.older) await discard(id);
      if (!saved) return;
      putItem(client, saved);
      void client.invalidateQueries({ queryKey: travelKeys.all });
    },
    onError: (error) => {
      toast(failureText(error), { tone: 'danger' });
      // Refused (removed elsewhere, say): the lists as they are now.
      if (!isTransient(error)) void client.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}
