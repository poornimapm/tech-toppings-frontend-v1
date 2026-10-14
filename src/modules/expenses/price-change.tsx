import { ArrowDown, ArrowUp, Equal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/design-system';
import { NS } from '@/modules/expenses/i18n';

/** How the last price compares with the one before, in words as well as colour and arrow:
 *  dearer is a warning to the buyer, cheaper good news. */
export function PriceChange({ pct }: { pct: number | null | undefined }) {
  const { t, i18n } = useTranslation(NS);
  if (pct === null || pct === undefined) return null;
  const value = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(
    Math.abs(pct),
  );
  if (pct === 0) {
    return <Badge icon={<Equal aria-hidden="true" className="size-3" />}>{t('prices.same')}</Badge>;
  }
  return pct > 0 ? (
    <Badge tone="soon" icon={<ArrowUp aria-hidden="true" className="size-3" />}>
      {t('prices.up', { pct: value })}
    </Badge>
  ) : (
    <Badge tone="success" icon={<ArrowDown aria-hidden="true" className="size-3" />}>
      {t('prices.down', { pct: value })}
    </Badge>
  );
}
