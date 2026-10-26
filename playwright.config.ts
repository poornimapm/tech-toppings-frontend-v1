import { defineConfig, devices } from '@playwright/test';

// Smoke tests run against the production build (vite preview). API calls are stubbed per test
// with page.route(), so no backend is needed. Browsers live in node_modules
// (PLAYWRIGHT_BROWSERS_PATH=0, set by the npm scripts) — nothing is installed globally.
const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // The service worker would answer some requests before page.route() sees them: blocked here,
  // allowed in e2e/pwa.spec.ts, which tests it.
  use: { baseURL, trace: 'on-first-retry', serviceWorkers: 'block' },
  webServer: {
    command: `npx vite build && npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
