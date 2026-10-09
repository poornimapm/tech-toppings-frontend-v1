import { useTranslation } from 'react-i18next';

import { useModuleInterest, useModulePreferences, useReorderModules } from '@/core/modules/queries';
import type { ModuleTile } from '@/core/modules/types';
import { toast } from '@/design-system';

/**
 * What the Welcome page can do to a module, with feedback: the change shows at once
 * (optimistic), a toast confirms it (with Undo where that makes sense), and a failure rolls
 * the change back and says so.
 */
export function useModuleActions() {
  const { t } = useTranslation();
  const preferences = useModulePreferences();
  const interest = useModuleInterest();
  const reorder = useReorderModules();

  const failed = () => toast(t('welcome.toast.failed'), { tone: 'danger' });

  function setPinned(tile: ModuleTile, pinned: boolean, undoable = true) {
    const name = tile.text.name;
    preferences.mutate(
      { key: tile.view.key, pinned },
      {
        onSuccess: () =>
          toast(t(pinned ? 'welcome.toast.pinned' : 'welcome.toast.unpinned', { name }), {
            tone: 'success',
            ...(undoable && {
              action: {
                label: t('actions.undo'),
                onAction: () => {
                  setPinned(tile, !pinned, false);
                },
              },
            }),
          }),
        onError: failed,
      },
    );
  }

  function setVisible(tile: ModuleTile, enabled: boolean, undoable = true) {
    const name = tile.text.name;
    preferences.mutate(
      { key: tile.view.key, enabled },
      {
        onSuccess: () =>
          toast(t(enabled ? 'welcome.toast.shown' : 'welcome.toast.hidden', { name }), {
            tone: 'success',
            ...(undoable && {
              action: {
                label: t('actions.undo'),
                onAction: () => {
                  setVisible(tile, !enabled, false);
                },
              },
            }),
          }),
        onError: failed,
      },
    );
  }

  function setNotify(tile: ModuleTile, wanted: boolean) {
    const name = tile.text.name;
    interest.mutate(
      { key: tile.view.key, wanted },
      {
        onSuccess: () =>
          toast(t(wanted ? 'welcome.toast.notifyOn' : 'welcome.toast.notifyOff', { name }), {
            tone: 'success',
          }),
        onError: failed,
      },
    );
  }

  function arrange(keys: string[]) {
    reorder.mutate(keys, { onError: failed });
  }

  return { setPinned, setVisible, setNotify, arrange };
}
