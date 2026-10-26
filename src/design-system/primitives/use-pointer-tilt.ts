import type { PointerEvent } from 'react';

import { useMediaQuery } from '@/core/utils/use-media-query';

const MAX_TILT_DEG = 5;

/**
 * Card that leans toward the pointer and lights up under it ("spotlight"): spread `handlers`
 * on the card, give its parent depth (`perspective-[900px]`) and the card a transition that
 * includes `rotate`, and use `var(--spot-x)` / `var(--spot-y)` in a background gradient.
 * The lean is the CSS `rotate` property, eased by that transition: no animation engine loads
 * for it, and it composes with a `transform` an animation sets. Touch and reduced-motion
 * users get a still card.
 */
export function usePointerTilt() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return;
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.style.setProperty('--spot-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--spot-y', `${(y * 100).toFixed(1)}%`);
    if (reduceMotion) return;
    // Leaning back and forth (about x) and sideways (about y) at once: for angles this small,
    // one turn about the combined axis is the same lean.
    const aboutX = (0.5 - y) * 2 * MAX_TILT_DEG;
    const aboutY = (x - 0.5) * 2 * MAX_TILT_DEG;
    const angle = Math.hypot(aboutX, aboutY);
    card.style.rotate =
      angle > 0 ? `${aboutX.toFixed(2)} ${aboutY.toFixed(2)} 0 ${angle.toFixed(2)}deg` : '';
  }

  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.rotate = '';
  }

  return { handlers: { onPointerMove, onPointerLeave } };
}
