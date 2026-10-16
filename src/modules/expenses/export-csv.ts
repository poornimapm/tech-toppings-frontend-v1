import { useMutation } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { EntryFilters } from '@/modules/expenses/api';

const FALLBACK_NAME = 'expenses.csv';

/** The file's name as the server gave it (Content-Disposition), else a plain one. */
function nameOf(response: Response): string {
  const match = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '');
  return match?.[1] ?? FALLBACK_NAME;
}

/**
 * Save a file the API sends. It is fetched with the user's session (a plain link can't carry
 * it), then handed to the browser as a download, under the name the server gave it.
 */
async function saveFile(
  request: Promise<{ data?: Blob; error?: unknown; response: Response }>,
): Promise<string> {
  const file = await unwrap(request);
  const name = nameOf((await request).response);
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  // Once the browser has taken the file, the link to it is let go.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  });
  return name;
}

/** What the list shows (its filters), as a CSV file. */
export function useSaveCsv() {
  return useMutation({
    mutationFn: (filters: EntryFilters) =>
      saveFile(api.GET('/v1/expenses/export.csv', { params: { query: filters }, parseAs: 'blob' })),
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
      ),
  });
}
