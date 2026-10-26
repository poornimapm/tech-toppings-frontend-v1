/**
 * Drafts waiting to be checked (stored-list.ts keeps them). Reading and saving overlap (new text
 * can be read while a draft is still saving), so a list only ever changes from its latest value,
 * never by replacing it with a copy taken earlier.
 */
export interface KeyedList<T extends { key: string }> {
  items: T[];
  add: (more: T[]) => void;
  /** Put this one in place of the item with its key. */
  change: (item: T) => void;
  remove: (key: string) => void;
}
