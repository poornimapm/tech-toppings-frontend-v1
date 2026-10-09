import { Receipt } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'receipts',
  icon: Receipt,
  accent: 'amber',
  keywords: ['bill', 'invoice', 'warranty', 'guarantee', 'பில்', 'बिल'],
  strings: {
    en: {
      name: 'Receipts & warranty',
      tagline: 'Every bill, findable in seconds',
      description: 'Snap receipts, track warranties and get reminded before they expire.',
    },
    ta: {
      name: 'ரசீதுகள் & உத்தரவாதம்',
      tagline: 'ஒவ்வொரு பில்லும் நொடியில் கிடைக்கும்',
      description:
        'ரசீதுகளைப் படம் எடுங்கள், உத்தரவாதங்களைக் கண்காணியுங்கள், காலாவதியாகும் முன் நினைவூட்டல் பெறுங்கள்.',
    },
    hi: {
      name: 'रसीदें और वारंटी',
      tagline: 'हर बिल, सेकंडों में',
      description: 'रसीदों की फ़ोटो लें, वारंटी ट्रैक करें और खत्म होने से पहले याद पाएँ।',
    },
  },
});
