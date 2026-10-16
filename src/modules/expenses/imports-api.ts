import { useMutation } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useChange } from '@/modules/expenses/api';

type Schemas = components['schemas'];
export type ImportPreview = Schemas['PreviewOut'];
export type ColumnMapping = Schemas['ColumnMapping'];
export type ImportField = Schemas['ImportField'];
export type ImportRow = Schemas['ImportRow'];
export type ProblemCode = Schemas['ProblemCode'];
type CommitStep = Schemas['CommitOut'];

const AMOUNTS: readonly ImportField[] = ['amount', 'debit', 'credit'];

/** Enough to make entries: a day, what it was, and an amount. */
export function isComplete(mapping: ColumnMapping): boolean {
  const named = Object.keys(mapping.columns);
  return (
    named.includes('date') &&
    named.includes('title') &&
    AMOUNTS.some((field) => named.includes(field))
  );
}

/** A file chosen to import: its name, and its bytes as base64 (the server reads them). */
export interface ChosenFile {
  name: string;
  data: string;
}

const CHUNK = 0x8000; // bytes turned into characters at once (an argument list has a limit)

export async function chosenFile(file: File): Promise<ChosenFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return { name: file.name, data: btoa(binary) };
}

/** Read the file into entries without saving: with the mapping given, or one guessed. */
export function usePreviewImport() {
  return useMutation({
    mutationFn: ({ file, mapping }: { file: ChosenFile; mapping?: ColumnMapping }) =>
      unwrap(
        api.POST('/v1/expenses/import/preview', {
          body: { file: file.data, ...(mapping && { mapping }) },
        }),
      ),
  });
}

/** How far an import has got, over all its batches so far. */
export interface ImportProgress {
  done: number;
  total: number;
  added: number;
  already: number;
}

export interface CommitImport {
  file: ChosenFile;
  mapping: ColumnMapping;
  includeDuplicates: boolean;
  /** Where a failed run stopped, to carry on from there; none to start. */
  from: ImportProgress | null;
}

/**
 * Add the file's importable rows, batch after batch, telling how far it got after each. A
 * batch sent again adds nothing twice (each row is keyed by the file and its row), so a run
 * that failed can carry on from where it stopped.
 */
export function useCommitImport(onProgress: (progress: ImportProgress) => void) {
  return useChange(
    async ({ file, mapping, includeDuplicates, from }: CommitImport) => {
      let progress = from ?? { done: 0, total: 0, added: 0, already: 0 };
      let offset: number | null = progress.done;
      while (offset !== null) {
        const step: CommitStep = await unwrap(
          api.POST('/v1/expenses/import/commit', {
            body: { file: file.data, mapping, include_duplicates: includeDuplicates, offset },
          }),
        );
        progress = {
          done: step.done,
          total: step.total,
          added: progress.added + step.added,
          already: progress.already + step.already,
        };
        onProgress(progress);
        offset = step.next_offset ?? null;
      }
      return progress;
    },
    { quiet: true },
  );
}
