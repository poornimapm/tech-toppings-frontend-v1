import { useModuleTiles } from '@/core/modules/queries';
import { fill } from '@/core/utils/fill';
import { moduleHref } from '@/platform/welcome/module-style';

/**
 * Where a notification or reminder leads: the page its module names for that code (manifest
 * `links`, filled from its params), else the module itself. Nothing when it isn't about a module.
 */
export function useNoticeHref(): (
  type: string,
  params: Record<string, unknown>,
) => string | undefined {
  const { tiles } = useModuleTiles();
  return (type, params) => {
    const tile = tiles.find((candidate) => candidate.view.key === params.module);
    if (!tile) return undefined;
    const page = tile.definition.links?.[type];
    return moduleHref(tile, page && encodeURI(fill(page, params)));
  };
}
