import { describe, expect, it } from 'vitest';

import { messageOf, noticeOf, type PushTexts } from '@/core/push/texts';

const texts: PushTexts = {
  language: 'en',
  appName: 'Tech-Toppings',
  fallback: 'You have a new notification. Open the app to see it.',
  feed: {
    'expenses.bill_due': '{{title}} is due on {{due}}: {{amount}}',
    'push.test': 'Notifications work on this device.',
  },
  modules: { expenses: { name: 'Expenses', home: '/m/expenses' } },
  links: { 'expenses.bill_due': 'plan?show=bills&focus={{rule_id}}' },
};

describe('wording a push', () => {
  it('reads like the bell, in the user’s language, and leads to the page it names', () => {
    const notice = noticeOf(texts, {
      type: 'expenses.bill_due',
      params: {
        module: 'expenses',
        title: 'Rent',
        due_on: '2026-11-01',
        amount_minor: 1500000,
        currency: 'INR',
        rule_id: 'r 1',
      },
      tag: 'reminder:abc:0',
    });
    expect(notice).toEqual({
      title: 'Expenses',
      body: 'Rent is due on November 1: ₹15,000',
      url: '/m/expenses/plan?show=bills&focus=r%201',
      tag: 'reminder:abc:0',
    });
  });

  it('falls back to plain words for what the pack doesn’t know yet', () => {
    expect(noticeOf(texts, { type: 'habits.streak', params: { module: 'habits' } })).toEqual({
      title: 'Tech-Toppings',
      body: 'You have a new notification. Open the app to see it.',
      url: '/notifications',
      tag: undefined,
    });
    expect(noticeOf(undefined, { type: 'push.test', params: {} }).body).toBe(
      'You have a new notification.',
    );
    expect(noticeOf(texts, { type: 'push.test', params: {} }).body).toBe(
      'Notifications work on this device.',
    );
  });

  it('reads only the server’s messages', () => {
    expect(messageOf('{"type":"push.test","params":{"a":1},"tag":"t"}')).toEqual({
      type: 'push.test',
      params: { a: 1 },
      tag: 't',
    });
    expect(messageOf('not json')).toEqual({ type: '', params: {} });
    expect(messageOf(undefined)).toEqual({ type: '', params: {} });
    expect(messageOf('{"type":"x","params":"nope"}')).toEqual({
      type: 'x',
      params: {},
      tag: undefined,
    });
  });
});
