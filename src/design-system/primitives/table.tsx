import type { ReactNode } from 'react';

import { cx } from '@/core/utils/cx';

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
}

export interface TableProps<Row> {
  /** Names the table for screen readers. */
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** Shown under the headings when there are no rows. */
  empty?: ReactNode;
}

/** A plain data table that scrolls sideways on narrow screens instead of squeezing. */
export function Table<Row>({ caption, columns, rows, rowKey, empty }: TableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-start text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg text-xs text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-3 py-2 text-start font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={cx('px-3 py-2 align-top', column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && empty ? <p className="p-4 text-sm text-muted">{empty}</p> : null}
    </div>
  );
}
