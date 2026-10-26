import { ALargeSmall } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSavePreferences } from '@/core/auth/use-save-preferences';
import { useSimpleMode } from '@/core/theme/ui-mode';
import { Button } from '@/design-system';

/** Simple mode on or off, for the account: larger type, fewer fields, a voice-first home. */
export function UiModeToggle() {
  const { t } = useTranslation();
  const simple = useSimpleMode();
  const save = useSavePreferences();

  return (
    <Button
      variant="ghost"
      aria-pressed={simple}
      title={t('uiMode.simple')}
      onClick={() => {
        save({ ui_mode: simple ? 'standard' : 'simple' });
      }}
    >
      <ALargeSmall aria-hidden="true" className="size-4" />
      <span className="sr-only">{t('uiMode.simple')}</span>
    </Button>
  );
}
