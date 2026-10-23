import { useMutation } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { saveFile } from '@/core/api/save-file';
import type { EntryFilters } from '@/modules/expenses/api';

const FALLBACK_NAME = 'expenses.csv';

/** What the list shows (its filters), as a CSV file. */
export function useSaveCsv() {
  return useMutation({
    mutationFn: (filters: EntryFilters) =>
      saveFile(
        api.GET('/v1/expenses/export.csv', { params: { query: filters }, parseAs: 'blob' }),
        FALLBACK_NAME,
      ),
  });
}

/** A month's report figures, as a CSV file. */
export function useSaveReportCsv() {
  return useMutation({
    mutationFn: (month: string) =>
      saveFile(
        api.GET('/v1/expenses/reports/monthly.csv', {
          params: { query: { month } },
          parseAs: 'blob',
        }),
        FALLBACK_NAME,
      ),
  });
}
