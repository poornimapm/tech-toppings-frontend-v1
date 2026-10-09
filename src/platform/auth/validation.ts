import type { TFunction } from 'i18next';
import type { FieldError } from 'react-hook-form';

/** Form schemas use message ids (``required``, ``email`` ...); this translates them. */
const VALIDATION_KEYS = ['required', 'email', 'mismatch', 'tooLong'] as const;
type ValidationKey = (typeof VALIDATION_KEYS)[number];

function isValidationKey(value: string): value is ValidationKey {
  return (VALIDATION_KEYS as readonly string[]).includes(value);
}

export function validationMessage(error: FieldError | undefined, t: TFunction): string | undefined {
  if (!error?.message) return undefined;
  return isValidationKey(error.message) ? t(`auth.validation.${error.message}`) : error.message; // already translated (e.g. server-side password policy)
}
