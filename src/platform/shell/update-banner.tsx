import { useTranslation } from 'react-i18next';

import { usePwa } from '@/core/pwa/pwa-store';
import { Button } from '@/design-system';

/** A new version has been downloaded: it starts when the user chooses, never mid-task. */
export function UpdateBanner() {
  const { t } = useTranslation();
  const waiting = usePwa((state) => state.waiting);
  const updating = usePwa((state) => state.updating);
  const applyUpdate = usePwa((state) => state.applyUpdate);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 border-b border-border bg-surface px-4 py-2 text-sm print:hidden"
    >
      <p>{t('banner.update')}</p>
      {/* Busy, never disabled: if the user stays at the leave prompt (unsaved work), the reload
          is cancelled, and an installed app has no browser reload to fall back on. */}
      <Button variant="secondary" aria-busy={updating} onClick={applyUpdate}>
        {t('banner.reload')}
      </Button>
    </div>
  );
}
