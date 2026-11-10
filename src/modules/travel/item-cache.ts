import type { QueryClient } from '@tanstack/react-query';

import type { components } from '@/core/api/schema';
import { travelKeys } from '@/modules/travel/api';

type ChecklistItem = components['schemas']['TravelChecklistOut'];
type DayPlan = components['schemas']['TravelPrepareOut'];

/** An item as the server now has it, in every list of its trip held, at once: the next tap must
 *  see it, and a refetch may not come soon on a weak network. */
export function putItem(client: QueryClient, saved: ChecklistItem): void {
  const swap = (items: ChecklistItem[]) =>
    items.map((each) => (each.id === saved.id ? saved : each));
  client.setQueryData<ChecklistItem[]>(
    travelKeys.checklist(saved.trip_id),
    (items) => items && swap(items),
  );
  client.setQueriesData<DayPlan>(
    { queryKey: travelKeys.plans(saved.trip_id) },
    (plan) => plan && { ...plan, checklist: swap(plan.checklist) },
  );
}
