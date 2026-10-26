import { create } from 'zustand';

import { ApiError } from '@/core/api/api-error';
import { onForgetAccount } from '@/core/auth/device-cleanup';
import { useSession } from '@/core/auth/session-store';
import { forgetKeptLists } from '@/core/offline/kept-lists';
import { deviceStorage, type OutboxItem, type OutboxStorage } from '@/core/offline/outbox-storage';

/** Sends one item; throws an `ApiError` when it couldn't. Modules declare theirs by kind
 *  (`ModuleDefinition.outbox`). */
export type OutboxSender = (item: OutboxItem) => Promise<void>;
export type SenderLookup = (kind: string) => Promise<OutboxSender | undefined>;

/** What waits on this device, for the screen (every account's: filter by `owner`). */
export const useOutbox = create<{ items: OutboxItem[] }>()(() => ({ items: [] }));

let storage: OutboxStorage = deviceStorage();
/** Accounts deleted while this page runs (here or in another tab): a send still under way for
 *  one stops at the next item and puts nothing back (its drafts, say). */
const forgotten = new Set<string>();

/** Tests swap the storage (and start from an empty one). */
export function setOutboxStorage(next: OutboxStorage): void {
  storage = next;
  forgotten.clear();
  useOutbox.setState({ items: [] });
}

/** True once `owner`'s account was deleted on this device: what a sender would keep for it is
 *  dropped. */
export const isForgotten = (owner: string): boolean => forgotten.has(owner);

const oldestFirst = (a: OutboxItem, b: OutboxItem) => a.queuedAt.localeCompare(b.queuedAt);

/** Read what waits into `useOutbox` (at startup, and after every change). */
export async function loadOutbox(): Promise<void> {
  useOutbox.setState({ items: (await storage.all()).sort(oldestFirst) });
}

export async function enqueue(item: Omit<OutboxItem, 'queuedAt'>): Promise<void> {
  await storage.put({ ...item, queuedAt: new Date().toISOString() });
  await loadOutbox();
}

/** The user gave up on an item the server refused. */
export async function discard(id: string): Promise<void> {
  await storage.remove(id);
  await loadOutbox();
}

/** The user asks for a refused item to be sent again (its cause may be fixed): it waits anew. */
export async function retry(id: string): Promise<void> {
  const item = (await storage.all()).find((each) => each.id === id);
  if (item) await storage.put({ ...item, failure: undefined });
  await loadOutbox();
}

// Deleting the account drops what it left waiting on this device: its items and kept lists.
// Every tab does so (the one that holds the flush may not be the one that deleted it): a send
// under way there finishes first (or stops), then the lists are dropped again, so nothing it
// kept late outlives the forgetting.
onForgetAccount(async (owner) => {
  forgotten.add(owner);
  await flushing?.catch(() => 0);
  forgetKeptLists(owner);
  const theirs = (await storage.all()).filter((item) => item.owner === owner);
  await Promise.all(theirs.map((item) => storage.remove(item.id)));
  await loadOutbox();
});

/** Statuses about the moment, not the item: no network, the session being renewed, a timeout,
 *  too many requests. With any 5xx (the server starting or failing), the item and the rest wait
 *  for the next try. */
const NOT_THE_ITEM = new Set([0, 401, 408, 429]);
/** 403s about the whole account or session (a password to change, the account disabled, the
 *  anti-forgery check): every item waits too. Any other 403 is the item's (its module turned
 *  off): kept with why, for the user to send again or discard, and the rest go on. */
const ACCOUNT_WIDE = new Set([
  'AUTH_PASSWORD_CHANGE_REQUIRED',
  'AUTH_ACCOUNT_DISABLED',
  'AUTH_CSRF_FAILED',
]);

/** The code to keep a failed item with, or null when it should just wait. A sender that throws
 *  something else (a bug, a full disk) marks it too: tried again forever, it never ends. */
function refusal(error: unknown): string | null {
  if (!(error instanceof ApiError)) return 'UNKNOWN';
  if (NOT_THE_ITEM.has(error.status) || error.status >= 500) return null;
  return error.status === 403 && ACCOUNT_WIDE.has(error.code) ? null : error.code;
}

const FLUSH_LOCK = 'tt-outbox-flush';

/** One flush across tabs and windows (Web Locks, where supported): two would send the same
 *  items, and a capture sent twice is two agent runs. While another holds it, this one sends
 *  nothing: what waits is that one's to send. */
async function oneAtATime(task: () => Promise<number>): Promise<number> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks
    ? await locks.request(FLUSH_LOCK, { ifAvailable: true }, (lock) => (lock ? task() : 0))
    : task();
}

async function sendWaiting(
  owner: string,
  senderFor: SenderLookup,
  signal?: AbortSignal,
): Promise<number> {
  // Each send goes with the current session: once `owner` is no longer the one signed in here
  // (or the caller lost interest, or the account was deleted), the rest wait.
  const goOn = () =>
    !signal?.aborted && !forgotten.has(owner) && useSession.getState().user?.id === owner;
  const waiting = (await storage.all())
    .filter((each) => each.owner === owner && !each.failure)
    .sort(oldestFirst);
  let sent = 0;
  for (const item of waiting) {
    if (!goOn()) break;
    const send = await senderFor(item.kind);
    if (!send) continue; // a kind this build no longer knows: kept, untouched
    try {
      await send(item);
    } catch (error) {
      const failure = refusal(error);
      if (!failure) break;
      await storage.put({ ...item, failure });
      continue;
    }
    await storage.remove(item.id);
    sent += 1;
  }
  return sent;
}

let flushing: Promise<number> | null = null;

/**
 * Send what `owner` made offline, oldest first; returns how many went. It stops at the first
 * that can't go now (the rest wait for the next try, in order). One the server refuses is kept
 * with its error code for the user to see: nothing they made is dropped unseen. While one flush
 * runs, another call waits for it and answers 0: only one caller tells the user.
 */
export function flush(
  owner: string,
  senderFor: SenderLookup,
  signal?: AbortSignal,
): Promise<number> {
  if (flushing) return flushing.then(() => 0);
  flushing = (async () => {
    try {
      return await oneAtATime(() => sendWaiting(owner, senderFor, signal));
    } finally {
      flushing = null;
      await loadOutbox();
    }
  })();
  return flushing;
}

/** A network failure, as opposed to the server refusing: worth keeping the request to retry. */
export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}
