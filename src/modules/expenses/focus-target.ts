import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

/** The ring a card wears when a link picked it out, so the eye finds it at once. */
export const FOCUS_RING = 'ring-2 ring-primary ring-offset-2 ring-offset-bg';

/** The element id a link's `?focus=<id>` points at. */
export const focusId = (id: string) => `focus-${id}`;

/**
 * For a card a link picked out (a notification's `?focus=<id>`): brings it to the middle of the
 * screen once it is on the page, without gliding when the user asks for less motion.
 */
export function useFocusTarget<T extends HTMLElement>(focused: boolean) {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!focused) return;
    ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }, [focused, reduceMotion]);
  return ref;
}
