import { readdirSync } from 'node:fs';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'src/core/api/schema.d.ts', // generated (npm run gen:api)
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.strict,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: globals.browser,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Import through the @/ alias instead of climbing directories.',
            },
          ],
        },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Tailwind removes list bullets, and Safari/VoiceOver then stops announcing lists:
      // an explicit role="list" restores that, so it is not redundant here.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
    },
  },
  // Feature modules (ADR-0001): independent of each other and of platform internals. They
  // build on src/core (API client, module types, i18n), the design system and their own folder.
  ...readdirSync('src/modules').map((module) => ({
    files: [`src/modules/${module}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Import through the @/ alias instead of climbing directories.',
            },
            {
              group: ['@/platform/*', '@/modules/*', `!@/modules/${module}`],
              message:
                'Modules use @/core, @/design-system and their own folder only; never platform internals or another module.',
            },
          ],
        },
      ],
    },
  })),
  {
    // Node-side TypeScript (configs, build plugins, e2e).
    files: [
      'vite.config.ts',
      'vite-plugins/**/*.ts',
      'playwright.config.ts',
      'e2e/**/*.ts',
      'scripts/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    // Node runs scripts as they are, and knows no @/ alias: they reach the app's code by path.
    files: ['scripts/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // The service worker runs in its own global scope, without the DOM.
    files: ['src/sw/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    // Plain JavaScript (this file, scripts): no type information available.
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
