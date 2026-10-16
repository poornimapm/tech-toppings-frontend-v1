import { useState } from 'react';

export interface KeyedList<T extends { key: string }> {
  items: T[];
  add: (more: T[]) => void;
  /** Put this one in place of the item with its key. */
  change: (item: T) => void;
  remove: (key: string) => void;
}

/**
 * Drafts waiting to be checked. Reading and saving overlap (new text can be read while a draft
 * is still saving), so the list only ever changes from its latest value, never by replacing it
 * with a copy taken earlier.
 */
export function useKeyedList<T extends { key: string }>(): KeyedList<T> {
  const [items, setItems] = useState<T[]>([]);
  return {
    items,
    add: (more) => {
      setItems((current) => [...current, ...more]);
    },
    change: (item) => {
      setItems((current) => current.map((old) => (old.key === item.key ? item : old)));
    },
    remove: (key) => {
      setItems((current) => current.filter((old) => old.key !== key));
    },
  };
}
