import { Repeat } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'habits',
  icon: Repeat,
  accent: 'violet',
  keywords: ['routine', 'streak', 'goal', 'பழக்கம்', 'आदत'],
  strings: {
    en: {
      name: 'Habit tracker',
      tagline: 'Small steps, every day',
      description: 'Build habits with streaks, gentle nudges and progress you can see.',
    },
  },
});
