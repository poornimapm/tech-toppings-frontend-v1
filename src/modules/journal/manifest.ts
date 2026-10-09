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
    ta: {
      name: 'நாட்குறிப்பு',
      tagline: 'உங்கள் எண்ணங்களுக்கு ஒரு தனி இடம்',
      description:
        'உங்கள் நாளை எழுதுங்கள் அல்லது பேசுங்கள். இயல்பாகவே தனிப்பட்டது, தேவைப்படும்போது தேடலாம்.',
    },
    hi: {
      name: 'डायरी',
      tagline: 'आपके विचारों के लिए निजी जगह',
      description: 'अपना दिन लिखिए या बोलिए। हमेशा निजी, ज़रूरत पड़ने पर खोजने योग्य।',
    },
  },
});
