import { Wallet } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'expenses',
  icon: Wallet,
  accent: 'emerald',
  keywords: ['money', 'spending', 'budget', 'பணம்', 'செலவு', 'पैसा', 'बजट'],
  strings: {
    en: {
      name: 'Expenses',
      tagline: "Say it, and it's tracked",
      description:
        'Track spending by voice or text in your own language, with budgets, categories and gentle insights.',
      stats: { month_total: 'this month' },
    },
    ta: {
      name: 'செலவுகள்',
      tagline: 'சொன்னாலே பதிவாகும்',
      description:
        'உங்கள் மொழியில் குரல் அல்லது உரை மூலம் செலவுகளைப் பதிவு செய்யுங்கள்; பட்ஜெட், வகைகள், எளிய பார்வைகளுடன்.',
      stats: { month_total: 'இந்த மாதம்' },
    },
    hi: {
      name: 'खर्च',
      tagline: 'बोलिए, और दर्ज हो गया',
      description:
        'अपनी भाषा में आवाज़ या टेक्स्ट से खर्च दर्ज करें, बजट, श्रेणियों और आसान जानकारियों के साथ।',
      stats: { month_total: 'इस महीने' },
    },
  },
});
