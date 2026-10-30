import { addModuleMessages } from '@/core/i18n/module-messages';
import en from '@/modules/labor/i18n/en.json';
import hi from '@/modules/labor/i18n/hi.json';
import ta from '@/modules/labor/i18n/ta.json';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    labor: typeof en;
  }
}

/** The module's own page text, loaded with its page: `useTranslation(NS)`. */
export const NS = 'labor';

addModuleMessages(NS, { en, ta, hi });
