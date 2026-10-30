import { Wallet } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

export default defineModule({
  key: 'expenses',
  icon: Wallet,
  accent: 'emerald',
  keywords: [
    'money',
    'spending',
    'budget',
    'savings',
    'பணம்',
    'செலவு',
    'சேமிப்பு',
    'पैसा',
    'बजट',
    'बचत',
  ],
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
    {
      path: 'overview',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/overview-page')).OverviewPage,
      }),
    },
    {
      path: 'prices',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/prices-page')).PricesPage,
      }),
    },
    {
      path: 'prices/:id',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/product-page')).ProductPage,
      }),
    },
    {
      path: 'plan',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/plan-page')).PlanPage,
      }),
    },
    {
      path: 'report',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/report-page')).ReportPage,
      }),
    },
    {
      path: 'import',
      lazy: async () => ({
        Component: (await import('@/modules/expenses/import-page')).ImportPage,
      }),
    },
  ],
  // The pages the assistant's client tools open; drafts, loans and product matches arrive there
  // with the action (capture-panel.tsx, prices-page.tsx).
  actions: {
    expenses_open: '',
    expenses_draft: '',
    expenses_iou_draft: '',
    expenses_product_matches: 'prices',
  },
  links: {
    'expenses.price_alert': 'prices/{{product_id}}',
    'expenses.budget_near': 'plan?show=budgets&focus={{budget_id}}',
    'expenses.budget_over': 'plan?show=budgets&focus={{budget_id}}',
    'expenses.goal_reached': 'plan?show=goals&focus={{goal_id}}',
    'expenses.bill_due': 'plan?show=bills&focus={{rule_id}}',
    'expenses.iou_due_lent': 'plan?show=loans&focus={{iou_id}}',
    'expenses.iou_due_borrowed': 'plan?show=loans&focus={{iou_id}}',
  },
  // What was saved or said offline (ADR-0010): loaded only when such an item waits to be sent.
  outbox: {
    'expenses.entry': async () => (await import('@/modules/expenses/outbox')).sendEntry,
    'expenses.capture': async () => (await import('@/modules/expenses/outbox')).sendCapture,
  },
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
        'expenses.entries_changed': 'Changed {{count}} entries in {{module}} at once',
        'expenses.entries_deleted': 'Deleted {{count}} entries from {{module}}',
        'expenses.entries_undeleted': 'Brought {{count}} entries back to {{module}}',
        'expenses.entries_imported': 'Entries imported into {{module}} from a file: {{count}}',
        'expenses.entry_restored': 'Restored an earlier version of “{{title}}”',
        'expenses.price_alert':
          '{{product}} cost {{price}}/{{unit}}, more than the {{limit}} you set',
        'expenses.budget_near': '“{{name}}” budget: {{pct}}% used, {{spent}} of {{limit}}',
        'expenses.budget_over': '“{{name}}” budget is over: {{spent}} of {{limit}}',
        'expenses.goal_reached': 'You reached your goal “{{name}}”: {{target}} saved',
        'expenses.bill_due': '“{{title}}” is due {{due}}: {{amount}}',
        'expenses.iou_due_lent': '{{person}} is due to pay you back {{outstanding}} by {{due}}',
        'expenses.iou_due_borrowed': "You're due to pay {{person}} back {{outstanding}} by {{due}}",
      },
      search: {
        saved_filter: 'Saved view',
        loan_lent: 'Owed to you',
        loan_borrowed: 'You owe',
        product: 'Prices',
        entry_expense: 'Spent',
        entry_income: 'Received',
      },
      replies: {
        'ask-expenses.total.expense': 'You spent {{amount}} from {{from}} to {{to}}.',
        'ask-expenses.total.income': 'You received {{amount}} from {{from}} to {{to}}.',
        'ask-expenses.count.expense': '{{count}} expenses from {{from}} to {{to}}.',
        'ask-expenses.count.income': '{{count}} times money came in from {{from}} to {{to}}.',
        'ask-expenses.average.expense':
          '{{amount}} an expense on average ({{count}} of them), from {{from}} to {{to}}.',
        'ask-expenses.average.income':
          '{{amount}} on average each time money came in ({{count}} times), from {{from}} to {{to}}.',
        'ask-expenses.largest.expense':
          'The biggest expense was {{amount}}, from {{from}} to {{to}}.',
        'ask-expenses.largest.income':
          'The most that came in at once was {{amount}}, from {{from}} to {{to}}.',
        'ask-expenses.top.1': 'From {{from}} to {{to}}, it was all {{first_name}}: {{first}}.',
        'ask-expenses.top.2':
          'From {{from}} to {{to}}, most went to {{first_name}} ({{first}}), then {{second_name}} ({{second}}).',
        'ask-expenses.top.3':
          'From {{from}} to {{to}}, most went to {{first_name}} ({{first}}), then {{second_name}} ({{second}}) and {{third_name}} ({{third}}).',
        'ask-expenses.none': 'Nothing found from {{from}} to {{to}}.',
        'track-expenses.ready.open': 'Here are your expenses.',
        'track-expenses.ready.draft': "Here's what I understood. Check it in Expenses, then save.",
        'track-expenses.ready.iou':
          "Here's what I understood, as a loan. Check it in Expenses, then save.",
        'tidy-products.ready.find':
          'Some of your products look like the same thing. Check them in Prices.',
        'tidy-products.none': 'None of your products look like the same thing.',
        'explain-spending.month.empty': 'No spending in the month.',
        'explain-spending.month.first':
          '{{spent}} spent in the month. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.month.more':
          '{{spent}} spent in the month, {{pct}}% more than the same days of the month before. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.month.less':
          '{{spent}} spent in the month, {{pct}}% less than the same days of the month before. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.month.same':
          '{{spent}} spent in the month, about the same as the same days of the month before. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.week.empty': 'No spending in the week.',
        'explain-spending.week.first':
          '{{spent}} spent in the week. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.week.more':
          '{{spent}} spent in the week, {{pct}}% more than the same days of the week before. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.week.less':
          '{{spent}} spent in the week, {{pct}}% less than the same days of the week before. Most of it went on {{category}} ({{category_amount}}).',
        'explain-spending.week.same':
          '{{spent}} spent in the week, about the same as the same days of the week before. Most of it went on {{category}} ({{category_amount}}).',
      },
    },
  },
});
