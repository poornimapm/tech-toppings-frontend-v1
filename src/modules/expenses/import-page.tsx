import { ArrowLeft, FileUp } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { errorKey } from '@/core/i18n';
import { Alert, Skeleton } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { ImportMappingForm } from '@/modules/expenses/import-mapping';
import { ImportPreviewTable } from '@/modules/expenses/import-preview';
import { ImportRun } from '@/modules/expenses/import-run';
import {
  chosenFile,
  isComplete,
  usePreviewImport,
  type ChosenFile,
  type ColumnMapping,
  type ImportPreview,
} from '@/modules/expenses/imports-api';
import { paths } from '@/modules/expenses/paths';

/**
 * Bring entries in from a CSV file: a bank statement, a spreadsheet, or this app's own export.
 * The file is read on the server with a guessed mapping the user can change; every change reads
 * it again. Nothing is saved until the user imports it (import-run.tsx).
 */
export function ImportPage() {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const read = usePreviewImport();
  const [file, setFile] = useState<ChosenFile | null>(null);
  // The last answer stays on screen while a changed mapping is read again.
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const failure = failureCode(read.error);

  function show(next: ImportPreview) {
    setPreview(next);
    setMapping(next.mapping);
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const chosen = await chosenFile(picked);
    setFile(chosen);
    setPreview(null);
    read.mutate({ file: chosen }, { onSuccess: show });
  }

  function remap(next: ColumnMapping) {
    setMapping(next);
    if (file && isComplete(next)) read.mutate({ file, mapping: next }, { onSuccess: show });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          to={paths.entries}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('import.back')}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{t('import.title')}</h1>
        <p className="text-muted">{t('import.subtitle')}</p>
      </header>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-border bg-glass p-6 text-center focus-within:border-primary hover:border-primary">
        <FileUp aria-hidden="true" className="size-8 text-primary" />
        <span className="font-semibold">{t('import.choose')}</span>
        <span className="text-sm text-muted">{file ? file.name : t('import.chooseHint')}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => void choose(event)}
        />
      </label>

      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
      {read.isPending && !preview && <Skeleton className="h-64 rounded-3xl" />}
      {preview && mapping && (
        <>
          <ImportMappingForm preview={preview} mapping={mapping} onChange={remap} />
          {!isComplete(mapping) && <Alert tone="info">{t('import.incomplete')}</Alert>}
          <ImportPreviewTable preview={preview} />
          {file && (
            // A new file or mapping is a new import: it starts from nothing.
            <ImportRun
              key={`${preview.fingerprint}:${JSON.stringify(mapping)}`}
              file={file}
              mapping={mapping}
              preview={preview}
            />
          )}
        </>
      )}
    </div>
  );
}
