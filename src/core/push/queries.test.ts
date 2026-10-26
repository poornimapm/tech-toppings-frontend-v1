import { describe, expect, it } from 'vitest';

import { sessionOf } from '@/core/push/queries';

const part = (text: string) =>
  btoa(text).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

describe('the session a token belongs to', () => {
  it('is the JWT’s `sid`, the same for every token of that session', () => {
    // '?????' encodes with a '/', sent url-safe as '_'.
    const token = (iat: number) =>
      `${part('{"alg":"HS256"}')}.${part(JSON.stringify({ sid: '652f1c0a9b', iat, x: '?????' }))}.sig`;
    expect(sessionOf(token(1))).toBe('652f1c0a9b');
    expect(sessionOf(token(2))).toBe('652f1c0a9b');
  });

  it('is the token itself when it names none, and nothing without one', () => {
    expect(sessionOf('access-1')).toBe('access-1');
    expect(sessionOf(`a.${part('{"sub":"user-1"}')}.c`)).toBe(`a.${part('{"sub":"user-1"}')}.c`);
    expect(sessionOf('a.%%%.c')).toBe('a.%%%.c');
    expect(sessionOf(null)).toBeUndefined();
  });
});
