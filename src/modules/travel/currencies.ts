import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
      label: `${code} · ${names.of(code) ?? code}`,
    }));
  }, [i18n.language, own]);
}
