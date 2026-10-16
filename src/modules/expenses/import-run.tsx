import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { errorKey } from '@/core/i18n';
import { Alert, Button, Meter, Switch } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import {
  isComplete,
  useCommitImport,
  type ChosenFile,
  type ColumnMapping,
  type ImportPreview,
  type ImportProgress,
} from '@/modules/expenses/imports-api';
import { paths } from '@/modules/expenses/paths';

/**
 * The import itself: the rows the preview showed as ready (and, if asked, those saved already),
 * added batch by batch with how far it has got. A run that fails can carry on: what was added
 * stays, and nothing is added twice.
 */
export function ImportRun({
  file,
  mapping,
  preview,
}: {
  file: ChosenFile;
  mapping: ColumnMapping;
  preview: ImportPreview;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const [alsoSaved, setAlsoSaved] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const run = useCommitImport(setProgress);
  const failure = failureCode(run.error);
  const count = preview.ready + (alsoSaved ? preview.duplicates : 0);

  if (run.isSuccess) {
    const { added, already } = run.data;
    return (
      <Alert tone="info">
        <p>
          {t('import.run.done', { count: added })}{' '}
          {already > 0 && t('import.run.already', { count: already })}
        </p>
        <Link
          to={`${paths.entries}?period=allTime`}
          className="mt-2 inline-block font-medium underline underline-offset-4"
        >
          {t('import.run.see')}
        </Link>
      </Alert>
    );
  }

  return (
    <section
      aria-labelledby="import-run"
      className="space-y-3 rounded-3xl border border-primary/40 bg-glass p-4 shadow-sm"
    >
      <h2 id="import-run" className="text-xl font-semibold">
        {t('import.run.title')}
      </h2>
      {preview.duplicates > 0 && (
        <Switch
          label={t('import.run.alsoSaved', { count: preview.duplicates })}
          checked={alsoSaved}
          disabled={run.isPending || progress !== null}
          onCheckedChange={setAlsoSaved}
        />
      )}
      {progress && (
        <Meter
          label={t('import.run.progressLabel')}
          value={progress.done}
          max={Math.max(progress.total, 1)}
          valueText={t('import.run.progress', { done: progress.done, total: progress.total })}
        />
      )}
      {failure && (
        <Alert tone="danger">
          {tError(errorKey(failure))} {t('import.run.resume')}
        </Alert>
      )}
      <Button
        disabled={count === 0 || run.isPending || !isComplete(mapping)}
        onClick={() => {
          run.mutate({
            file,
            mapping,
            includeDuplicates: alsoSaved,
            from: failure ? progress : null,
          });
        }}
      >
        {failure ? t('import.run.retry') : t('import.run.button', { count })}
      </Button>
    </section>
  );
}
