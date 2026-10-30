import { NotebookPen } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'journal',
  icon: NotebookPen,
  accent: 'teal',
  keywords: ['diary', 'notes', 'mood', 'டைரி', 'डायरी'],
  strings: {
    en: {
      name: 'Journal',
      tagline: 'A private space for your thoughts',
      description: 'Write or speak your day. Private by default, searchable when you need it.',
    },
  },
});
