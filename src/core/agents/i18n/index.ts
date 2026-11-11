import en from '@/core/agents/i18n/en.json';
import hi from '@/core/agents/i18n/hi.json';
import ta from '@/core/agents/i18n/ta.json';
import { addModuleMessages } from '@/core/i18n/module-messages';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    agentRun: typeof en;
  }
}

/** The words of a background run's progress (its stages), loaded with the pages that follow
 *  one rather than with the first page: `useTranslation(RUN_NS)`. */
export const RUN_NS = 'agentRun';

addModuleMessages(RUN_NS, { en, ta, hi });
