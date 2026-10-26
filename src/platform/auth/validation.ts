import type { TFunction } from 'i18next';
import { regexes } from 'zod/v4/core';

/** Form checks use message ids (``required``, ``email`` ...); this translates them. */
const VALIDATION_KEYS = ['required', 'email', 'mismatch', 'tooLong'] as const;
type ValidationKey = (typeof VALIDATION_KEYS)[number];

function isValidationKey(value: string): value is ValidationKey {
  return (VALIDATION_KEYS as readonly string[]).includes(value);
}

/** A field's problem, as react-hook-form reports it and checkSignIn returns it. */
export interface FieldProblem {
  message?: string | undefined;
}

export function validationMessage(
  error: FieldProblem | undefined,
  t: TFunction,
): string | undefined {
  if (!error?.message) return undefined;
  return isValidationKey(error.message) ? t(`auth.validation.${error.message}`) : error.message; // already translated (e.g. server-side password policy)
}

export interface SignInValues {
  email: string;
  password: string;
}

export type SignInProblems = Partial<Record<keyof SignInValues, FieldProblem>>;

/**
 * Sign-in's checks: the rules and message ids of the other auth forms' schemas (`z.email()`,
 * a required password), without a form library, so the sign-in page (a first page) stays
 * within the bundle budget.
 */
export function checkSignIn({ email, password }: SignInValues): SignInProblems {
  return {
    ...(regexes.email.test(email) ? {} : { email: { message: 'email' } }),
    ...(password.length > 0 ? {} : { password: { message: 'required' } }),
  };
}
