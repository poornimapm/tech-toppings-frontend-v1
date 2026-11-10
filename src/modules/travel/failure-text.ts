import i18n, { errorKey } from '@/core/i18n';
import { failureCode } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';

/** What went wrong, in words. The refusals only Travel's pages meet are worded with those pages
 *  (so they cost the first page nothing); everything else is the shell's. */
export function failureText(error: unknown): string {
  const code = failureCode(error) ?? 'UNKNOWN';
  return isKnown(en.errors, code)
    ? i18n.t(`errors.${code}`, { ns: NS })
    : i18n.t(errorKey(code), { ns: 'errors' });
}
