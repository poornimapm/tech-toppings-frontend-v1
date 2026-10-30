import { Check, Combine, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey, toLanguage } from '@/core/i18n';
import { speak } from '@/core/speech/speech';
import { formatMoney, toInput, toMinor } from '@/core/utils/money';
import { Alert, Badge, Button, toast } from '@/design-system';
import { failureCode, isQueued, useSaveEntry, type Entry } from '@/modules/expenses/api';
import { useReadBack, type Draft } from '@/modules/expenses/capture';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { DuplicateNote } from '@/modules/expenses/duplicate-note';
import { useDuplicates } from '@/modules/expenses/duplicates';
import { EntryForm } from '@/modules/expenses/entry-form';
import { useFieldText } from '@/modules/expenses/field-text';
import { NS } from '@/modules/expenses/i18n';
import type { IouDraft } from '@/modules/expenses/iou-capture';
import { LoanDrafts } from '@/modules/expenses/iou-drafts';
import type { KeyedList } from '@/modules/expenses/keyed-list';
import { useUnitText } from '@/modules/expenses/units';

/** Draft field names as the entry (and its translations) names them. */
const FIELD: Record<string, string> = { amount: 'amount_minor' };
/** What a combined receipt can be unsure of: the fields it keeps. */
const COMBINED = new Set(['title', 'amount', 'date', 'category_id']);

/**
 * The confirm card: what was understood, for the user to check, entries and then loans.
 * Nothing here is saved until they save it; a draft that lacks something can only be opened
 * and completed.
 */
