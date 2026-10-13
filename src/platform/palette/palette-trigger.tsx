import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { usePalette } from '@/platform/palette/palette-store';

/** Header button for the command palette, showing its shortcut. */
export function PaletteTrigger() {
  const { t } = useTranslation();
  const setOpen = usePalette((state) => state.setOpen);
  return (
    <button
      type="button"
      aria-keyshortcuts="Control+K Meta+K"
      onClick={() => {
        setOpen(true);
      }}
      className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-2.5 py-1.5 text-sm text-muted shadow-sm transition hover:border-primary hover:text-text"
    >
      <Search aria-hidden="true" className="size-4" />
      <span className="sr-only md:not-sr-only">{t('palette.trigger')}</span>
      <kbd
        aria-hidden="true"
        className="hidden rounded-md border border-border bg-bg px-1.5 font-sans text-xs md:inline"
      >
        Ctrl K
      </kbd>
    </button>
  );
}
