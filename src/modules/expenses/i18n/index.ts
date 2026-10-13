import { addModuleMessages } from '@/core/i18n/module-messages';
import en from '@/modules/expenses/i18n/en.json';
import hi from '@/modules/expenses/i18n/hi.json';
import ta from '@/modules/expenses/i18n/ta.json';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    expenses: typeof en;
  }
}

/** The module's translation namespace: `useTranslation(NS)`. Loaded with its pages. */
export const NS = 'expenses';
export const messages = { en, ta, hi };

addModuleMessages(NS, messages);
