import { describe, expect, it } from 'vitest';

import i18n, { errorKey, resources, SUPPORTED_LANGUAGES, toLanguage } from '@/core/i18n';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function valueAt(tree: unknown, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], tree);
  return String(value);
}

describe('translations', () => {
  it.each(SUPPORTED_LANGUAGES.filter((language) => language !== 'en'))(
    '%s has exactly the same keys as English',
    (language) => {
      for (const namespace of ['common', 'errors'] as const) {
        expect(keyPaths(resources[language][namespace]).sort()).toEqual(
          keyPaths(resources.en[namespace]).sort(),
        );
      }
    },
  );

  it('keeps every interpolation placeholder in every language', () => {
    const english = resources.en;
    for (const language of SUPPORTED_LANGUAGES) {
      for (const namespace of ['common', 'errors'] as const) {
        for (const path of keyPaths(english[namespace])) {
          const source = valueAt(english[namespace], path);
          const translated = valueAt(resources[language][namespace], path);
          for (const placeholder of source.match(/{{\w+}}/g) ?? []) {
            expect(translated, `${language} ${namespace}:${path}`).toContain(placeholder);
          }
        }
      }
    }
  });
});

describe('language handling', () => {
  it('maps regional and unknown tags to supported languages', () => {
    expect(toLanguage('ta-IN')).toBe('ta');
    expect(toLanguage('hi')).toBe('hi');
    expect(toLanguage('fr-FR')).toBe('en');
    expect(toLanguage(undefined)).toBe('en');
  });

  it('updates <html lang> and remembers the choice', async () => {
    await i18n.changeLanguage('hi');

    expect(document.documentElement.lang).toBe('hi');
    expect(localStorage.getItem('tt-language')).toBe('hi');
    expect(i18n.t('status.online')).toBe('ऑनलाइन');
  });

  it('maps server error codes to translation keys with a safe fallback', () => {
    expect(errorKey('SERVICE_NOT_READY')).toBe('SERVICE_NOT_READY');
    expect(errorKey('SOMETHING_NEW')).toBe('UNKNOWN');
    expect(errorKey('toString')).toBe('UNKNOWN');
  });
});
