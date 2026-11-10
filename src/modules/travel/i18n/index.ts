import { addModuleMessages } from '@/core/i18n/module-messages';
import en from '@/modules/travel/i18n/en.json';
import hi from '@/modules/travel/i18n/hi.json';
import ta from '@/modules/travel/i18n/ta.json';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    travel: typeof en;
  }
}

/** The module's own page text, loaded with its page: `useTranslation(NS)`. */
export const NS = 'travel';

addModuleMessages(NS, { en, ta, hi });
