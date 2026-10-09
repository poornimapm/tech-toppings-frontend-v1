import { UtensilsCrossed } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'meals',
  icon: UtensilsCrossed,
  accent: 'orange',
  keywords: ['food', 'recipe', 'cook', 'grocery', 'சமையல்', 'खाना'],
  strings: {
    en: {
      name: 'Meal planner',
      tagline: "What's cooking this week?",
      description: "Weekly menus, shopping lists and ideas from what's already in your kitchen.",
    },
    ta: {
      name: 'உணவுத் திட்டம்',
      tagline: 'இந்த வாரம் என்ன சமையல்?',
      description: 'வாராந்திர மெனு, வாங்கும் பட்டியல், சமையலறையில் இருப்பதைக் கொண்டு யோசனைகள்.',
    },
    hi: {
      name: 'भोजन योजना',
      tagline: 'इस हफ़्ते क्या पकेगा?',
      description: 'साप्ताहिक मेन्यू, खरीदारी सूची और रसोई में मौजूद चीज़ों से नए विचार।',
    },
  },
});
