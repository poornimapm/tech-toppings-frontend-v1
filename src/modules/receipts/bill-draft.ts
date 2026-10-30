/** A receipt as read from a bill (the `receipts_draft` client tool's arguments: `draft`), as
 *  the form takes it. Anything else handed over is ignored. */
export interface BillDraft {
  text?: string;
  shop?: string;
  bought_on?: string;
  /** In the currency's main unit, as read. */
  amount?: number;
  bill_number?: string;
  serial_number?: string;
  warranty_months?: number;
  /** The fields read with doubt: the form asks to check them. */
  uncertain: string[];
}

export const DRAFT_TOOL = 'receipts_draft';

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);
const number = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

export function draftOf(args: Record<string, unknown>): BillDraft | null {
  const raw = args.draft;
  if (typeof raw !== 'object' || raw === null) return null;
  const draft = raw as Record<string, unknown>;
  const uncertain = Array.isArray(draft.uncertain)
    ? draft.uncertain.filter((field): field is string => typeof field === 'string')
    : [];
  return {
    text: text(draft.text),
    shop: text(draft.shop),
    bought_on: text(draft.bought_on),
    amount: number(draft.amount),
    bill_number: text(draft.bill_number),
    serial_number: text(draft.serial_number),
    warranty_months: number(draft.warranty_months),
    uncertain,
  };
}
