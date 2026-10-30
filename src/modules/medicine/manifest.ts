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
  },
});
