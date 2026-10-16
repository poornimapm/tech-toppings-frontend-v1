import { useEffect, useRef } from 'react';

/** Marks the button that opens an inline confirm, so focus can return to it. */
export const CONFIRM_TRIGGER = { 'data-confirm-trigger': '' };

/**
 * For an inline "are you sure?" that takes the place of the button asking it: focus moves to its
 * first choice when it opens, and back to that button when it closes, never lost to the page.
 * Put the returned ref on the element holding both.
 */
export function useConfirmFocus<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) ref.current?.querySelector('button')?.focus();
    else if (wasOpen.current) {
      ref.current?.querySelector<HTMLElement>('[data-confirm-trigger]')?.focus();
    }
    wasOpen.current = open;
  }, [open]);
  return ref;
}
