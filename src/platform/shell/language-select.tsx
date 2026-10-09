import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useSavePreferences } from '@/core/auth/use-save-preferences';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, toLanguage } from '@/core/i18n';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const savePreferences = useSavePreferences();
  const id = useId();

  return (
    <div className="flex items-center">
      <label htmlFor={id} className="sr-only">
        {t('language.label')}
      </label>
      <select
        id={id}
        value={toLanguage(i18n.resolvedLanguage)}
        onChange={(event) => {
          const language = toLanguage(event.target.value);
          void i18n.changeLanguage(language);
          savePreferences({ locale: language });
        }}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
