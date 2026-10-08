import { useTranslation } from 'react-i18next';

import { nextPreference, useThemeStore, type ThemePreference } from '@/core/theme/theme-store';
import { Button } from '@/design-system';

const ICONS: Record<ThemePreference, string> = { light: '☀', dark: '☾', system: '◐' };

/** Cycles light → dark → system. The accessible name states the current and next theme. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const next = nextPreference(preference);

  return (
    <Button
      variant="ghost"
      aria-label={t('theme.toggle', {
        current: t(`theme.${preference}`),
        next: t(`theme.${next}`),
      })}
      onClick={() => {
        setPreference(next);
      }}
    >
      <span aria-hidden="true">{ICONS[preference]}</span>
      <span className="hidden sm:inline">{t(`theme.${preference}`)}</span>
    </Button>
  );
}
