import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { ClientAction } from '@/core/agents/queries';
import { useModuleTiles } from '@/core/modules/queries';
import { moduleHref } from '@/platform/palette/commands';

export interface ClientActionView {
  label: string;
  run: () => void;
}

type Handler = (args: Record<string, unknown>) => ClientActionView | null;

/** What the UI does for each client tool an agent (or static script) handed over, by tool name. */
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
  };
  return (action) => handlers[action.tool]?.(action.arguments) ?? null;
}
