import { ArrowLeft, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { LoadError, Skeleton } from '@/design-system';
import { useProduct, type ProductDetail, type Purchase } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';
import { PriceChange } from '@/modules/expenses/price-change';
import { PriceChart } from '@/modules/expenses/price-chart';
import { ProductSettings } from '@/modules/expenses/product-settings';
import { useUnitText } from '@/modules/expenses/units';

const CARD = 'rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl';
const TILE = 'rounded-3xl border border-border bg-glass p-3 shadow-sm backdrop-blur-xl sm:p-5';

function Stats({ product }: { product: ProductDetail }) {
  const { t } = useTranslation(NS);
  const units = useUnitText();
  const stats = product.stats;
  if (!stats) return null;
  const perUnit = (minor: number) => units.perUnit(minor, product.currency, product.price_unit);
  const tiles = [
    ['product.lowest', stats.min_minor],
    ['product.average', stats.avg_minor],
    ['product.highest', stats.max_minor],
  ] as const;
  const cheapest = product.merchants.find((place) => place.merchant === product.cheapest);

  return (
    <section aria-label={t('product.stats')} className="grid grid-cols-3 gap-3 lg:grid-cols-4">
      <div className={`${CARD} col-span-3 lg:col-span-1`}>
        <p className="text-sm text-muted">{t('product.last')}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{perUnit(stats.last_minor)}</p>
        <div className="mt-2">
          <PriceChange pct={stats.change_pct} />
        </div>
      </div>
      {tiles.map(([label, minor]) => (
        <div key={label} className={TILE}>
          <p className="text-sm text-muted">{t(label)}</p>
          <p className="mt-1 font-semibold tabular-nums sm:text-xl">{perUnit(minor)}</p>
        </div>
      ))}
      {cheapest?.merchant && (
        <p className="col-span-3 flex items-center gap-2 text-sm lg:col-span-4">
          <Store aria-hidden="true" className="size-4 text-success" />
          {t('product.cheapestAt', {
            merchant: cheapest.merchant,
            price: perUnit(cheapest.avg_minor),
          })}
        </p>
      )}
    </section>
  );
}

function Purchases({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation(NS);
  const units = useUnitText();
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const newest = [...product.purchases].reverse();
  const bought = (purchase: Purchase) =>
    purchase.quantity && purchase.unit ? units.quantity(purchase.quantity, purchase.unit) : '';
  const paid = (purchase: Purchase) =>
    formatMoney(purchase.amount_minor, product.currency, i18n.language);

  return (
    <section aria-labelledby="purchases-title" className={CARD}>
      <h2 id="purchases-title" className="text-lg font-semibold">
        {t('product.purchases')}
      </h2>
      <div
        role="group"
        aria-labelledby="purchases-title"
        // Scrollable on phones, so it must be reachable by keyboard.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="mt-3 overflow-x-auto"
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1.5 font-medium">
                {t('product.date')}
              </th>
              <th scope="col" className="py-1.5 font-medium">
                {t('product.where')}
              </th>
              <th scope="col" className="hidden py-1.5 font-medium sm:table-cell">
                {t('product.howMuch')}
              </th>
              <th scope="col" className="hidden py-1.5 text-right font-medium sm:table-cell">
                {t('product.paid')}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {t('product.each', { unit: units.name(product.price_unit) })}
              </th>
            </tr>
          </thead>
          <tbody>
            {newest.map((purchase) => (
              <tr key={purchase.entry_id} className="border-t border-border">
                <td className="py-1.5">
                  <Link
                    to={paths.entry(purchase.entry_id)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {date.format(displayDate(purchase.date))}
                  </Link>
                </td>
                <td className="py-1.5">
                  {purchase.merchant ?? t('product.notNoted')}
                  {/* On phones, how much and what was paid go under the place. */}
                  <span className="block text-muted sm:hidden">
                    {[bought(purchase), paid(purchase)].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className="hidden py-1.5 sm:table-cell">{bought(purchase) || '—'}</td>
                <td className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                  {paid(purchase)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {purchase.unit_price_minor === null ? (
                    <span className="text-muted">{t('product.unpriced')}</span>
                  ) : (
                    formatMoney(purchase.unit_price_minor, product.currency, i18n.language)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Places({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation(NS);
  if (product.merchants.length < 2) return null;
  const money = (minor: number) => formatMoney(minor, product.currency, i18n.language);
  return (
    <section aria-labelledby="places-title" className={CARD}>
      <h2 id="places-title" className="text-lg font-semibold">
        {t('product.places')}
      </h2>
      <ol role="list" className="mt-3 divide-y divide-border">
        {product.merchants.map((place) => (
          <li
            key={place.merchant ?? ''}
            className="flex flex-wrap items-baseline justify-between gap-x-3 py-2"
          >
            <span className="font-medium">{place.merchant ?? t('product.notNoted')}</span>
            <span className="text-sm text-muted">
              {t('prices.purchases', { count: place.count })} ·{' '}
              {t('product.placeFigures', {
                average: money(place.avg_minor),
                lowest: money(place.min_minor),
              })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One product: what it cost each time and where, and the settings that shape it. */
export function ProductPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation(NS);
  const units = useUnitText();
  const product = useProduct(id);

  const back = (
    <Link
      to={paths.prices}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {t('product.back')}
    </Link>
  );
  if (product.isPending) return <Skeleton className="h-96 rounded-3xl" />;
  if (product.isError) {
    return (
      <div className="space-y-4">
        {back}
        <LoadError onRetry={() => void product.refetch()}>{t('product.notFound')}</LoadError>
      </div>
    );
  }

  const current = product.data;
  const others = current.aliases.filter((alias) => alias !== current.name.toLowerCase());
  return (
    <div className="space-y-5">
      {back}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{current.name}</h1>
        {others.length > 0 && (
          <p className="mt-1 text-muted">{t('product.alsoCalled', { names: others.join(', ') })}</p>
        )}
      </header>

      <Stats product={current} />

      {current.stats && (
        <section aria-labelledby="chart-title" className={CARD}>
          <h2 id="chart-title" className="mb-3 text-lg font-semibold">
            {t('product.chart', { unit: units.name(current.price_unit) })}
          </h2>
          <PriceChart
            purchases={current.purchases}
            currency={current.currency}
            unit={current.price_unit}
            name={current.name}
          />
        </section>
      )}

      <Places product={current} />
      {current.purchases.length > 0 && <Purchases product={current} />}
      <ProductSettings product={current} />
    </div>
  );
}
