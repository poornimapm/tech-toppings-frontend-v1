import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { NS } from '@/modules/expenses/i18n';
import type { Iou, PersonBalance } from '@/modules/expenses/ious-api';

/** How a loan, or where the user stands with someone, is said: the same wherever it is saved
 *  or shown (the confirm card, the Plan page). */
export function useLoanWords() {
  const { t, i18n } = useTranslation(NS);
  const money = (minor: number, currency: string) => formatMoney(minor, currency, i18n.language);
  return {
    /** "Saved: Ravi owes you ₹300.": where the user stands on a loan just saved. */
    saved(iou: Iou): string {
      const person = iou.counterparty;
      if (iou.outstanding_minor === 0) return t('capture.loan.paidUp', { person });
      const amount = money(iou.outstanding_minor, iou.currency);
      return iou.direction === 'lent'
        ? t('capture.loan.owesYou', { person, amount })
        : t('capture.loan.youOwe', { person, amount });
    },
    /** "Owes you ₹950" or "You owe ₹300": one person, over all their loans. */
    net(person: PersonBalance, currency: string): string {
      const amount = money(Math.abs(person.net_minor), currency);
      if (person.net_minor > 0) return t('loans.net.owesYou', { amount });
      if (person.net_minor < 0) return t('loans.net.youOwe', { amount });
      return t(person.open > 0 ? 'loans.net.even' : 'loans.net.settled');
    },
  };
}
