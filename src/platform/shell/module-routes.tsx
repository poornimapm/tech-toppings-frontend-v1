import type { RouteObject } from 'react-router';

import { moduleRegistry, slugOf, type ModuleRegistry } from '@/core/modules/registry';
import { ModuleGate } from '@/platform/shell/module-gate';

/** `/m/<slug>/*` for every module that ships pages, each behind its availability gate. */
export function moduleRoutes(registry: ModuleRegistry = moduleRegistry): RouteObject[] {
  return registry
    .all()
    .filter((definition) => definition.routes?.length)
    .map((definition) => ({
      path: `m/${slugOf(definition.key)}`,
      element: <ModuleGate moduleKey={definition.key} />,
      children: definition.routes,
    }));
}
