import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { useThemeStore } from '@/core/theme/theme-store';

/** When an account signs in, its saved language and theme take over on this device.
 *  (Changes the user makes are saved back by the language/theme controls themselves.) */
export function PreferenceSync() {
  const { i18n } = useTranslation();
  const user = useSession((state) => state.user);
  const appliedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || appliedFor.current === user.id) return;
    appliedFor.current = user.id;
    void i18n.changeLanguage(user.locale);
    useThemeStore.getState().setPreference(user.theme);
  }, [user, i18n]);

  return null;
}
