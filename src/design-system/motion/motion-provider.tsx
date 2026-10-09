import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

const loadFeatures = () => import('@/design-system/motion/features').then((mod) => mod.default);

/**
 * Animation setup for the whole app. Components use `m.*` (strict mode rejects the heavier
 * `motion.*`), and every animation follows the OS "reduce motion" setting.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
