import type { ClientAction } from '@/core/agents/queries';
import { dayOf, itemsOf, namesOf, positiveOf, textOf } from '@/modules/expenses/capture';
import type { IouDirection } from '@/modules/expenses/ious-api';

/** The client tool the track-expenses skill hands loans over with. */
export const IOU_TOOL = 'expenses_iou_draft';

/** new: money lent or borrowed now; repay: money paid back on such a loan. */
export type LoanAction = 'new' | 'repay';
export type LoanKind = `${LoanAction}_${IouDirection}`;
export const LOAN_KINDS = [
  'new_lent',
  'new_borrowed',
  'repay_lent',
  'repay_borrowed',
] as const satisfies readonly LoanKind[];
/** The fields an assistant may say it guessed. */
const LOAN_FIELDS = ['action', 'direction', 'counterparty', 'amount', 'date', 'due_on'] as const;
export type LoanField = (typeof LOAN_FIELDS)[number];
const isLoanField = (name: string): name is LoanField =>
  (LOAN_FIELDS as readonly string[]).includes(name);

/**
 * A loan as understood from what the user said, waiting for them to check it. Like an entry
 * draft, everything is text until it is saved.
 */
export interface IouDraft {
  /** Identifies the draft on screen, and is its Idempotency-Key when saved. */
  key: string;
  action: LoanAction;
  /** lent: the user gave the money; borrowed: they took it. A payment's is its loan's. */
  direction: IouDirection;
  counterparty: string;
  amount: string;
  date: string;
  /** new: when it is to be paid back, only if said. */
  due_on: string;
  /** repay: the loan it pays back, when the assistant knew it; else the user picks one. */
  iou_id: string;
  /** Fields that were guessed rather than heard. */
  uncertain: LoanField[];
}

export const kindOf = (loan: Pick<IouDraft, 'action' | 'direction'>): LoanKind =>
  `${loan.action}_${loan.direction}`;

/** Loan drafts out of a client action's arguments; a direction that isn't one is a guess. */
export function iouDraftsFrom(action: ClientAction | undefined, today: string): IouDraft[] {
  return itemsOf(action, IOU_TOOL).map((item) => {
    const repay = item.action === 'repay';
    const known = item.direction === 'lent' || item.direction === 'borrowed';
    const uncertain = namesOf(item.uncertain).filter(isLoanField);
    const date = dayOf(item.date, today);
    const due = repay ? '' : dayOf(item.due_on, '');
    return {
      key: crypto.randomUUID(),
      action: repay ? 'repay' : 'new',
      direction: item.direction === 'borrowed' ? 'borrowed' : 'lent',
      counterparty: textOf(item.counterparty),
      amount: positiveOf(item.amount),
      date,
      due_on: due >= date ? due : '',
      iou_id: repay ? textOf(item.iou_id) : '',
      uncertain: known || uncertain.includes('direction') ? uncertain : [...uncertain, 'direction'],
    };
  });
}