export function DraftsTray({
  drafts,
  onRemove,
  onCombine,
  loans,
}: {
  drafts: Draft[];
  /** Saved or dismissed: take the draft with this key off the card. */
  onRemove: (key: string) => void;
  /** A receipt's drafts (these keys) become this one entry. */
  onCombine: (keys: string[], one: Draft) => void;
  loans: KeyedList<IouDraft>;
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
  const [saving, setSaving] = useState(false);
  /** A receipt just combined: focus goes to it, as the button that was focused is gone. */
  const combined = useRef<string | null>(null);
  useEffect(() => {
    const row = combined.current && document.getElementById(`draft-${combined.current}`);
    if (!row) return;
    combined.current = null;
    row.querySelector('button')?.focus();
  }, [drafts]);
  const minor = (draft: Draft) => (currency ? (toMinor(draft.amount, currency) ?? 0) : 0);
  const ready = (draft: Draft) =>
    draft.title.trim() !== '' && minor(draft) > 0 && book.find(draft.category_id) !== undefined;
  const complete = drafts.filter(ready);
  // Held while one is saved, here or in the form: checked again then, it would find itself.
  const duplicates = useDuplicates(
    complete.map((draft) => ({
      kind: draft.kind,
      title: draft.title,
      amount_minor: minor(draft),
      date: draft.date,
      merchant: draft.merchant || null,
    })),
    saving || editing !== null,
  );
  const matchesOf = (draft: Draft) => duplicates[complete.indexOf(draft)] ?? [];
  // Saving all leaves out what looks saved already: each of those is saved only on its own.
  const unflagged = complete.filter((draft) => matchesOf(draft).length === 0);
  if ((drafts.length === 0 && loans.items.length === 0) || !currency) return null;

  const measured = (draft: Draft) => draft.kind === 'expense' && draft.unit !== '';
  const failure = failureCode(save.error);
  // A scanned receipt's drafts, while there is more than one of them to combine.
  const byReceipt = new Map<string, Draft[]>();
  for (const draft of drafts) {
    if (draft.receipt)
      byReceipt.set(draft.receipt, [...(byReceipt.get(draft.receipt) ?? []), draft]);
  }
  const receipts = [...byReceipt].filter(([, lines]) => lines.length > 1);

  /** One entry for the whole receipt: the shop's name, the total, the most used category.
   *  What any line was unsure of, the whole is unsure of too. */
  function combine(receipt: Draft[]) {
    const [first] = receipt;
    if (!first) return;
    const shop = receipt.find((draft) => draft.merchant)?.merchant;
    const counts = new Map<string, number>();
    for (const { category_id: id } of receipt) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    const category = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const total = receipt.reduce((sum, draft) => sum + minor(draft), 0);
    const unsure = new Set(receipt.flatMap((draft) => draft.uncertain));
    if (receipt.some((draft) => !minor(draft))) unsure.add('amount');
    if (counts.size > 1) unsure.add('category_id'); // one category for many things is a guess
    if (!shop) unsure.add('title');
    const one: Draft = {
      key: crypto.randomUUID(),
      kind: 'expense',
      title: shop ?? t('capture.receipt.title'),
      amount: total > 0 ? toInput(total, currency) : '',
      quantity: '',
      unit: '',
      category_id: category,
      date: first.date,
      merchant: shop ?? '',
      for_whom: '',
      uncertain: [...unsure].filter((field) => COMBINED.has(field)),
    };
    onCombine(
      receipt.map((draft) => draft.key),
      one,
    );
    combined.current = one.key;
    toast(t('capture.receipt.combined', { title: one.title }));
  }

  function sayAloud(entry: Entry) {
    if (!readBack) return;
    const amount = formatMoney(entry.amount_minor, entry.currency, i18n.language);
    speak(t('capture.spoken', { title: entry.title, amount }), toLanguage(i18n.language));
  }

  async function saveAll(chosen: Draft[]) {
    setSaving(true);
    try {
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
        if (isQueued(entry)) {
          toast(t('toast.queued', { title: entry.title }));
          continue;
        }
        toast(t('toast.added', { title: entry.title }), { tone: 'success' });
        sayAloud(entry);
      }
    } finally {
      // In the same render as the last saved draft leaves the card, so it is never checked again.
      setSaving(false);
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
        {unflagged.length > 1 && (
          <Button disabled={save.isPending} onClick={() => void saveAll(unflagged)}>
            <Check aria-hidden="true" className="size-4" />
            {t('capture.saveAll', { count: unflagged.length })}
          </Button>
        )}
      </div>
      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
      {receipts.map(([receipt, lines]) => (
        <div
          key={receipt}
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2 text-sm"
        >
          <span>
            {t('capture.receipt.summary', {
              shop: lines.find((line) => line.merchant)?.merchant ?? t('capture.receipt.shop'),
              count: lines.length,
              total: formatMoney(
                lines.reduce((sum, draft) => sum + minor(draft), 0),
                currency,
                i18n.language,
              ),
            })}
          </span>
          <Button
            variant="secondary"
            // Not while saving: lines still being saved would be saved again as the whole.
            disabled={saving || save.isPending}
            onClick={() => {
              combine(lines);
            }}
          >
            <Combine aria-hidden="true" className="size-4" />
            {t('capture.receipt.combine')}
          </Button>
        </div>
      ))}
      <ul role="list" className="divide-y divide-border" hidden={drafts.length === 0}>
        {drafts.map((draft) => {
          const category = book.find(draft.category_id);
          const title = draft.title || t('capture.missingTitle');
          const matches = matchesOf(draft);
          const flagged = matches.length > 0;
          const details = [
            measured(draft) && unitText.quantity(Number(draft.quantity), draft.unit),
            book.nameOf(category),
            text.value('date', draft.date),
            draft.merchant,
            draft.for_whom,
          ];
          return (
            <li key={draft.key} id={`draft-${draft.key}`} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <CategoryIcon category={category} />
                {/* At least 10rem for the words: on phones the amount and buttons wrap below. */}
                <div className="min-w-40 flex-1">
                  <p className="truncate font-medium">{title}</p>
                  <p className="truncate text-sm text-muted">
                    {details.filter(Boolean).join(' · ')}
                  </p>
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
                    // Looks saved already: saving it again is a choice, spelled out in words.
                    <Button
                      variant={flagged ? 'secondary' : 'primary'}
                      aria-label={t(flagged ? 'duplicates.saveAnywayLabel' : 'capture.saveLabel', {
                        title,
                      })}
                      disabled={save.isPending}
                      onClick={() => void saveAll([draft])}
                    >
                      {flagged ? (
                        t('duplicates.saveAnyway')
                      ) : (
                        <Check aria-hidden="true" className="size-4" />
                      )}
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
              </div>
              {/* Under the row, full width; there (empty) for every draft, so a note is announced. */}
              <DuplicateNote matches={matches} className="mt-3" />
            </li>
          );
        })}
      </ul>
      <LoanDrafts loans={loans} currency={currency} />
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
          onQueued={() => {
            onRemove(editing.key);
          }}
        />
      )}
    </section>
  );
}
