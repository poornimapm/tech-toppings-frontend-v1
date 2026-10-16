import { useTranslation } from 'react-i18next';

import { Alert } from '@/design-system';
import type { Entry } from '@/modules/expenses/api';
import { useFieldText } from '@/modules/expenses/field-text';
import { NS } from '@/modules/expenses/i18n';

/**
 * Says an entry looks like one already saved, and shows that one, so the user can tell. It is
 * there, empty, before a check finds anything, so the note is announced when it comes.
 */
export function DuplicateNote({ matches, className }: { matches: Entry[]; className?: string }) {
  const { t } = useTranslation(NS);
  const [first] = matches;
  const text = useFieldText(first?.currency ?? '');
  const entry =
    first &&
    [
      first.title,
      text.value('amount_minor', first.amount_minor),
      text.value('date', first.date),
      first.merchant,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Alert className={className}>
      {entry && (
        <>
          <span className="block break-words">{t('duplicates.note', { entry })}</span>
          {matches.length > 1 && (
            <span className="block text-muted">
              {t('duplicates.more', { count: matches.length - 1 })}
            </span>
          )}
        </>
      )}
    </Alert>
  );
}
