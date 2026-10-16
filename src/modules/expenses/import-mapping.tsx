import { useTranslation } from 'react-i18next';

import { SelectField } from '@/design-system';
import { NS } from '@/modules/expenses/i18n';
import type { ColumnMapping, ImportField, ImportPreview } from '@/modules/expenses/imports-api';

/** The fields a column can hold, those an entry needs first. */
const FIELDS = [
  'date',
  'title',
  'amount',
  'debit',
  'credit',
  'kind',
  'category',
  'merchant',
  'note',
  'tags',
  'for_whom',
  'payment_mode',
  'time',
  'quantity',
  'unit',
  'currency',
] as const satisfies readonly ImportField[];

/** Which column holds what, how days are written and how amounts say money spent. */
export function ImportMappingForm({
  preview,
  mapping,
  onChange,
}: {
  preview: ImportPreview;
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}) {
  const { t } = useTranslation(NS);
  const columns = preview.columns.map((name, index) => ({
    value: String(index),
    label: name || t('import.column', { number: index + 1 }),
  }));
  const named = mapping.columns as Partial<Record<ImportField, number>>;
  const signed = named.amount !== undefined && named.kind === undefined;

  function choose(field: ImportField, value: string) {
    const next = Object.fromEntries(Object.entries(named).filter(([name]) => name !== field));
    if (value !== '') next[field] = Number(value);
    onChange({ ...mapping, columns: next });
  }

  return (
    <section aria-labelledby="import-mapping" className="space-y-4">
      <div>
        <h2 id="import-mapping" className="text-xl font-semibold">
          {t('import.mapping')}
        </h2>
        <p className="text-sm text-muted">{t('import.mappingHint')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((field) => (
          <SelectField
            key={field}
            label={t(`import.field.${field}`)}
            placeholder={t('import.notInFile')}
            value={named[field] === undefined ? '' : String(named[field])}
            options={columns}
            onChange={(event) => {
              choose(field, event.target.value);
            }}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t('import.dateFormat')}
          value={mapping.date_format}
          options={preview.date_formats.map((choice) => ({
            value: choice.format,
            label: choice.example,
          }))}
          onChange={(event) => {
            onChange({ ...mapping, date_format: event.target.value });
          }}
        />
        {signed && (
          <SelectField
            label={t('import.signs')}
            value={mapping.signs}
            options={[
              { value: 'expense', label: t('import.signsExpense') },
              { value: 'signed', label: t('import.signsSigned') },
            ]}
            onChange={(event) => {
              onChange({ ...mapping, signs: event.target.value as ColumnMapping['signs'] });
            }}
          />
        )}
      </div>
    </section>
  );
}
