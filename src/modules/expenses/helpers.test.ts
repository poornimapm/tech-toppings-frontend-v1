import { describe, expect, it } from 'vitest';

import { formatMoney, minorDigits, toInput, toMinor } from '@/core/utils/money';
import { accentFor } from '@/modules/expenses/category-book';
import { daysOf, toPeriod } from '@/modules/expenses/periods';

describe('money', () => {
  it('reads what people type as exact minor units', () => {
    expect(toMinor('250', 'INR')).toBe(25000);
    expect(toMinor('250.5', 'INR')).toBe(25050);
    expect(toMinor('19.99', 'INR')).toBe(1999); // 19.99 * 100 is 1998.9999... in floating point
    expect(toMinor(' 1,250.50 ', 'INR')).toBe(125050);
    expect(toMinor('1200', 'JPY')).toBe(1200);
  });

  it('refuses what is not an amount in that currency', () => {
    for (const text of ['', 'abc', '-5', '1.234', '1.2.3', '.5']) {
      expect(toMinor(text, 'INR'), text).toBeNull();
    }
    expect(toMinor('1200.5', 'JPY')).toBeNull(); // yen has no smaller unit
  });

  it('shows amounts the way the language writes them', () => {
    expect(minorDigits('INR')).toBe(2);
    expect(formatMoney(12500, 'INR', 'en')).toBe('₹125');
    expect(formatMoney(25050, 'INR', 'en')).toBe('₹250.50');
    expect(formatMoney(5000000, 'INR', 'en-IN')).toBe('₹50,000');
    expect(formatMoney(1200, 'JPY', 'en')).toBe('¥1,200');
    expect(toInput(12500, 'INR')).toBe('125.00');
  });
});

describe('periods', () => {
  it('covers whole months, across a year boundary too', () => {
    expect(daysOf('thisMonth', '2026-10-08')).toEqual({ from: '2026-10-01', to: '2026-10-08' });
    expect(daysOf('lastMonth', '2026-10-08')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(daysOf('lastMonth', '2026-01-15')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(daysOf('lastMonth', '2028-03-31')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(daysOf('last90', '2026-10-08')).toEqual({ from: '2026-07-11', to: '2026-10-08' });
    expect(daysOf('allTime', '2026-10-08')).toEqual({});
  });

  it('falls back to this month for an unknown period', () => {
    expect(toPeriod('lastMonth')).toBe('lastMonth');
    expect(toPeriod('fortnight')).toBe('thisMonth');
    expect(toPeriod(null)).toBe('thisMonth');
  });
});

describe('categories', () => {
  it('gives a new category the same colour every time', () => {
    expect(accentFor('Pets')).toBe(accentFor('Pets'));
    expect(accentFor('செல்லப்பிராணி 🐶')).toMatch(/^[a-z]+$/);
  });
});
// Every language's text: src/core/i18n/completeness.test.ts checks each module's.
