import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '@/core/i18n';
import type { ModuleDefinition } from '@/core/modules/types';
import { expectSameKeysAndPlaceholders } from '@/test/translations';

/**
 * The missing-key check (Phase 11): every text in every language, for the shell and for each
 * module (its own pages, and what its manifest shows outside it). A new module is checked the
 * day its folder exists. CI runs it with the other tests.
 */
const shellMessages = import.meta.glob<{ default: unknown }>('/src/core/i18n/locales/*/*.json', {
  eager: true,
});
const moduleMessages = import.meta.glob<{ default: unknown }>('/src/modules/*/i18n/*.json', {
  eager: true,
});

/** The shell's namespace in every language: `{en: …, ta: …, hi: …}`. */
function shellBundles(namespace: string): Record<'en', unknown> & Record<string, unknown> {
  const bundles = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [
      language,
      shellMessages[`/src/core/i18n/locales/${language}/${namespace}.json`]?.default,
    ]),
  );
  return { en: bundles.en, ...bundles };
}
const manifests = import.meta.glob<{ default: ModuleDefinition }>('/src/modules/*/manifest.ts', {
  eager: true,
});

const folderOf = (path: string) => /\/src\/modules\/([^/]+)\//.exec(path)?.[1] ?? path;

function bundlesByModule(): [string, Record<string, unknown>][] {
  const byModule = new Map<string, Record<string, unknown>>();
  for (const [path, file] of Object.entries(moduleMessages)) {
    const language = /([a-z]+)\.json$/.exec(path)?.[1] ?? '';
    byModule.set(folderOf(path), { ...byModule.get(folderOf(path)), [language]: file.default });
  }
  return [...byModule];
}

/** Text a translator would have changed: words, not names, codes or placeholders alone. */
const WORDY = /[a-z]{3,}.*\s.*[a-z]{3,}/i;
/** English that stays English in every language: product and brand names. */
const NAMES = new Set(['Tech-Toppings', 'Google', 'Gemini', 'UPI', 'iPhone', 'iPad']);

function leaves(tree: unknown, prefix = ''): [string, string][] {
  if (typeof tree === 'string') return [[prefix, tree]];
  if (typeof tree !== 'object' || tree === null) return [];
  return Object.entries(tree).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** Keys whose Tamil or Hindi is still the English sentence. */
function untranslated(bundles: Record<string, unknown>): string[] {
  const english = new Map(leaves(bundles.en));
  return Object.entries(bundles)
    .filter(([language]) => language !== 'en')
    .flatMap(([language, bundle]) =>
      leaves(bundle)
        .filter(([key, text]) => text === english.get(key) && WORDY.test(text) && !NAMES.has(text))
        .map(([key]) => `${language} ${key}`),
    );
}

describe('every text in every language', () => {
  it.each(['common', 'errors'])('the shell’s %s', (namespace) => {
    const bundles = shellBundles(namespace);
    expectSameKeysAndPlaceholders(bundles);
    expect(untranslated(bundles)).toEqual([]);
  });

  it.each(bundlesByModule())('the %s module’s own pages', (_module, bundles) => {
    expect(Object.keys(bundles).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    expectSameKeysAndPlaceholders({ en: bundles.en, ...bundles });
    expect(untranslated(bundles)).toEqual([]);
  });

  it.each(Object.entries(manifests).map(([path, file]) => [folderOf(path), file.default] as const))(
    'what the %s module shows outside it (tile, feed, assistant)',
    (_module, definition) => {
      const strings = definition.strings as Record<string, unknown>;
      expect(Object.keys(strings).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
      expectSameKeysAndPlaceholders({ en: strings.en, ...strings });
      expect(untranslated(strings)).toEqual([]);
    },
  );
});
