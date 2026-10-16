import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type BulkInput = Schemas['BulkIn'];
export type BulkResult = Schemas['BulkOut'];
export type SkipReason = Schemas['SkipReason'];

/** Why entries were skipped, in the order a message tells them. */
export const SKIP_REASONS = [
  'unchanged',
  'kind',
  'tags_full',
  'conflict',
  'not_found',
] as const satisfies readonly SkipReason[];

/** One change to many entries; what couldn't change comes back as skipped, with a reason. */
export function useBulkUpdate() {
  return useChange(
    (body: BulkInput) => unwrap(api.POST('/v1/expenses/entries/bulk-update', { body })),
    { quiet: true },
  );
}

/** How many were skipped for each reason, leaving out the reasons with none. */
export function skippedBy(result: BulkResult): [SkipReason, number][] {
  return SKIP_REASONS.map(
    (reason) =>
      [reason, result.skipped.filter((item) => item.reason === reason).length] as [
        SkipReason,
        number,
      ],
  ).filter(([, count]) => count > 0);
}
