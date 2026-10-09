import { Pill } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'medicine',
  icon: Pill,
  accent: 'rose',
  keywords: ['pills', 'health', 'reminder', 'dose', 'மாத்திரை', 'दवा'],
  strings: {
    en: {
      name: 'Medicine',
      tagline: 'Doses on time, refills before you run out',
      description: 'Schedules, reminders and refill alerts for everyone you care for.',
    },
    ta: {
      name: 'மருந்துகள்',
      tagline: 'சரியான நேரத்தில் மருந்து, தீரும் முன் நினைவூட்டல்',
      description:
        'நீங்கள் கவனிக்கும் அனைவருக்கும் அட்டவணை, நினைவூட்டல்கள், மறுநிரப்பு எச்சரிக்கைகள்.',
    },
    hi: {
      name: 'दवाइयाँ',
      tagline: 'समय पर खुराक, खत्म होने से पहले याद',
      description: 'आप जिनका ध्यान रखते हैं, उन सबके लिए समय-सारणी, रिमाइंडर और रीफ़िल अलर्ट।',
    },
  },
});
