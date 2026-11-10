import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/core/utils/money';
import { Table } from '@/design-system';
import type { Budget } from '@/modules/travel/budget-api';
import { NS } from '@/modules/travel/i18n';
import { Part } from '@/modules/travel/part';
import { useTripContext } from '@/modules/travel/trip-context';

/**
 * Who owes whom, as the server works it out from what was really spent and who paid it: the
 * fewest payments that even everyone up, then what each traveller paid and what their part of
 * it is. With fewer than two travellers there is nothing to split, and it says so.
 */
export function SharedCosts({ budget }: { budget: Budget }) {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const money = (minor: number) => formatMoney(minor, budget.currency, i18n.language);
  const name = (id: string) => trip.travellers.find((each) => each.id === id)?.name ?? id;

  if (trip.travellers.length < 2) {
    return (
      <Part title={t('budget.shared')}>
        <p className="text-sm text-muted">{t('budget.fewTravellers')}</p>
      </Part>
    );
  }
  return (
    <Part title={t('budget.shared')}>
      <p className="text-sm text-muted">{t('budget.sharedHint')}</p>
      {budget.settlements.length === 0 ? (
        <p className="text-sm font-medium">{t('budget.even')}</p>
      ) : (
        <ul role="list" className="space-y-1">
          {budget.settlements.map((transfer) => (
            <li
              key={`${transfer.from_traveller_id}-${transfer.to_traveller_id}`}
              className="flex items-start gap-1.5 text-sm font-medium break-words"
            >
              <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              {t('budget.pays', {
                from: name(transfer.from_traveller_id),
                to: name(transfer.to_traveller_id),
                amount: money(transfer.amount_minor),
              })}
            </li>
          ))}
        </ul>
      )}
      <Table
        caption={t('budget.shared')}
        rowKey={(line) => line.traveller_id}
        rows={budget.balances}
        columns={[
          { key: 'who', header: t('budget.traveller'), cell: (line) => name(line.traveller_id) },
          {
            key: 'paid',
            header: t('budget.paid'),
            cell: (line) => money(line.paid_minor),
            className: 'tabular-nums',
          },
          {
            key: 'share',
            header: t('budget.share'),
            cell: (line) => money(line.share_minor),
            className: 'tabular-nums',
          },
        ]}
      />
    </Part>
  );
}
