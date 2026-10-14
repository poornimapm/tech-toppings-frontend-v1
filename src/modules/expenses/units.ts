import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import type { Unit } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';

/** Unit codes come from the server (GET /units), so their keys can't be checked here. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

/**
 * What `quantity` `unit` for `amountMinor` costs per one `per` (as the server works it out);
 * `null` when the units measure different things or aren't known.
 */
export function unitPrice(
  units: readonly Unit[],
  amountMinor: number,
  quantity: number,
  unit: string,
  per: string,
): number | null {
  const bought = units.find((item) => item.code === unit);
  const priced = units.find((item) => item.code === per);
  if (!bought || !priced) return null;
  if (bought.dimension !== priced.dimension || quantity <= 0) return null;
  return Math.round((amountMinor / (quantity * bought.factor)) * priced.factor);
}

/** The unit a price is best quoted per: the unit itself, unless it is a fraction of a bigger
 *  one (grams are priced per kg). The server's rule, for prices shown before saving. */
export function priceUnitFor(units: readonly Unit[], code: string): string {
  const unit = units.find((item) => item.code === code);
  if (!unit || unit.factor >= 1) return code;
  return units.find((item) => item.dimension === unit.dimension)?.code ?? code;
}

/** Quantities ("2 kg", "3 packets") and prices per unit ("₹50/kg") in the user's language. */
export function useUnitText() {
  const { t, i18n } = useTranslation(NS);
  const loose = t as unknown as LooseT;
  const name = (code: string) => loose(`unit.${code}`, { defaultValue: code });
  return {
    name,
    quantity: (count: number, code: string) =>
      loose(`quantity.${code}`, {
        count,
        value: new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }).format(count),
        defaultValue: `${String(count)} ${code}`,
      }),
    perUnit: (minor: number, currency: string, code: string) =>
      t('price.perUnit', {
        price: formatMoney(minor, currency, i18n.language),
        unit: name(code),
      }),
  };
}
