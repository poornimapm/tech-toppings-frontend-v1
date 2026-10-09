import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Build-time settings. Browser-visible values use the VITE_ prefix (see src/core/config/env.ts);
// the variables read here configure only the dev/preview server and never reach the bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = {
    '/api': {
      target: env.DEV_API_PROXY_TARGET ?? 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react(), tailwindcss()],
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
              // Libraries only some pages use (drag and drop, dialogs) stay out of the shared
              // vendor chunk, so they load with those pages instead of on first paint.
              {
                name: 'vendor',
                test: /node_modules[/](?!@dnd-kit[/]|@radix-ui[/]|aria-hidden[/]|react-remove-scroll)/,
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
