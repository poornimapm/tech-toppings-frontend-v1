// vitest-axe 0.1 ships typings for Vitest's old global `Vi` namespace. Register its matcher with
// the current `vitest` module augmentation instead (same pattern @testing-library/jest-dom uses).
import 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  // Type parameters must match Vitest's own declaration for the interfaces to merge.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
