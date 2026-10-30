import { addModuleMessages } from '@/core/i18n/module-messages';
import en from '@/modules/receipts/i18n/en.json';
import hi from '@/modules/receipts/i18n/hi.json';
import ta from '@/modules/receipts/i18n/ta.json';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    receipts: typeof en;
  }
}

/** The module's own page text, loaded with its page: `useTranslation(NS)`. */
export const NS = 'receipts';

addModuleMessages(NS, { en, ta, hi });
