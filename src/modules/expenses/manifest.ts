import { Wallet } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'expenses',
  icon: Wallet,
  accent: 'emerald',
  keywords: ['money', 'spending', 'budget', 'பணம்', 'செலவு', 'पैसा', 'बजट'],
  routes: [
    {
      index: true,
      lazy: async () => ({
        Component: (await import('@/modules/expenses/entries-page')).EntriesPage,
      }),
    },
    {
      path: 'entries/:id',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/entry-page')).EntryPage,
      }),
    },
  ],
  // Both of the assistant's client tools open the module's first page; drafts arrive there
  // with the action (capture-panel.tsx).
  actions: { expenses_open: '', expenses_draft: '' },
  // Only what the shell shows outside the module (tile, dashboard, feeds, assistant) is here;
  // the module's own screens are worded in ./i18n and load with them.
  strings: {
    en: {
      name: 'Expenses',
      tagline: "Say it, and it's tracked",
      description:
        'Track spending by voice or text in your own language, with budgets, categories and gentle insights.',
      stats: { month_total: 'this month' },
      widgets: {
        expenses_spent: 'Spent',
        expenses_received: 'Received',
        expenses_spent_daily: 'Spending per day',
      },
      feed: {
        'expenses.entry_added': 'Added “{{title}}” to {{module}}',
        'expenses.entry_updated': 'Edited “{{title}}” in {{module}}',
        'expenses.entry_deleted': 'Deleted “{{title}}” from {{module}}',
        'expenses.entry_undeleted': 'Brought “{{title}}” back to {{module}}',
        'expenses.entry_restored': 'Restored an earlier version of “{{title}}”',
      },
      replies: {
        'track-expenses.ready.open': 'Here are your expenses.',
        'track-expenses.ready.draft': "Here's what I understood. Check it in Expenses, then save.",
      },
    },
    ta: {
      name: 'செலவுகள்',
      tagline: 'சொன்னாலே பதிவாகும்',
      description:
        'உங்கள் மொழியில் குரல் அல்லது உரை மூலம் செலவுகளைப் பதிவு செய்யுங்கள்; பட்ஜெட், வகைகள், எளிய பார்வைகளுடன்.',
      stats: { month_total: 'இந்த மாதம்' },
      widgets: {
        expenses_spent: 'செலவு',
        expenses_received: 'வரவு',
        expenses_spent_daily: 'தினசரி செலவு',
      },
      feed: {
        'expenses.entry_added': '{{module}} இல் “{{title}}” சேர்க்கப்பட்டது',
        'expenses.entry_updated': '{{module}} இல் “{{title}}” திருத்தப்பட்டது',
        'expenses.entry_deleted': '{{module}} இலிருந்து “{{title}}” நீக்கப்பட்டது',
        'expenses.entry_undeleted': '{{module}} இல் “{{title}}” மீட்டெடுக்கப்பட்டது',
        'expenses.entry_restored': '“{{title}}” இன் முந்தைய பதிப்பு மீட்டமைக்கப்பட்டது',
      },
      replies: {
        'track-expenses.ready.open': 'இதோ உங்கள் செலவுகள்.',
        'track-expenses.ready.draft':
          'நான் புரிந்துகொண்டது இதோ. செலவுகளில் சரிபார்த்துச் சேமியுங்கள்.',
      },
    },
    hi: {
      name: 'खर्च',
      tagline: 'बोलिए, और दर्ज हो गया',
      description:
        'अपनी भाषा में आवाज़ या टेक्स्ट से खर्च दर्ज करें, बजट, श्रेणियों और आसान जानकारियों के साथ।',
      stats: { month_total: 'इस महीने' },
      widgets: {
        expenses_spent: 'खर्च',
        expenses_received: 'आमदनी',
        expenses_spent_daily: 'रोज़ का खर्च',
      },
      feed: {
        'expenses.entry_added': '{{module}} में “{{title}}” जोड़ा',
        'expenses.entry_updated': '{{module}} में “{{title}}” बदला',
        'expenses.entry_deleted': '{{module}} से “{{title}}” हटाया',
        'expenses.entry_undeleted': '{{module}} में “{{title}}” वापस लाया',
        'expenses.entry_restored': '“{{title}}” का पुराना संस्करण वापस लाया',
      },
      replies: {
        'track-expenses.ready.open': 'ये रहे आपके खर्च।',
        'track-expenses.ready.draft': 'मैंने यह समझा है। खर्च में जाँचकर सहेजें।',
      },
    },
  },
});
