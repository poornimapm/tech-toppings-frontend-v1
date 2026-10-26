import { useEffect, useState } from 'react';

/**
 * A list as shown on screen: the current items, plus for `ms` the ones just removed, flagged
 * `leaving` so CSS can fade them out (keyed by id, React keeps their element for the
 * transition). The order is by id, so a leaving item stays where it was.
 */
export function useLeaving<T extends { id: number }>(
  items: readonly T[],
  ms: number,
): { item: T; leaving: boolean }[] {
  const [previous, setPrevious] = useState(items);
  const [leaving, setLeaving] = useState<T[]>([]);
  if (items !== previous) {
    const gone = previous.filter((old) => !items.some((item) => item.id === old.id));
    setPrevious(items);
    if (gone.length > 0) setLeaving((current) => [...current, ...gone]);
  }

  useEffect(() => {
    if (leaving.length === 0) return undefined;
    const timer = setTimeout(() => {
      setLeaving([]);
    }, ms);
    return () => {
      clearTimeout(timer);
    };
  }, [leaving, ms]);

  const live = new Set(items.map((item) => item.id));
  return [
    ...items.map((item) => ({ item, leaving: false })),
    ...leaving.filter((item) => !live.has(item.id)).map((item) => ({ item, leaving: true })),
  ].sort((a, b) => a.item.id - b.item.id);
}
