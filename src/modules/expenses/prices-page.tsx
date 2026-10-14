import { Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { errorKey } from '@/core/i18n';
import { displayDate } from '@/core/utils/dates';
import { Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import { failureCode, useProducts, type ProductSummary } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { matchesFrom, MATCH_TOOL, useFindMatches, type Match } from '@/modules/expenses/matches';
import { MatchesPanel } from '@/modules/expenses/matches-panel';
import { paths } from '@/modules/expenses/paths';
import { PriceChange } from '@/modules/expenses/price-change';
import { SectionTabs } from '@/modules/expenses/section-tabs';
import { Sparkline } from '@/modules/expenses/sparkline';
import { useUnitText } from '@/modules/expenses/units';

function ProductCard({ product }: { product: ProductSummary }) {
  const { t, i18n } = useTranslation(NS);
  const units = useUnitText();
  const last = product.last;
  const day = last
    ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
        displayDate(last.date),
      )
    : '';
  const others = product.aliases.length - 1;

  return (
    <li className="relative flex flex-col gap-3 rounded-3xl border border-border bg-glass p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={paths.product(product.id)}
            className="block truncate text-lg font-semibold after:absolute after:inset-0 after:rounded-3xl"
          >
            {product.name}
          </Link>
          <p className="text-sm text-muted">
            {t('prices.purchases', { count: product.purchases })}
            {others > 0 && ` · ${t('prices.otherNames', { count: others })}`}
          </p>
        </div>
        <Sparkline values={product.trend} />
      </div>
      {last ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {units.perUnit(last.unit_price_minor, product.currency, product.price_unit)}
          </span>
          <PriceChange pct={product.change_pct} />
        </div>
      ) : (
        <p className="text-muted">{t('prices.noPrice')}</p>
      )}
      <div className="space-y-0.5 text-sm text-muted">
        {last && (
          <p>
            {last.merchant
              ? t('prices.lastAt', { date: day, merchant: last.merchant })
              : t('prices.last', { date: day })}
          </p>
        )}
        {product.cheapest && <p>{t('prices.cheapest', { merchant: product.cheapest })}</p>}
      </div>
    </li>
  );
}

/** What the user buys, with how its price is going; and finding one thing under two names. */
export function PricesPage() {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const location = useLocation();
  const products = useProducts();
  const finder = useFindMatches();
  const [matches, setMatches] = useState<Match[]>([]);
  const [taken, setTaken] = useState<ClientAction | null>(null);
  const [looked, setLooked] = useState(false);

  // Matches the command palette prepared arrive with the page, once.
  const handed = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  if (handed && handed !== taken) {
    setTaken(handed);
    setMatches(matchesFrom(handed));
  }

  async function find() {
    setLooked(true);
    const run = await finder.find().catch(() => null);
    setMatches(matchesFrom(run?.client_actions.find((item) => item.tool === MATCH_TOOL)));
  }

  const items = products.data ?? [];
  const failure = failureCode(finder.error);
  let status: string | null = null;
  if (finder.pending) status = t('prices.finding');
  else if (failure) status = tError(errorKey(failure));
  else if (finder.run?.status === 'unavailable') {
    const reason = finder.run.reason;
    status = `${tCommon('agents.unavailable')} ${reason ? tCommon(`agents.reason.${reason}`) : ''}`;
  } else if (looked && matches.length === 0) status = t('prices.matches.none');

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('prices.title')}</h1>
            <p className="mt-1 text-muted">{t('prices.subtitle')}</p>
          </div>
          {items.length > 1 && (
            <Button variant="secondary" disabled={finder.pending} onClick={() => void find()}>
              <Sparkles aria-hidden="true" className="size-4" />
              {t('prices.find')}
            </Button>
          )}
        </div>
        <SectionTabs />
        {status && (
          <p role="status" className="text-sm text-muted">
            {status}
          </p>
        )}
      </header>

      <MatchesPanel
        matches={matches}
        products={items}
        onDone={(key) => {
          setMatches((current) => current.filter((match) => match.key !== key));
        }}
      />

      {products.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : products.isError ? (
        <LoadError onRetry={() => void products.refetch()}>{t('prices.loadError')}</LoadError>
      ) : items.length === 0 ? (
        <EmptyState icon={TrendingUp} title={t('prices.emptyTitle')} body={t('prices.emptyBody')} />
      ) : (
        <>
          <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
          {products.hasNextPage && (
            <Button
              variant="secondary"
              disabled={products.isFetchingNextPage}
              onClick={() => void products.fetchNextPage()}
            >
              {t('list.more')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
