import { useEffect, useState } from 'react';

/**
 * `value` once it has stayed the same for `ms`, so what is being typed reaches the server when
 * typing pauses, not on every key. Values are plain data compared by content (as JSON), so an
 * equal object made on the next render doesn't restart the wait.
 */
export function useSettled<T>(value: T, ms: number): T {
  const latest = JSON.stringify(value);
  const [settled, setSettled] = useState(latest);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(latest);
    }, ms);
    return () => {
      clearTimeout(timer);
    };
  }, [latest, ms]);
  return JSON.parse(settled) as T;
}
