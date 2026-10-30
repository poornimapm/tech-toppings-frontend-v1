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
  },
});
