import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** "THB · Thai Baht": the code, and its name in the reader's language. */
const named = (names: Intl.DisplayNames, code: string) => `${code} · ${names.of(code) ?? code}`;

/** One currency as the currency choices word it. */
export const currencyLabel = (code: string, language: string) =>
  named(new Intl.DisplayNames([language], { type: 'currency' }), code);

/** The currencies this browser knows, each with its name in the reader's language, and the
 *  chosen one among them whatever the browser lists. */
export function useCurrencies(own: string) {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const codes =
      typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('currency') : [];
    const names = new Intl.DisplayNames([i18n.language], { type: 'currency' });
    return [...new Set([own, ...codes])].map((code) => ({
      value: code,
      label: named(names, code),
    }));
  }, [i18n.language, own]);
}
