import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Alert, Badge } from '@/design-system';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { NS } from '@/modules/expenses/i18n';
import type { ImportPreview, ImportRow } from '@/modules/expenses/imports-api';

const TILES = ['total', 'ready', 'duplicates', 'with_problems'] as const;

/** What the import would do: the counts, the first rows as entries, and why rows can't go in. */
export function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  const { t, i18n } = useTranslation(NS);
  const book = useCategoryBook();
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(displayDate(value));
  const reasons = (row: ImportRow) =>
    row.problems.map((code) => t(`import.problem.${code}`)).join(', ');
  const more = preview.with_problems - preview.problems.length;

  return (
    <section aria-labelledby="import-preview" className="space-y-4">
      <h2 id="import-preview" className="text-xl font-semibold">
        {t('import.preview')}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((tile) => (
          <div key={tile} className="rounded-3xl border border-border bg-glass p-4 shadow-sm">
            <dt className="text-sm text-muted">{t(`import.count.${tile}`)}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{preview[tile]}</dd>
          </div>
        ))}
      </dl>
      {preview.unknown_categories.length > 0 && (
        <Alert tone="info">
          {t('import.unknownCategories', { names: preview.unknown_categories.join(', ') })}
        </Alert>
      )}
      {/* Wide on phones: it scrolls within itself, never the page. */}
      <div className="overflow-x-auto rounded-3xl border border-border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">{t('import.tableCaption')}</caption>
          <thead className="bg-surface text-muted">
            <tr>
              {(['line', 'date', 'title', 'amount', 'category', 'status'] as const).map((name) => (
                <th key={name} scope="col" className="px-3 py-2 font-medium">
                  {t(`import.columnName.${name}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.rows.map((row) => {
              const entry = row.entry;
              const category = entry ? book.find(entry.category_id) : undefined;
              return (
                <tr key={row.line} className={cx(!entry && 'bg-danger/5')}>
                  <td className="px-3 py-2 text-muted tabular-nums">{row.line}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{entry ? day(entry.date) : '—'}</td>
                  <td className="max-w-64 truncate px-3 py-2">{entry?.title ?? '—'}</td>
                  <td
                    className={cx(
                      'px-3 py-2 whitespace-nowrap tabular-nums',
                      entry?.kind === 'income' && 'text-success',
                    )}
                  >
                    {entry
                      ? `${entry.kind === 'income' ? '+' : '−'}${formatMoney(entry.amount_minor, entry.currency, i18n.language)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {entry ? book.nameOf(category) : '—'}
                    {entry?.category_guessed && (
                      <span className="text-muted"> {t('import.guessed')}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!entry ? (
                      <Badge tone="soon">{reasons(row)}</Badge>
                    ) : row.duplicate ? (
                      <Badge tone="soon">{t('import.duplicate')}</Badge>
                    ) : (
                      t('import.ready')
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {preview.total > preview.rows.length && (
        <p className="text-sm text-muted">
          {t('import.firstRows', { count: preview.rows.length, total: preview.total })}
        </p>
      )}
      {preview.problems.length > 0 && (
        <section aria-labelledby="import-problems" className="space-y-2">
          <h3 id="import-problems" className="font-semibold">
            {t('import.problems')}
          </h3>
          <ul role="list" className="space-y-1 text-sm">
            {preview.problems.map((row) => (
              <li key={row.line}>
                {t('import.problemRow', { line: row.line, reasons: reasons(row) })}
              </li>
            ))}
          </ul>
          {more > 0 && (
            <p className="text-sm text-muted">{t('import.moreProblems', { count: more })}</p>
          )}
        </section>
      )}
    </section>
  );
}
