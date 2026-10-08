import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/core/i18n/locales/en/common.json';
import enErrors from '@/core/i18n/locales/en/errors.json';
import hiCommon from '@/core/i18n/locales/hi/common.json';
import hiErrors from '@/core/i18n/locales/hi/errors.json';
import taCommon from '@/core/i18n/locales/ta/common.json';
import taErrors from '@/core/i18n/locales/ta/errors.json';

export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Each language named in its own script, so people can find theirs whatever is selected. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
};

export const resources = {
  en: { common: enCommon, errors: enErrors },
  ta: { common: taCommon, errors: taErrors },
  hi: { common: hiCommon, errors: hiErrors },
} as const;

export type ErrorCodeKey = keyof typeof enErrors;

/** Map a server error code to its translation key; unknown codes fall back to UNKNOWN. */
export function errorKey(code: string): ErrorCodeKey {
  return Object.hasOwn(enErrors, code) ? (code as ErrorCodeKey) : 'UNKNOWN';
}

export function toLanguage(value: string | undefined): Language {
  const base = value?.split('-')[0];
  return SUPPORTED_LANGUAGES.find((language) => language === base) ?? 'en';
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = toLanguage(language);
});

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    ns: ['common', 'errors'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React already escapes output
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tt-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
