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
    ta: {
      name: 'படிப்பு உதவி',
      tagline: 'திட்டமிடு, மீள்பார், நினைவில் வை',
      description:
        'உங்களுக்கு ஏற்ப மாறும் படிப்புத் திட்டங்கள், இடைவெளி மீள்பார்வை, சிறு வினாடி வினாக்கள்.',
    },
    hi: {
      name: 'पढ़ाई सहायक',
      tagline: 'योजना, दोहराना, याद रखना',
      description: 'आपके अनुसार बदलने वाली पढ़ाई योजनाएँ, अंतराल पर दोहराव और छोटे क्विज़।',
    },
  },
});
