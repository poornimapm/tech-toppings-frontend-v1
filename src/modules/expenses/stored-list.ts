import { useSession } from '@/core/auth/session-store';
import { keptLists } from '@/core/offline/kept-lists';
import type { KeyedList } from '@/modules/expenses/keyed-list';

/**
 * A list of drafts kept on this device, one per account: drafts outlive a reload, and what was
 * said offline lands here once it is read (ADR-0010), whichever page is open by then. Every
 * tab shares it (see keptLists), and deleting the account drops it.
 */
export function storedList<T extends { key: string }>(name: string) {
  const lists = keptLists<T>(name);
  const none: T[] = [];
  /** Adds only keys not there yet: what is read twice (a capture sent again) isn't doubled.
   *  False when they are held in this page only (storage full or blocked). */
  const add = (owner: string, more: T[]): boolean => {
    if (!more.length) return true;
    return lists.update(owner, (items) => [
      ...items,
      ...more.filter((item) => !items.some((old) => old.key === item.key)),
    ]);
  };

  /** The signed-in account's list; each change applies to its latest value. */
  function useList(): KeyedList<T> {
    const owner = useSession((state) => state.user?.id ?? '');
    const items = lists.useLists((byOwner) => byOwner[owner]) ?? none;
    return {
      items,
      add: (more) => {
        add(owner, more);
      },
      change: (item) => {
        lists.update(owner, (list) => list.map((old) => (old.key === item.key ? item : old)));
      },
      remove: (key) => {
        lists.update(owner, (list) => list.filter((old) => old.key !== key));
      },
    };
  }

  return { useList, add, clear: lists.clear };
}
