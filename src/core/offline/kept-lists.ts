import { create } from 'zustand';

/**
 * Lists kept on this device per account, in localStorage (drafts waiting to be checked,
 * ADR-0010). Tabs and installed windows share them: each change is made to the latest stored
 * value, and a change made elsewhere is picked up from its `storage` event, so no tab writes
 * back a stale copy over what another added. Every list is stored under one prefix, so deleting
 * an account drops its lists even where the feature that made them isn't loaded.
 */
const PREFIX = 'tt-kept-';

type ByOwner<T> = Record<string, T[]>;
type Change<T> = (lists: ByOwner<T>) => ByOwner<T>;

/** What is stored under `key`; null when storage can't be read (blocked) or holds no lists. */
function read<T>(key: string): ByOwner<T> | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as ByOwner<T>)
      : null;
  } catch {
    return null;
  }
}

/** Whether `value` is now stored: false when storage is full or blocked. */
function write(key: string, value: ByOwner<unknown>): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function without<T>(lists: ByOwner<T>, owner: string): ByOwner<T> {
  return Object.fromEntries(Object.entries(lists).filter(([who]) => who !== owner));
}

/** Every loaded list drops an account's list (after it is forgotten here). */
const drops = new Set<(owner: string) => void>();

export function keptLists<T>(name: string) {
  const key = PREFIX + name;
  /** What storage holds, as last read or written here. */
  let stored = read<T>(key) ?? {};
  // This page's changes storage refused (full, or a private window's quota of 0), oldest first.
  // They are made again over whatever is stored by then, by this page or another tab, so a later
  // write loses neither. Each is keyed (add if absent, change or drop by key): made again, it
  // gives the same result.
  let pending: Change<T>[] = [];
  const replay = () => pending.reduce((lists, apply) => apply(lists), stored);
  const useLists = create<ByOwner<T>>()(() => stored);

  /** Makes `apply` over the latest stored value and stores it; false when it holds in this page
   *  only (it is made again with the next change). */
  const change = (apply: Change<T>): boolean => {
    stored = read<T>(key) ?? stored;
    pending.push(apply);
    const next = replay();
    const written = write(key, next);
    if (written) {
      stored = next;
      pending = [];
    }
    useLists.setState(next, true);
    return written;
  };
  drops.add((owner) => change((lists) => without(lists, owner)));
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    stored = read<T>(key) ?? {};
    useLists.setState(replay(), true);
  });

  return {
    /** Every account's list, for the screen. */
    useLists,
    /** Change one account's list, from the latest value any tab stored; false when the change
     *  holds in this page only (storage full or blocked), to go with it. */
    update: (owner: string, edit: (items: T[]) => T[]): boolean =>
      change((lists) => ({ ...lists, [owner]: edit(lists[owner] ?? []) })),
    /** Every account's list emptied (tests start each case from none). */
    clear: (): boolean => {
      pending = [];
      return change(() => ({}));
    },
  };
}

function storedKeys(): string[] {
  try {
    return Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    ).filter((key): key is string => key?.startsWith(PREFIX) === true);
  } catch {
    return [];
  }
}

/** Drops `owner`'s lists from this device: loaded here or not. */
export function forgetKeptLists(owner: string): void {
  for (const key of storedKeys()) write(key, without(read(key) ?? {}, owner));
  for (const drop of drops) drop(owner);
}
