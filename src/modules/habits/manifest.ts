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
    ta: {
      name: 'பழக்கக் கண்காணிப்பு',
      tagline: 'தினமும் சிறு அடிகள்',
      description:
        'தொடர் நாட்கள், மென்மையான நினைவூட்டல்கள், கண்ணுக்குத் தெரியும் முன்னேற்றத்துடன் பழக்கங்களை உருவாக்குங்கள்.',
    },
    hi: {
      name: 'आदत ट्रैकर',
      tagline: 'हर दिन छोटे कदम',
      description: 'लगातार दिनों की गिनती, हल्के रिमाइंडर और दिखने वाली प्रगति के साथ आदतें बनाइए।',
    },
  },
});
