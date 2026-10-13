import { useTranslation } from 'react-i18next';

import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import { fill } from '@/core/utils/fill';

/** Feed codes come from the server at runtime, so their keys can't be checked at compile time. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

/**
 * Text for an activity entry or notification. The server sends a `code` + `params` (ADR-0009);
 * `params.module` is a module key and is shown as that module's name in the user's language.
 *
 * A module words its own entries in its manifest (`strings.feed`), so a new module needs no
 * change here; the shell's own are in `feed.<code>`. An unknown code is shown as the code.
 */
export function useFeedText(): (code: string, params: Record<string, unknown>) => string {
  const { t, i18n } = useTranslation();
  const registry = useModuleRegistry();
  return (code, params) => {
    const strings =
      typeof params.module === 'string'
        ? textFor(registry.definitionFor(params.module), i18n.language)
        : undefined;
    const values = { ...params, module: strings?.name };
    const own = strings?.feed?.[code];
    if (own) return fill(own, values);
    return (t as unknown as LooseT)(`feed.${code}`, { ...values, defaultValue: code });
  };
}
