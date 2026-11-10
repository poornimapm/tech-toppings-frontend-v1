import { useRef } from 'react';

/**
 * A press that sends one request at a time, and none once it has worked: a double tap goes
 * once, a failed one can be tried again. Kept in a ref, not in render state, so a second press
 * before the page has redrawn is caught too. `run` answers whether it worked.
 */
export function useOnce(run: () => Promise<boolean>): () => void {
  const busy = useRef(false);
  return () => {
    if (busy.current) return;
    busy.current = true;
    void run().then(
      (worked) => {
        busy.current = worked;
      },
      () => {
        busy.current = false;
      },
    );
  };
}
