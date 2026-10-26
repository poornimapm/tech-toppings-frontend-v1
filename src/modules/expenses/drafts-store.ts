import type { Draft } from '@/modules/expenses/capture';
import type { IouDraft } from '@/modules/expenses/iou-capture';
import { storedList } from '@/modules/expenses/stored-list';

/** Entries and loans waiting to be checked, kept on this device per account. */
export const entryDrafts = storedList<Draft>('expenses-drafts');
export const loanDrafts = storedList<IouDraft>('expenses-loan-drafts');
