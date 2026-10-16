import { HandCoins, Pencil, Plus, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { cx } from '@/core/utils/cx';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { relativeDay } from '@/core/utils/relative-time';
import { Alert, Badge, Button, Dialog, LoadError, Skeleton } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { CONFIRM_TRIGGER, useConfirmFocus } from '@/modules/expenses/confirm-focus';
import { FOCUS_RING, focusId, useFocusTarget } from '@/modules/expenses/focus-target';
import { NS } from '@/modules/expenses/i18n';
import { IouForm } from '@/modules/expenses/iou-form';
import {
  useDeleteIou,
  useIouSummary,
  usePersonIous,
  useSettle,
  type Iou,
} from '@/modules/expenses/ious-api';
import { useLoanWords } from '@/modules/expenses/loan-words';
import { SettleForm } from '@/modules/expenses/settle-form';

type Line = Iou['settlements'][number];

/** What the Idempotency-Key header takes at most. */
const MAX_KEY = 128;
/** The key a payment is undone with: one per payment, so it is undone once, and seen to be. */
const undoKey = (key: string) => `undo:${key}`.slice(0, MAX_KEY);

/**
 * Everything with one person, in a dialog: each loan with what was paid back on it, recording a
 * payment (what is left filled in), undoing one (a correction of the same amount), and adding or
 * changing a loan. A link's loan (`focus`) is ringed. Toasts hide behind a dialog, so what was
 * done is said in the sheet itself.
 */
export function PersonSheet({
  person,
  name,
  focus,
  onClose,
}: {
  /** The person's name as compared (the `person` filter). */
  person: string;
  name: string;
  focus: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const ious = usePersonIous(person);
  const summary = useIouSummary().data;
  const words = useLoanWords();
  const [said, setSaid] = useState('');
  // The form open over the sheet: a payment on a loan, or a loan to change (null: a new one).
  const [paying, setPaying] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  // Looked up as the list now is, so an open form always works on the latest loan.
  const find = (id: string | null) => ious.data?.find((iou) => iou.id === id);
  const paid = find(paying);
  const edited = typeof editing === 'string' ? find(editing) : editing;
  const balance = summary?.people.find((item) => item.key === person);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={name}
      description={balance && summary ? words.net(balance, summary.currency) : undefined}
    >
      <div className="space-y-4">
        <Alert>{said}</Alert>
        {ious.isPending ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : ious.isError ? (
          <LoadError onRetry={() => void ious.refetch()}>
            {t('loans.sheetError', { name })}
          </LoadError>
        ) : ious.data.length === 0 ? (
          <p className="text-muted">{t('loans.sheetEmpty', { name })}</p>
        ) : (
          <ul role="list" className="space-y-3">
            {ious.data.map((iou) => (
              <li key={iou.id}>
                <LoanItem
                  iou={iou}
                  focused={focus === iou.id}
                  onPay={() => {
                    setPaying(iou.id);
                  }}
                  onEdit={() => {
                    setEditing(iou.id);
                  }}
                  onSaid={setSaid}
                />
              </li>
            ))}
          </ul>
        )}
        {ious.hasNextPage && (
          <Button
            variant="secondary"
            disabled={ious.isFetchingNextPage}
            onClick={() => void ious.fetchNextPage()}
          >
            {t('list.more')}
          </Button>
        )}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setEditing(null);
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('loans.add')}
        </Button>
      </div>
      {paid && (
        <SettleForm
          // Not keyed by revision: the form keeps its Idempotency-Key while the loan refreshes.
          key={paid.id}
          iou={paid}
          onSaved={setSaid}
          onClose={() => {
            setPaying(null);
          }}
        />
      )}
      {edited !== undefined && (
        <IouForm
          // A fresh form for each loan opened, and again once it is reloaded at a newer revision.
          key={edited ? `${edited.id}-${String(edited.revision_no)}` : 'new'}
          iou={edited}
          person={name}
          onSaved={setSaid}
          onReload={() => void ious.refetch()}
          onClose={() => {
            setEditing(undefined);
          }}
        />
      )}
    </Dialog>
  );
}

/** One loan: how much, when, what is left and by when, each payment (undoable once), and
 *  recording a payment, changing or deleting the loan. */
