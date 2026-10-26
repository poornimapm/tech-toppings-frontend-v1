import { describe, expect, it } from 'vitest';

import i18n from '@/core/i18n';
import { checkSignIn, validationMessage } from '@/platform/auth/validation';

describe('checkSignIn', () => {
  it.each([
    ['asha@example.com', 'x', {}],
    ['', '', { email: { message: 'email' }, password: { message: 'required' } }],
    ['asha@example', 'x', { email: { message: 'email' } }],
    [' asha@example.com', 'x', { email: { message: 'email' } }],
    ['asha.k+home@mail.example.co.in', ' ', {}],
  ])('%j / %j', (email, password, problems) => {
    expect(checkSignIn({ email, password })).toEqual(problems);
  });
});

describe('validationMessage', () => {
  const t = i18n.getFixedT('en', 'common');

  it('translates message ids and passes translated text through', () => {
    expect(validationMessage({ message: 'email' }, t)).toBe('Enter a valid email address.');
    expect(validationMessage({ message: 'Use at least 12 characters.' }, t)).toBe(
      'Use at least 12 characters.',
    );
    expect(validationMessage(undefined, t)).toBeUndefined();
  });
});
