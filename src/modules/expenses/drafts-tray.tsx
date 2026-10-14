import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey, toLanguage } from '@/core/i18n';
import { speak } from '@/core/speech/speech';
import { formatMoney, toMinor } from '@/core/utils/money';
import { Alert, Badge, Button, toast } from '@/design-system';
import { failureCode, useSaveEntry, type Entry } from '@/modules/expenses/api';
import { useReadBack, type Draft } from '@/modules/expenses/capture';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { EntryForm } from '@/modules/expenses/entry-form';
import { useFieldText } from '@/modules/expenses/field-text';
import { NS } from '@/modules/expenses/i18n';
import { useUnitText } from '@/modules/expenses/units';

/** Draft field names as the entry (and its translations) names them. */
const FIELD: Record<string, string> = { amount: 'amount_minor' };

/**
 * The confirm card: what was understood, for the user to check. Nothing here is saved until
 * they save it; a draft that lacks something can only be opened and completed.
 */
export function DraftsTray({
  drafts,
  onRemove,
}: {
  drafts: Draft[];
  /** Saved or dismissed: take the draft with this key off the card. */
  onRemove: (key: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const currency = useSession((state) => state.user?.base_currency) ?? '';
  const book = useCategoryBook();
  const save = useSaveEntry();
  const readBack = useReadBack((state) => state.on);
  const text = useFieldText(currency);
  const unitText = useUnitText();
  const [editing, setEditing] = useState<Draft | null>(null);
  if (drafts.length === 0 || !currency) return null;

  const minor = (draft: Draft) => toMinor(draft.amount, currency) ?? 0;
  const ready = (draft: Draft) =>
    draft.title.trim() !== '' && minor(draft) > 0 && book.find(draft.category_id) !== undefined;
  const complete = drafts.filter(ready);
  const measured = (draft: Draft) => draft.kind === 'expense' && draft.unit !== '';
  const failure = failureCode(save.error);

  function sayAloud(entry: Entry) {
    if (!readBack) return;
    const amount = formatMoney(entry.amount_minor, entry.currency, i18n.language);
    speak(t('capture.spoken', { title: entry.title, amount }), toLanguage(i18n.language));
  }

  async function saveAll(chosen: Draft[]) {
    for (const draft of chosen) {
      const entry = await save
        .mutateAsync({
          key: draft.key,
          body: {
            kind: draft.kind,
            title: draft.title,
            amount_minor: minor(draft),
            quantity: measured(draft) ? Number(draft.quantity) : null,
            unit: measured(draft) ? draft.unit : null,
            category_id: draft.category_id,
            date: draft.date,
            merchant: draft.merchant,
            for_whom: draft.for_whom,
            tags: [],
            attachments: [],
          },
        })
        .catch(() => null);
      if (!entry) return; // shown from save.error; the rest stay as drafts
      onRemove(draft.key);
      toast(t('toast.added', { title: entry.title }), { tone: 'success' });
      sayAloud(entry);
    }
  }

  return (
    <section
      aria-labelledby="drafts-title"
      className="space-y-3 rounded-3xl border border-primary/40 bg-glass p-4 shadow-sm backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="drafts-title" className="font-semibold">
            {t('capture.drafts')}
          </h2>
          <p className="text-sm text-muted">{t('capture.draftsHint')}</p>
        </div>
        {complete.length > 1 && (
          <Button disabled={save.isPending} onClick={() => void saveAll(complete)}>
            <Check aria-hidden="true" className="size-4" />
            {t('capture.saveAll', { count: complete.length })}
          </Button>
        )}
      </div>
      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
      <ul role="list" className="divide-y divide-border">
        {drafts.map((draft) => {
          const category = book.find(draft.category_id);
          const title = draft.title || t('capture.missingTitle');
          const details = [
            measured(draft) && unitText.quantity(Number(draft.quantity), draft.unit),
            book.nameOf(category),
            text.value('date', draft.date),
            draft.merchant,
            draft.for_whom,
          ];
          return (
            <li key={draft.key} className="flex flex-wrap items-center gap-3 py-3">
              <CategoryIcon category={category} />
              {/* At least 10rem for the words: on phones the amount and buttons wrap below. */}
              <div className="min-w-40 flex-1">
                <p className="truncate font-medium">{title}</p>
                <p className="truncate text-sm text-muted">{details.filter(Boolean).join(' · ')}</p>
                {draft.uncertain.length > 0 && (
                  <Badge tone="soon">
                    {t('capture.check', {
                      fields: draft.uncertain
                        .map((name) => text.label(FIELD[name] ?? name))
                        .join(', '),
                    })}
                  </Badge>
                )}
              </div>
              <span className="ml-auto shrink-0 font-semibold tabular-nums">
                {minor(draft) > 0
                  ? formatMoney(minor(draft), currency, i18n.language)
                  : t('capture.missingAmount')}
              </span>
              <span className="flex shrink-0 gap-1 max-sm:w-full max-sm:justify-end">
                {ready(draft) && (
                  <Button
                    aria-label={t('capture.saveLabel', { title })}
                    disabled={save.isPending}
                    onClick={() => void saveAll([draft])}
                  >
                    <Check aria-hidden="true" className="size-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  aria-label={t('entry.editLabel', { title })}
                  onClick={() => {
                    setEditing(draft);
                  }}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={t('capture.dismissLabel', { title })}
                  onClick={() => {
                    onRemove(draft.key);
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {editing && (
        <EntryForm
          entry={null}
          draft={editing}
          onClose={() => {
            setEditing(null);
          }}
          onSaved={(entry) => {
            onRemove(editing.key);
            sayAloud(entry);
          }}
        />
      )}
    </section>
  );
}
