import { describe, expect, it } from 'vitest';

import { withDates } from '@/core/utils/date-params';

describe('withDates', () => {
  it.each([
    ['en', 'October 20'],
    ['ta', '20 அக்டோபர்'],
    ['hi', '20 अक्टूबर'],
  ])('writes a calendar day in %s', (language, due) => {
    expect(withDates({ due_on: '2026-10-20', title: 'Rent' }, language)).toEqual({
      due_on: '2026-10-20',
      due,
      title: 'Rent',
    });
  });

  it('leaves anything that is not a calendar day alone', () => {
    const params = { carry_on: 'soon', count_on: 3, created_at: '2026-10-20T10:00:00Z' };

    expect(withDates(params, 'en')).toEqual(params);
  });
});
