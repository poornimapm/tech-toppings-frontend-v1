import { addModuleMessages } from '@/core/i18n/module-messages';
import en from '@/core/scan/i18n/en.json';
import hi from '@/core/scan/i18n/hi.json';
import ta from '@/core/scan/i18n/ta.json';

declare module '@/core/i18n/module-messages' {
  interface ModuleMessages {
    scan: typeof en;
  }
}

/** The scan's own words (where a photo goes, the reader's states), loaded with the pages that
 *  scan rather than with the first page: `useTranslation(SCAN_NS)`. */
export const SCAN_NS = 'scan';

addModuleMessages(SCAN_NS, { en, ta, hi });
