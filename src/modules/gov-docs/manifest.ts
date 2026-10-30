import { Landmark } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'gov_docs',
  icon: Landmark,
  accent: 'indigo',
  keywords: ['passport', 'aadhaar', 'licence', 'license', 'id', 'certificate', 'ஆதார்', 'पासपोर्ट'],
  strings: {
    en: {
      name: 'Government documents',
      tagline: 'Renewals without the runaround',
      description: 'Keep track of IDs and certificates, what they need, and when to renew.',
    },
  },
});
