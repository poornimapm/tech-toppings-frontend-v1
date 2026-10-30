import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import type { AuditEntry } from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';

/** Fields that hold one of a few choices, and where their words are. */
const CHOICES: Record<string, string> = { method: 'methods', kind: 'kinds', gender: 'gender' };

/** One change in the audit trail: what was done to which record, by whom and when, and each
 *  field from and to in words (money as money, a worker by name, a choice by its word). The
 *  owner's History and the admin's view. */
export function AuditEntryRow({ entry, currency }: { entry: AuditEntry; currency: string }) {
  const { t, i18n } = useTranslation(NS);
  const when = new Date(entry.at).toLocaleString(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const value = (field: string, raw: unknown): string => {
    if (raw === null || raw === undefined || raw === '') return t('audit.nothing');
    const label = typeof raw === 'string' ? entry.labels?.[raw] : undefined;
    if (label) return label;
    // Money fields hold minor units: shown as money; the rest as they are.
    if (field.endsWith('_minor') && typeof raw === 'number')
      return formatMoney(raw, currency, i18n.language);
    if (field === 'status' && typeof raw === 'string')
      return t(`mark.${raw}`, { defaultValue: t(`projects.${raw}`, { defaultValue: raw }) });
    const choice = CHOICES[field];
    if (choice && typeof raw === 'string') return t(`${choice}.${raw}`, { defaultValue: raw });
    if (typeof raw === 'boolean') return t(raw ? 'audit.yes' : 'audit.no');
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw))
      return displayDate(raw).toLocaleDateString(i18n.language, { dateStyle: 'medium' });
    return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : JSON.stringify(raw);
  };

  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      <p className="font-semibold">
        {t(`audit.actions.${entry.action}`, { defaultValue: entry.action })} ·{' '}
        {t(`audit.entities.${entry.entity}`, { defaultValue: entry.entity })}
      </p>
      <p className="text-sm text-muted">{t('audit.by', { name: entry.actor_name, when })}</p>
      {entry.changes.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {entry.changes.map((change) => (
            <li key={change.field}>
              {t('audit.change', {
                field: t(`audit.fields.${change.field}`, { defaultValue: change.field }),
                from: value(change.field, change.before),
                to: value(change.field, change.after),
              })}
            </li>
          ))}
        </ul>
      )}
      {entry.note && <p className="mt-1 text-sm">{t('audit.note', { note: entry.note })}</p>}
    </li>
  );
}
