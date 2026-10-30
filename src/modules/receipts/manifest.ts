import { Receipt } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

// Made by `poe new-module` (backend docs/modules/new-module.md), then grown (Phase 15).
export default defineModule({
  key: 'receipts',
  icon: Receipt,
  accent: 'amber',
  keywords: ['bill', 'invoice', 'warranty', 'guarantee', 'பில்', 'बिल'],
  routes: [
    {
      index: true,
      lazy: async () => ({
        Component: (await import('@/modules/receipts/receipts-page')).ReceiptsPage,
      }),
    },
    {
      path: 'new',
      lazy: async () => ({
        Component: (await import('@/modules/receipts/receipt-page')).ReceiptPage,
      }),
    },
    {
      path: ':id',
      lazy: async () => ({
        Component: (await import('@/modules/receipts/receipt-page')).ReceiptPage,
      }),
    },
  ],
  // A bill the assistant read opens a new receipt, filled in (receipt-page.tsx).
  actions: { receipts_draft: 'new' },
  links: { 'receipts.warranty_ends': '{{receipt_id}}' },
  // Only what the shell shows outside the module (tile, dashboard, feeds, search, assistant) is
  // here; the module's own screens are worded in ./i18n and load with them.
  strings: {
    en: {
      name: 'Receipts & warranty',
      tagline: 'Every bill, findable in seconds',
      description:
        'Keep every bill easy to find, scan one to fill it in, and get reminded before a warranty ends.',
      stats: { items: 'receipts' },
      widgets: { receipts_warranties_ending: 'Warranties ending soon' },
      feed: {
        'receipts.item_added': 'Kept “{{title}}” in {{module}}',
        'receipts.item_updated': 'Edited “{{title}}” in {{module}}',
        'receipts.item_deleted': 'Deleted “{{title}}” from {{module}}',
        'receipts.warranty_ends': 'The warranty on “{{title}}” ends {{due}}',
      },
      search: { receipt: 'Receipt' },
      replies: {
        'scan-bill.ready': 'I read the bill. Check the receipt, then save it.',
        'scan-bill.unreadable': "I couldn't read a bill in that.",
        'scan-bill.on_device': 'The photo is read on this device.',
      },
    },
  },
});
