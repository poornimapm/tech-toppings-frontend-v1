import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n, {
  errorKey,
  languageFiles,
  shownLanguage,
  toLanguage,
  type Language,
} from '@/core/i18n';
import { useToasts } from '@/design-system';

// First in the file: a language downloads once per file, so each case uses one not loaded yet.
describe('a language that could not be downloaded', () => {
  const real = { ...languageFiles };

  /** Make downloads of the language's shell texts fail `times` times (always, by default). */
  function failDownload(language: Language, times = Infinity) {
    const file = `./locales/${language}/common.json`;
    const download = real[file];
    if (!download) throw new Error(`no ${file}`);
    const attempts = { count: 0 };
    languageFiles[file] = () =>
      ++attempts.count <= times ? Promise.reject(new Error('offline')) : download();
    return attempts;
  }

  /** Choose the language, with i18next's waits between retries run at once. */
  async function choose(language: Language) {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const changing = i18n.changeLanguage(language);
    await vi.advanceTimersByTimeAsync(5_000);
    await changing;
    vi.useRealTimers();
  }

  afterEach(() => {
    Object.assign(languageFiles, real);
  });

  it('is tried again, and shows once it arrives', async () => {
    const attempts = failDownload('ta', 2);

    await choose('ta');

    expect(attempts.count).toBe(3);
    expect(document.documentElement.lang).toBe('ta');
    expect(i18n.t('status.online')).toBe('இணைப்பில் உள்ளது');
    expect(useToasts.getState().toasts).toEqual([]);
  });

  it('shows English meanwhile, says so, and is fetched again when chosen again', async () => {
    i18n.addResourceBundle('hi', 'demo', { title: 'नमूना' }); // a module page's own texts
    failDownload('hi');

    await choose('hi');

    expect(shownLanguage()).toBe('en'); // the language actually shown
    expect(document.documentElement.lang).toBe('en');
    expect(i18n.t('status.online')).toBe('Online');
    expect(useToasts.getState().toasts.map((toast) => toast.message)).toEqual([
      "हिन्दी couldn't be downloaded, so the app shows English for now. Choose it again to retry.",
    ]);

    Object.assign(languageFiles, real);
    await i18n.changeLanguage('hi');

    expect(shownLanguage()).toBe('hi');
    expect(document.documentElement.lang).toBe('hi');
    expect(i18n.t('status.online')).toBe('ऑनलाइन');
  });
});

// Every language has every text: completeness.test.ts.
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
