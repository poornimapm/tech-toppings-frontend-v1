import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAskAgent, type ClientAction } from '@/core/agents/queries';
import { env } from '@/core/config/env';
import { toLanguage } from '@/core/i18n';
import type { EntryKind } from '@/modules/expenses/api';

/** The assistant skill that reads what was said, and the client tool it answers with. */
const SKILL = 'track-expenses';
export const DRAFT_TOOL = 'expenses_draft';

/**
 * An entry as understood from what the user said or pasted, waiting for them to check it.
 * Like the entry form, everything is text until it is saved.
 */
export interface Draft {
  /** Identifies the draft on screen, and is its Idempotency-Key when saved. */
  key: string;
  kind: EntryKind;
  title: string;
  amount: string;
  /** How much was bought ("2" kg), with its unit code; both empty when not said. */
  quantity: string;
  unit: string;
  category_id: string;
  date: string;
  merchant: string;
  for_whom: string;
  /** Fields that were guessed rather than heard. */
  uncertain: string[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const positive = (value: unknown): string =>
  typeof value === 'number' && value > 0 ? String(value) : '';

/**
 * Drafts out of a client action's arguments. They come from an AI model or a parser, so
 * nothing about their shape is taken for granted: what is missing or odd becomes an empty
 * field for the user to fill in.
 */
export function draftsFrom(action: ClientAction | undefined, today: string): Draft[] {
  const raw: unknown = action?.tool === DRAFT_TOOL ? action.arguments.drafts : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      key: crypto.randomUUID(),
      kind: item.kind === 'income' ? 'income' : 'expense',
      title: text(item.title),
      amount: positive(item.amount),
      ...(positive(item.quantity) && text(item.unit)
        ? { quantity: positive(item.quantity), unit: text(item.unit) }
        : { quantity: '', unit: '' }),
      category_id: text(item.category_id),
      date: DAY.test(text(item.date)) ? text(item.date) : today,
      merchant: text(item.merchant),
      for_whom: text(item.for_whom),
      uncertain: Array.isArray(item.uncertain)
        ? item.uncertain.filter((name): name is string => typeof name === 'string')
        : [],
    }));
}

/** Ask the assistant to read free text into drafts. Whether AI or the rule parser answers is
 *  the server's choice (its mode and fallback switches); the result has the same shape. */
export function useCapture() {
  const { i18n } = useTranslation();
  const ask = useAskAgent(env.assistantAgent);
  return {
    run: ask.data,
    error: ask.error,
    pending: ask.isPending,
    read: (input: string, inputType: 'text' | 'speech') =>
      ask.mutateAsync({
        input,
        skill: SKILL,
        locale: toLanguage(i18n.language),
        context: { input_type: inputType },
      }),
  };
}

interface ReadBack {
  on: boolean;
  toggle: () => void;
}

/** Whether saved entries are read aloud. Remembered on this device. */
export const useReadBack = create<ReadBack>()(
  persist(
    (set) => ({
      on: false,
      toggle: () => {
        set((state) => ({ on: !state.on }));
      },
    }),
    { name: 'tt-expenses-read-back' },
  ),
);
