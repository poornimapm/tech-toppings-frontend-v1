import { describe, expect, it } from 'vitest';

import i18n, { errorKey, resources, toLanguage } from '@/core/i18n';
import { expectSameKeysAndPlaceholders } from '@/test/translations';

describe('translations', () => {
  it.each(['common', 'errors'] as const)(
    '%s has the same keys and placeholders in every language',
    (namespace) => {
      expectSameKeysAndPlaceholders({
        en: resources.en[namespace],
        ta: resources.ta[namespace],
        hi: resources.hi[namespace],
      });
    },
  );
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
