import { describe, expect, it } from 'vitest';

import i18n, { errorKey, resources, SUPPORTED_LANGUAGES, toLanguage } from '@/core/i18n';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
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

  it('keeps interpolation placeholders in every language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(resources[language].common.theme.toggle).toContain('{{current}}');
      expect(resources[language].common.theme.toggle).toContain('{{next}}');
      expect(resources[language].common.welcome.title).toContain('{{appName}}');
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
