import { GraduationCap } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'study',
  icon: GraduationCap,
  accent: 'sky',
  keywords: ['learn', 'exam', 'school', 'revision', 'படிப்பு', 'पढ़ाई'],
  strings: {
    en: {
      name: 'Study helper',
      tagline: 'Plan, revise, remember',
      description: 'Study plans, spaced revision and quick quizzes that adapt to you.',
    },
  },
});
