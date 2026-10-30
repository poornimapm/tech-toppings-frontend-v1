import { Plus, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import {
  Badge,
  Button,
  EmptyState,
  FilterChips,
  LoadError,
  SearchField,
  Skeleton,
} from '@/design-system';
import { useReceipts, type Receipt, type WarrantyStatus } from '@/modules/receipts/api';
import { NS } from '@/modules/receipts/i18n';
import manifest from '@/modules/receipts/manifest';
import { daysUntil } from '@/modules/receipts/warranty';

const FILTERS = ['all', 'ending', 'active', 'ended', 'none'] as const;
type Filter = (typeof FILTERS)[number];
const SEARCH_MAX = 80;

const isFilter = (value: string | null): value is Filter =>
  FILTERS.some((filter) => filter === value);

/** The user's receipts, latest bought first: found by words, or by where their warranty stands
 *  (kept in the address, so a notification or a reload lands on the same list). */
export function ReceiptsPage() {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const [params, setParams] = useSearchParams();
  const shown = params.get('warranty');
  const filter: Filter = isFilter(shown) ? shown : 'all';
  const [words, setWords] = useState('');
  const q = useDeferredValue(words.trim());
  const receipts = useReceipts({
    warranty: filter === 'all' ? undefined : filter,
    q: q || undefined,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Link
          to="new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-primary-contrast hover:opacity-90"
        >
          <Plus aria-hidden="true" className="size-5" />
          {t('add')}
        </Link>
      </header>
      <SearchField label={t('search')} value={words} onChange={setWords} maxLength={SEARCH_MAX} />
      <FilterChips<Filter>
        label={t('filter.label')}
        chips={FILTERS.map((value) => ({ value, label: t(`filter.${value}`) }))}
        value={filter}
        onChange={(value) => {
          setParams(value === 'all' ? {} : { warranty: value }, { replace: true });
        }}
      />
      {receipts.isPending ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : receipts.isError ? (
        <LoadError onRetry={() => void receipts.refetch()}>{t('loadError')}</LoadError>
      ) : receipts.data.length === 0 ? (
        <EmptyState
          icon={manifest.icon}
          title={filter === 'all' && !q ? t('empty') : t('emptyFound')}
        />
      ) : (
        <>
          <ul role="list" aria-label={t('title')} className="space-y-2">
            {receipts.data.map((receipt) => (
              <li key={receipt.id}>
                <ReceiptCard receipt={receipt} />
              </li>
            ))}
          </ul>
          {receipts.hasNextPage && (
            <Button
              variant="secondary"
              aria-disabled={receipts.isFetching || undefined}
              onClick={() => {
                if (!receipts.isFetching) void receipts.fetchNextPage();
              }}
            >
              {tCommon('actions.showMore')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

const STATUS_ICONS = {
  active: ShieldCheck,
  ending: ShieldAlert,
  ended: ShieldOff,
} as const;

/** Where a warranty stands, in words and with an icon, so it reads without colour. */
export function WarrantyBadge({ receipt }: { receipt: Receipt }) {
  const { t, i18n } = useTranslation(NS);
  const timezone = useSession((state) => state.user?.timezone);
  const ends = receipt.warranty_ends_on;
  const status: WarrantyStatus = receipt.warranty;
  if (status === 'none' || !ends) {
    return <Badge>{t('warranty.none')}</Badge>;
  }
  const date = displayDate(ends).toLocaleDateString(i18n.language, { dateStyle: 'medium' });
  const Icon = STATUS_ICONS[status];
  const icon = <Icon aria-hidden="true" className="size-3.5" />;
  if (status === 'ending') {
    const count = daysUntil(todayIn(timezone), ends);
    return (
      <Badge tone="soon" icon={icon}>
        {count <= 0 ? t('warranty.endsToday') : t('warranty.ending', { date, count })}
      </Badge>
    );
  }
  return (
    <Badge tone={status === 'active' ? 'success' : 'neutral'} icon={icon}>
      {t(`warranty.${status}`, { date })}
    </Badge>
  );
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { i18n } = useTranslation(NS);
  const bought = displayDate(receipt.bought_on).toLocaleDateString(i18n.language, {
    dateStyle: 'medium',
  });
  const facts = [
    receipt.shop,
    bought,
    receipt.amount_minor === null
      ? null
      : formatMoney(receipt.amount_minor, receipt.currency, i18n.language),
  ].filter(Boolean);
  return (
    <Link
      to={receipt.id}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-bg"
    >
      <span className="block text-base font-semibold break-words">{receipt.text}</span>
      <span className="mt-0.5 block text-sm text-muted">{facts.join(' · ')}</span>
      <span className="mt-2 block">
        <WarrantyBadge receipt={receipt} />
      </span>
    </Link>
  );
}