function LoanItem({
  iou,
  focused,
  onPay,
  onEdit,
  onSaid,
}: {
  iou: Iou;
  /** A link picked this loan out (`?focus=`). */
  focused: boolean;
  onPay: () => void;
  onEdit: () => void;
  onSaid: (said: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const today = todayIn(useSession((state) => state.user?.timezone));
  const settle = useSettle();
  const remove = useDeleteIou();
  const [deleting, setDeleting] = useState(false);
  const ref = useFocusTarget<HTMLElement>(focused);
  const confirmRef = useConfirmFocus<HTMLDivElement>(deleting);
  const id = focusId(iou.id);
  const nameId = `${id}-name`;
  const money = (minor: number) => formatMoney(minor, iou.currency, i18n.language);
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(displayDate(value));
  const open = iou.settled_on === null;
  const overdue = open && !!iou.due_on && iou.due_on < today;
  const keys = new Set(iou.settlements.map((line) => line.key));
  const failure = failureCode(settle.error ?? remove.error);
  const status = open
    ? [
        t('loans.item.left', { amount: money(iou.outstanding_minor) }),
        iou.due_on &&
          t(overdue ? 'loans.wasDue' : 'loans.item.due', {
            when: relativeDay(iou.due_on, today, i18n.language),
          }),
      ]
        .filter(Boolean)
        .join(' · ')
    : t('loans.item.settled', { date: day(iou.settled_on ?? iou.date) });

  function undo(line: Line) {
    settle.mutate(
      { id: iou.id, key: undoKey(line.key), amount_minor: -line.amount_minor, date: today },
      {
        onSuccess: () => {
          onSaid(t('loans.undone', { amount: money(line.amount_minor) }));
        },
      },
    );
  }

  return (
    <article
      ref={ref}
      id={id}
      aria-labelledby={nameId}
      className={cx('space-y-3 rounded-2xl border border-border p-4', focused && FOCUS_RING)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id={nameId} className="min-w-0 font-semibold break-words">
          {t(`loans.item.${iou.direction}`, {
            amount: money(iou.amount_minor),
            date: day(iou.date),
          })}
        </h3>
        {overdue && <Badge tone="soon">{t('loans.overdue')}</Badge>}
      </div>
      <p className={cx('text-sm', open ? 'font-semibold tabular-nums' : 'text-muted')}>{status}</p>
      {iou.note && <p className="text-sm break-words text-muted">{iou.note}</p>}
      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}

      {iou.settlements.length > 0 && (
        <ul
          role="list"
          aria-label={t('loans.item.payments')}
          className="divide-y divide-border text-sm"
        >
          {iou.settlements.map((line, index) => {
            const lineId = `${id}-line-${String(index)}`;
            const payment = line.amount_minor > 0;
            return (
              <li key={line.key} className="flex flex-wrap items-center gap-2 py-1.5">
                <span id={lineId} className="min-w-0 flex-1 tabular-nums">
                  {t(payment ? 'loans.line.paid' : 'loans.line.corrected', {
                    amount: money(line.amount_minor),
                    date: day(line.date),
                  })}
                </span>
                {payment &&
                  (keys.has(undoKey(line.key)) ? (
                    <Badge>{t('loans.line.undone')}</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      aria-describedby={lineId}
                      disabled={settle.isPending}
                      onClick={() => {
                        undo(line);
                      }}
                    >
                      <Undo2 aria-hidden="true" className="size-4" />
                      {t('loans.undo')}
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

      <div ref={confirmRef}>
        {deleting ? (
          <div role="alert" className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm">{t('loans.confirm')}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(false);
              }}
            >
              {t('loans.no')}
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(iou.id, {
                  onSuccess: () => {
                    onSaid(t('loans.deleted', { person: iou.counterparty }));
                  },
                });
              }}
            >
              {t('loans.yes')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {open && (
              <Button aria-describedby={nameId} onClick={onPay}>
                <HandCoins aria-hidden="true" className="size-4" />
                {t('loans.pay')}
              </Button>
            )}
            <Button variant="ghost" className="ml-auto" aria-describedby={nameId} onClick={onEdit}>
              <Pencil aria-hidden="true" className="size-4" />
              {t('loans.edit')}
            </Button>
            <Button
              variant="ghost"
              aria-describedby={nameId}
              {...CONFIRM_TRIGGER}
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('loans.delete')}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
