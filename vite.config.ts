import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

import { pwa } from './vite-plugins/pwa.ts';

// Build-time settings. Browser-visible values use the VITE_ prefix (see src/core/config/env.ts);
// the variables read here configure only the dev/preview server and never reach the bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appName = env.VITE_APP_NAME ?? 'Tech-Toppings';
  const apiProxy = {
    '/api': {
      target: env.DEV_API_PROXY_TARGET ?? 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      pwa({
        entry: fileURLToPath(new URL('./src/sw/service-worker.ts', import.meta.url)),
        name: appName,
        shortName: appName,
        description: 'Your modular, voice-first personal toolkit.',
        themeColor: '#4f46e5', // --tt-primary, as in the icon
        backgroundColor: '#f8fafc', // --tt-bg (light): the splash screen while the app opens
        apiBase: env.VITE_API_BASE_URL ?? '/api',
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: Number(env.DEV_SERVER_PORT ?? 5173),
      strictPort: true,
      proxy: apiProxy,
    },
    preview: {
      port: Number(env.PREVIEW_SERVER_PORT ?? 4173),
      strictPort: true,
      proxy: apiProxy,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      // dist/.vite/manifest.json: which chunks each page needs, for the budget (npm run budget).
      manifest: true,
      rolldownOptions: {
        output: {
          // Long-lived vendor chunks: app deploys don't invalidate the browser's React cache.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[/](react|react-dom|scheduler)[/]/,
                priority: 30,
              },
              { name: 'router', test: /node_modules[/]react-router[/]/, priority: 20 },
              // Libraries only some pages use (drag and drop, dialogs, the command palette) stay
              // out of the shared vendor chunk, so they load on demand instead of on first paint.
              // Dialogs get a chunk of their own: the Welcome page and the palette share them.
              // (package.json "sideEffects" marks the design system as pure, so importing one
              // primitive from its index doesn't pull the dialog code into the first load.)
              {
                name: 'overlays',
                test: /node_modules[/](@radix-ui[/]|aria-hidden[/]|react-remove-scroll)/,
                priority: 15,
              },
              // Only what the shell needs on every page shares one long-lived chunk. Anything a
              // single group grabs loads with the first page, so the rest (forms, validation, the
              // animation engine behind LazyMotion, the icons only some pages draw) stays with
              // the pages that import it.
              {
                name: 'vendor',
                test: /node_modules[/](@tanstack|i18next|react-i18next|zustand|openapi-fetch|use-sync-external-store)[/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
      unstubEnvs: true,
      // First render of a lazy route compiles it; with coverage instrumentation that can take
      // several seconds on a slow machine.
      testTimeout: 15_000,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/core/api/schema.d.ts',
          'src/vite-env.d.ts',
        ],
        thresholds: { lines: 70, statements: 70, functions: 70, branches: 70 },
      },
    },
  };
});
