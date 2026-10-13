import i18n, { SUPPORTED_LANGUAGES, type Language } from '@/core/i18n';

/**
 * A module's own interface text lives in its folder and loads with its pages, under a
 * namespace named after the module: `useTranslation('expenses')`.
 *
 * A module adds its English shape here, so its keys are checked at compile time like the
 * shell's:
 *
 *   declare module '@/core/i18n/module-messages' {
 *     interface ModuleMessages { expenses: typeof en }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- filled in by modules
export interface ModuleMessages {}

/** Every supported language is required: a module can't ship half-translated. */
export function addModuleMessages(namespace: string, messages: Record<Language, object>): void {
  for (const language of SUPPORTED_LANGUAGES) {
    i18n.addResourceBundle(language, namespace, messages[language], true, true);
  }
}
