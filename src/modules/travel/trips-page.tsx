import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { Button, EmptyState, FilterChips } from '@/design-system';
import { useTrips, type TripPhase } from '@/modules/travel/api';
import { MAIN_LINK } from '@/modules/travel/choice';
import { NS } from '@/modules/travel/i18n';
import manifest from '@/modules/travel/manifest';
import { TripCard } from '@/modules/travel/trip-card';
import { Waiting } from '@/modules/travel/waiting';

const FILTERS = ['all', 'upcoming', 'active', 'past'] as const;
type Filter = (typeof FILTERS)[number];

const isFilter = (value: string | null): value is Filter =>
  FILTERS.some((filter) => filter === value);

/** Every trip of the user's, or those coming up, under way or past (kept in the address, so a
 *  reload or a link from Home lands on the same list), a page at a time. */
export function TripsPage() {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const [params, setParams] = useSearchParams();
  const shown = params.get('phase');
  const filter: Filter = isFilter(shown) ? shown : 'all';
  const phase: TripPhase | undefined = filter === 'all' ? undefined : filter;
  const trips = useTrips({ phase });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label={t('trips.show')}
          chips={FILTERS.map((value) => ({ value, label: t(`trips.filter.${value}`) }))}
          value={filter}
          onChange={(value) => {
            setParams(value === 'all' ? {} : { phase: value }, { replace: true });
          }}
        />
        <Link to="../new" relative="path" className={MAIN_LINK}>
          <Plus aria-hidden="true" className="size-5" />
          {t('plan')}
        </Link>
      </div>
      {!trips.data ? (
        <Waiting query={trips} failed={t('trips.loadError')} />
      ) : trips.data.length === 0 ? (
        <EmptyState icon={manifest.icon} title={t(`trips.empty.${filter}`)} />
      ) : (
        <>
          <ul role="list" aria-label={t('nav.trips')} className="grid gap-3 sm:grid-cols-2">
            {trips.data.map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} to={trip.id} />
              </li>
            ))}
          </ul>
          {trips.hasNextPage && (
            <Button
              variant="secondary"
              className="min-h-11"
              aria-disabled={trips.isFetching || undefined}
              onClick={() => {
                if (!trips.isFetching) void trips.fetchNextPage();
              }}
            >
              {tCommon('actions.showMore')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
