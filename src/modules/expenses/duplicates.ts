import { hashKey, useQueries } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import type { Entry } from '@/modules/expenses/api';

export type DuplicateCandidate = components['schemas']['DuplicateCandidate'];

/**
 * For each candidate, saved entries that look like it (the same amount on a nearby day, under
 * a like name or at the same place), in the candidates' order. It is only advice, so it fails
 * open: while it loads, or if it fails, a candidate has none and saving is never held up.
 *
 * Each candidate is asked and kept on its own (the server takes batches too), so saving or
 * dismissing one draft never sends the others back to "loading", which would hide their notes.
 * While `held` (an entry is being saved) nothing is asked again and the answers stay as they
 * were: asked then, the entry being saved would find itself.
 */
export function useDuplicates(candidates: DuplicateCandidate[], held = false): Entry[][] {
  // Two drafts alike are one question, with one answer.
  const asked = new Map(candidates.map((candidate) => [hashKey([candidate]), candidate]));
  const answers = useQueries({
    queries: [...asked.values()].map((candidate) => ({
      // Under ['user', ...] so signing out drops it, and saving an entry checks again.
      queryKey: ['user', 'expenses', 'duplicates', candidate] as const,
      queryFn: async () => {
        const body = { candidates: [candidate] };
        const { results } = await unwrap(
          api.POST('/v1/expenses/entries/duplicates/check', { body }),
        );
        return results[0]?.matches ?? [];
      },
      retry: false,
      enabled: !held,
    })),
  });
  const found = new Map([...asked.keys()].map((key, index) => [key, answers[index]?.data ?? []]));
  return candidates.map((candidate) => found.get(hashKey([candidate])) ?? []);
}
