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
    ta: {
      name: 'அரசு ஆவணங்கள்',
      tagline: 'அலைச்சல் இல்லாத புதுப்பிப்புகள்',
      description:
        'அடையாள அட்டைகள், சான்றிதழ்கள், அவற்றின் தேவைகள், புதுப்பிக்கும் நாள் அனைத்தையும் கண்காணியுங்கள்.',
    },
    hi: {
      name: 'सरकारी दस्तावेज़',
      tagline: 'बिना भागदौड़ के नवीनीकरण',
      description: 'पहचान पत्र और प्रमाणपत्र, उनकी ज़रूरतें और नवीनीकरण की तारीख़ें एक जगह।',
    },
  },
});
