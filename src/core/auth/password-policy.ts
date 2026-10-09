import type { components } from '@/core/api/schema';

export type PasswordPolicy = components['schemas']['PasswordPolicyOut'];

/** Same rule ids as the backend (app/core/security.py) so messages match either way. */
export type PasswordRule = 'too_short' | 'too_long' | 'too_simple' | 'surrounding_whitespace';

export function characterClasses(password: string): number {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password))
    .length;
}

/** Instant client-side feedback; the server re-checks and remains the authority. */
export function passwordViolations(password: string, policy: PasswordPolicy): PasswordRule[] {
  const violations: PasswordRule[] = [];
  if (password.length < policy.min_length) violations.push('too_short');
  if (password.length > policy.max_length) violations.push('too_long');
  if (characterClasses(password) < policy.min_classes) violations.push('too_simple');
  if (password.trim() !== password) violations.push('surrounding_whitespace');
  return violations;
}
