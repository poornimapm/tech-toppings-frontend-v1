import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { useModuleTiles } from '@/core/modules/queries';
import { slugOf } from '@/core/modules/registry';
import { pages } from '@/platform/shell/pages';
import { moduleHref } from '@/platform/welcome/module-style';

export interface ClientActionView {
  label: string;
  run: () => void;
}

type Handler = (args: Record<string, unknown>) => ClientActionView | null;

/**
 * What the UI does for each client tool an agent (or static script) handed over, by tool name.
 * A module lists its own in its manifest (`actions`), so a new module needs no change here.
 */
export function useClientActions(): (action: ClientAction) => ClientActionView | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tiles } = useModuleTiles();
  const handlers: Record<string, Handler> = {
    modules_open: ({ key }) => {
      const tile = tiles.find((item) => item.view.key === key);
      if (!tile) return null;
      return {
        label: t('welcome.tile.open', { name: tile.text.name }),
        run: () => void navigate(moduleHref(tile)),
      };
    },
    notifications_open: () => ({
      label: t('inbox.open'),
      run: () => void navigate(pages.notifications.path),
    }),
  };
  function moduleAction(action: ClientAction): ClientActionView | null {
    const tile = tiles.find((item) => item.definition.actions?.[action.tool] !== undefined);
    if (!tile?.view.available) return null;
    const page = tile.definition.actions?.[action.tool];
    const path = ['/m', slugOf(tile.view.key), page].filter(Boolean).join('/');
    return {
      label: t('welcome.tile.open', { name: tile.text.name }),
      // The page gets the whole action (see MODULE_ACTION), e.g. drafts to show.
      run: () => void navigate(path, { state: { [MODULE_ACTION]: action } }),
    };
  }
  return (action) => handlers[action.tool]?.(action.arguments) ?? moduleAction(action);
}
