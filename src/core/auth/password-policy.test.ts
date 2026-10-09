import { describe, expect, it } from 'vitest';

import { characterClasses, passwordViolations } from '@/core/auth/password-policy';

const policy = { min_length: 10, max_length: 20, min_classes: 2 };

describe('password policy (mirrors the backend rules)', () => {
  it.each([
    ['Correct-Horse-42', []],
    ['correcthorse42', []],
    ['short1A', ['too_short']],
    ['onlylowercaseletters', ['too_simple']],
    ['x'.repeat(21) + 'A1', ['too_long']],
    [' Padded-Pass-1 ', ['surrounding_whitespace']],
  ])('%s', (password, expected) => {
    expect(passwordViolations(password, policy)).toEqual(expected);
  });

  it('counts character classes', () => {
    expect(characterClasses('abc')).toBe(1);
    expect(characterClasses('aB3$')).toBe(4);
  });
});
