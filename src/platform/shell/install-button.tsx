import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { usePwa } from '@/core/pwa/pwa-store';
import { Button } from '@/design-system';

/** Shown only while the browser offers to install the app on this device. */
export function InstallButton() {
  const { t } = useTranslation();
  const offered = usePwa((state) => state.installPrompt !== null);
  const install = usePwa((state) => state.install);

  if (!offered) return null;
  return (
    <Button variant="ghost" title={t('pwa.install')} onClick={() => void install()}>
      <Download aria-hidden="true" className="size-4" />
      <span className="sr-only">{t('pwa.install')}</span>
    </Button>
  );
}
