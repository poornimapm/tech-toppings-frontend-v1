import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useSavePreferences } from '@/core/auth/use-save-preferences';
import { LANGUAGE_NAMES, shownLanguage, SUPPORTED_LANGUAGES, toLanguage } from '@/core/i18n';

/** Shows the language actually shown, not the one chosen: after a failed download that is
 *  English, so choosing the other language again is a change, and retries it. */
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
        value={shownLanguage()}
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
