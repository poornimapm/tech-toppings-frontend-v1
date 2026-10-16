import { Check, HandCoins, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorKey, toLanguage } from '@/core/i18n';
import { speak } from '@/core/speech/speech';
import { formatMoney, toMinor } from '@/core/utils/money';
import { Alert, Badge, Button, SelectField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { useReadBack } from '@/modules/expenses/capture';
import { useFieldText } from '@/modules/expenses/field-text';
import { NS } from '@/modules/expenses/i18n';
import { kindOf, type IouDraft } from '@/modules/expenses/iou-capture';
import {
  leftWhenTooMuch,
  useOpenIous,
  useSaveIou,
  useSettle,
  type Iou,
} from '@/modules/expenses/ious-api';
import type { KeyedList } from '@/modules/expenses/keyed-list';
import { LoanDraftForm } from '@/modules/expenses/loan-draft-form';
import { useLoanWords } from '@/modules/expenses/loan-words';

/**
 * Loans on the confirm card: money lent or borrowed, or paid back, as understood. Each is saved
 * on its own, with its key: a new loan, or a payment on one of that person's open loans. Saving
 * says where the user stands on that loan now.
 */
export function LoanDrafts({ loans, currency }: { loans: KeyedList<IouDraft>; currency: string }) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const add = useSaveIou();
  const settle = useSettle();
  const words = useLoanWords();
  const readBack = useReadBack((state) => state.on);
  const [editing, setEditing] = useState<IouDraft | null>(null);
  if (loans.items.length === 0) return null;

  const error = add.error ?? settle.error;
  const failure = failureCode(error);
  const left = leftWhenTooMuch(error);
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);

  async function save(loan: IouDraft, toward: Iou | undefined) {
    add.reset();
    settle.reset();
    const amount_minor = toMinor(loan.amount, currency) ?? 0;
    const sent =
      loan.action === 'new'
        ? add.mutateAsync({
            key: loan.key,
            body: {
              counterparty: loan.counterparty.trim(),
              direction: loan.direction,
              amount_minor,
              date: loan.date,
              due_on: loan.due_on || null,
            },
          })
        : toward &&
          settle.mutateAsync({ id: toward.id, key: loan.key, amount_minor, date: loan.date });
    const saved = await sent?.catch(() => null); // shown from the error above the list
    if (!saved) return;
    loans.remove(loan.key);
    const said = words.saved(saved);
    toast(said, { tone: 'success' });
    if (readBack) speak(said, toLanguage(i18n.language));
  }

  return (
    <>
      {failure && (
        <Alert tone="danger">
          {left === null
            ? tError(errorKey(failure))
            : t('capture.loan.tooMuch', { amount: money(left) })}
        </Alert>
      )}
      <ul role="list" aria-label={t('capture.loan.list')} className="divide-y divide-border">
        {loans.items.map((loan) => (
          <LoanRow
            key={loan.key}
            loan={loan}
            currency={currency}
            busy={add.isPending || settle.isPending}
            onChange={loans.change}
            onSave={(toward) => void save(loan, toward)}
            onEdit={() => {
              setEditing(loan);
            }}
            onDismiss={() => {
              loans.remove(loan.key);
            }}
          />
        ))}
      </ul>
      {editing && (
        <LoanDraftForm
          loan={editing}
          currency={currency}
          onClose={() => {
            setEditing(null);
          }}
          onDone={loans.change}
        />
      )}
    </>
  );
}

/** One loan as understood. A payment goes towards one of that person's open loans the same
 *  way round: the one the assistant named, else the oldest; the user can pick another. */
function LoanRow({
  loan,
  currency,
  busy,
  onChange,
  onSave,
  onEdit,
  onDismiss,
}: {
  loan: IouDraft;
  currency: string;
  busy: boolean;
  onChange: (loan: IouDraft) => void;
  onSave: (toward: Iou | undefined) => void;
  onEdit: () => void;
  onDismiss: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const fields = useFieldText(currency);
  const person = loan.counterparty.trim();
  const repay = loan.action === 'repay';
  const open = useOpenIous(repay ? person : '');
  const choices = (open.data ?? []).filter((iou) => iou.direction === loan.direction);
  const toward = choices.find((iou) => iou.id === loan.iou_id) ?? choices[0];
  const amount = toMinor(loan.amount, currency) ?? 0;
  const ready = person !== '' && amount > 0 && (!repay || toward !== undefined);
  const kind = kindOf(loan);
  const title = person ? t(`capture.loan.title.${kind}`, { person }) : t('capture.loan.who');
  const money = (minor: number, code = currency) => formatMoney(minor, code, i18n.language);
  const details = [
    !person && t(`capture.loan.kind.${kind}`),
    fields.value('date', loan.date),
    loan.due_on && t('capture.loan.due', { date: fields.value('date', loan.due_on) }),
  ];

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          style={{ background: 'var(--tt-accent-amber-soft)', color: 'var(--tt-accent-amber)' }}
          className="grid size-10 shrink-0 place-items-center rounded-2xl"
        >
          <HandCoins className="size-5" />
        </span>
        {/* At least 10rem for the words: on phones the amount and buttons wrap below. */}
        <div className="min-w-40 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-sm text-muted">{details.filter(Boolean).join(' · ')}</p>
          {loan.uncertain.length > 0 && (
            <Badge tone="soon">
              {t('capture.check', {
                fields: loan.uncertain.map((name) => t(`capture.loan.field.${name}`)).join(', '),
              })}
            </Badge>
          )}
        </div>
        <span className="ml-auto shrink-0 font-semibold tabular-nums">
          {amount > 0 ? money(amount) : t('capture.missingAmount')}
        </span>
        <span className="flex shrink-0 gap-1 max-sm:w-full max-sm:justify-end">
          {ready && (
            <Button
              aria-label={t('capture.saveLabel', { title })}
              disabled={busy}
              onClick={() => {
                onSave(repay ? toward : undefined);
              }}
            >
              <Check aria-hidden="true" className="size-4" />
            </Button>
          )}
          <Button variant="secondary" aria-label={t('entry.editLabel', { title })} onClick={onEdit}>
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            aria-label={t('capture.dismissLabel', { title })}
            onClick={onDismiss}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </span>
      </div>
      {repay &&
        open.isSuccess &&
        (choices.length > 0 ? (
          <SelectField
            className="mt-3"
            label={t('capture.loan.pick')}
            value={toward?.id}
            options={choices.map((iou) => ({
              value: iou.id,
              label: t('capture.loan.option', {
                date: fields.value('date', iou.date),
                left: money(iou.outstanding_minor, iou.currency),
                amount: money(iou.amount_minor, iou.currency),
              }),
            }))}
            onChange={(event) => {
              onChange({ ...loan, iou_id: event.target.value });
            }}
          />
        ) : (
          <p className="mt-3 text-sm text-muted">{t('capture.loan.noOpen', { person })}</p>
        ))}
    </li>
  );
}
