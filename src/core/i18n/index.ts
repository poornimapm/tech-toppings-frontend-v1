import i18n, { type BackendModule, type ResourceKey } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/core/i18n/locales/en/common.json';
import enErrors from '@/core/i18n/locales/en/errors.json';
import { toast } from '@/design-system';

export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Each language named in its own script, so people can find theirs whatever is selected. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
};

export type ErrorCodeKey = keyof typeof enErrors;

/** Map a server error code to its translation key; unknown codes fall back to UNKNOWN. */
export function errorKey(code: string): ErrorCodeKey {
  return Object.hasOwn(enErrors, code) ? (code as ErrorCodeKey) : 'UNKNOWN';
}

export function toLanguage(value: string | undefined): Language {
  const base = value?.split('-')[0];
  return SUPPORTED_LANGUAGES.find((language) => language === base) ?? 'en';
}

/**
 * English ships with the first page (it is every language's fallback too); Tamil and Hindi are
 * fetched when chosen (Phase 11's performance budget). Module namespaces arrive with their pages
 * (module-messages.ts), so only the shell's namespaces are read here. Exported so tests can make
 * a download fail.
 */
export const languageFiles = import.meta.glob<{ default: ResourceKey }>('./locales/{ta,hi}/*.json');

const otherLanguages: BackendModule = {
  type: 'backend',
  init: () => undefined,
  read: (language, namespace, callback) => {
    const load = languageFiles[`./locales/${language}/${namespace}.json`];
    if (!load) {
      callback(null, {}); // a module namespace, or English: already there
      return;
    }
    load().then(
      (file) => {
        callback(null, file.default);
      },
      (error: unknown) => {
        // `true` asks i18next to retry (with backoff), and to fetch again when chosen again.
        callback(error instanceof Error ? error : new Error(String(error)), true);
      },
    );
  },
};

/** The language the shell is actually shown in: the chosen one once its texts are loaded, else
 *  English (a module page's texts alone don't count). */
export function shownLanguage(): Language {
  const chosen = toLanguage(i18n.language);
  return i18n.hasResourceBundle(chosen, 'common') ? chosen : 'en';
}

/** <html lang> follows the language actually shown: one whose texts couldn't be downloaded
 *  shows in English, and the user is told. */
i18n.on('languageChanged', (chosen) => {
  const shown = shownLanguage();
  document.documentElement.lang = shown;
  const language = toLanguage(chosen);
  if (shown !== language) {
    toast(i18n.t('language.loadFailed', { name: LANGUAGE_NAMES[language] }), { tone: 'danger' });
  }
});

/** Settles once the first language's text is loaded: the app renders after it, never in a
 *  flash of English. */
export const i18nReady = i18n
  .use(otherLanguages)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: enCommon, errors: enErrors } },
    partialBundledLanguages: true,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    ns: ['common', 'errors'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React already escapes output
    react: { useSuspense: false }, // a language being fetched shows English, then its own
    // A failed download is tried twice more (about a second, so the first page never waits
    // long), then shows English until the language is chosen again.
    maxRetries: 2,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tt-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
