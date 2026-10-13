import 'i18next';

import type enCommon from '@/core/i18n/locales/en/common.json';
import type enErrors from '@/core/i18n/locales/en/errors.json';
import type { ModuleMessages } from '@/core/i18n/module-messages';

// Type-checks translation keys: `t('status.online')` compiles, `t('status.onlin')` does not.
// Modules add their own namespace through ModuleMessages.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      errors: typeof enErrors;
    } & ModuleMessages;
  }
}
