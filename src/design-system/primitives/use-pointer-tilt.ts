import { useMotionValue, useReducedMotion, useSpring, type MotionStyle } from 'motion/react';
import type { PointerEvent } from 'react';

const MAX_TILT_DEG = 5;
const SPRING = { stiffness: 260, damping: 22, mass: 0.6 };

/**
 * Card that leans toward the pointer and lights up under it ("spotlight"): spread `handlers`
 * on an `m.*` element, apply `style`, and use `var(--spot-x)` / `var(--spot-y)` in a
 * background gradient. Touch and reduced-motion users get a still card.
 */
export function usePointerTilt() {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    event.currentTarget.style.setProperty('--spot-x', `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--spot-y', `${(y * 100).toFixed(1)}%`);
    if (!reduceMotion) {
      rotateY.set((x - 0.5) * 2 * MAX_TILT_DEG);
      rotateX.set((0.5 - y) * 2 * MAX_TILT_DEG);
    }
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const style: MotionStyle = { rotateX, rotateY, transformPerspective: 900 };
  return { style, handlers: { onPointerMove, onPointerLeave } };
}
