import { api, unwrap } from '@/core/api/client';
import { env } from '@/core/config/env';
import { isForgotten } from '@/core/offline/outbox';
import type { OutboxItem } from '@/core/offline/outbox-storage';
import type { EntryInput } from '@/modules/expenses/api';
import { CAPTURE_SKILL, draftsFrom, type Draft } from '@/modules/expenses/capture';
import { entryDrafts, loanDrafts } from '@/modules/expenses/drafts-store';
import { iouDraftsFrom } from '@/modules/expenses/iou-capture';
import type { CaptureLater } from '@/modules/expenses/outbox-kinds';

const TITLE_MAX = 120;

/** An entry saved offline goes as it was, under its own Idempotency-Key. */
export async function sendEntry(item: OutboxItem): Promise<void> {
  await unwrap(
    api.POST('/v1/expenses/entries', {
      params: { header: { 'Idempotency-Key': item.id } },
      body: item.payload as EntryInput,
    }),
  );
}

/** The words themselves, as a draft to complete: what nobody could read is still not lost. */
function wordsAsDraft(said: CaptureLater, key: string): Draft {
  return {
    key,
    kind: 'expense',
    title: said.input.slice(0, TITLE_MAX),
    amount: '',
    quantity: '',
    unit: '',
    category_id: '',
    date: said.day,
    merchant: '',
    for_whom: '',
    uncertain: [],
  };
}

/** Drafts keyed by the item they came from (each key is its Idempotency-Key when saved): read
 *  again, the same drafts come back, so they are neither added twice nor saved twice. */
function keyedBy<T extends { key: string }>(item: OutboxItem, kind: string, drafts: T[]): T[] {
  return drafts.map((draft, index) => ({ ...draft, key: `${item.id}.${kind}${index}` }));
}

/** What was said offline is read now; its drafts wait on the Expenses page to be checked. */
export async function sendCapture(item: OutboxItem): Promise<void> {
  const said = item.payload as CaptureLater;
  const run = await unwrap(
    api.POST('/v1/agents/{name}/runs', {
      params: { path: { name: env.assistantAgent } },
      body: {
        input: said.input,
        skill: CAPTURE_SKILL,
        locale: said.locale,
        context: { input_type: said.inputType },
      },
    }),
  );
  const entries = keyedBy(
    item,
    'e',
    run.client_actions.flatMap((action) => draftsFrom(action, said.day)),
  );
  const loans = keyedBy(
    item,
    'l',
    run.client_actions.flatMap((action) => iouDraftsFrom(action, said.day)),
  );
  if (isForgotten(item.owner)) return; // the account was deleted meanwhile: nothing to keep
  const kept = [
    entryDrafts.add(
      item.owner,
      entries.length + loans.length ? entries : [wordsAsDraft(said, item.id)],
    ),
    loanDrafts.add(item.owner, loans),
  ];
  // Held in this page only, they would go with it: the words stay waiting, to be read again.
  if (kept.includes(false)) throw new Error('The drafts could not be stored on this device.');
}
