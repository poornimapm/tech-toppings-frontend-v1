import 'i18next';

import type enCommon from '@/core/i18n/locales/en/common.json';
import type enErrors from '@/core/i18n/locales/en/errors.json';

// Type-checks translation keys: `t('status.online')` compiles, `t('status.onlin')` does not.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      errors: typeof enErrors;
    };
  }
}
