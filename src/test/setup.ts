import '@testing-library/jest-dom/vitest';
import '@/core/auth/install';

import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

import { useSession } from '@/core/auth/session-store';
import i18n from '@/core/i18n';
import { useThemeStore } from '@/core/theme/theme-store';
import { installMatchMedia, resetMatchMedia } from '@/test/media';
import { server } from '@/test/msw';

expect.extend(axeMatchers);
// Lazy routes are compiled on first use in tests; allow for that beyond the 1s default.
configure({ asyncUtilTimeout: 10_000 });
installMatchMedia();

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(async () => {
  cleanup();
  server.resetHandlers();
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
