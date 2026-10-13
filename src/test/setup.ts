import '@testing-library/jest-dom/vitest';
import '@/core/auth/install';

import { cleanup, configure } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

import { useSession } from '@/core/auth/session-store';
import i18n from '@/core/i18n';
import { useThemeStore } from '@/core/theme/theme-store';
import { usePalette } from '@/platform/palette/palette-store';
import { useToasts } from '@/design-system';
import { installMatchMedia, resetMatchMedia } from '@/test/media';
import { resetModuleState, server } from '@/test/msw';

expect.extend(axeMatchers);
// Lazy routes are compiled on first use in tests; allow for that beyond the 1s default.
configure({ asyncUtilTimeout: 10_000 });
installMatchMedia();
// Animations finish instantly in tests: assertions see end states, never mid-flight frames.
MotionGlobalConfig.skipAnimations = true;
// jsdom has no layout, so it lacks two APIs the command palette (cmdk) uses: scrolling the
// active item into view, and observing the list's size.
Element.prototype.scrollIntoView = () => undefined;
globalThis.ResizeObserver = class implements ResizeObserver {
  observe(): void {
    // nothing to measure in jsdom
  }
  unobserve(): void {
    // nothing to measure in jsdom
  }
  disconnect(): void {
    // nothing to measure in jsdom
  }
};

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(async () => {
  cleanup();
  server.resetHandlers();
  resetModuleState();
  useToasts.getState().clear();
  usePalette.setState({ open: false });
  resetMatchMedia();
  localStorage.clear();
  useSession.setState({ status: 'unknown', accessToken: null, user: null });
  useThemeStore.setState({ preference: 'system' });
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('en');
});

afterAll(() => {
  server.close();
});
