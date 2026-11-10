import { Backpack, Luggage, Plus, Sunrise } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { EmptyState } from '@/design-system';
import { useTrips, type Trip } from '@/modules/travel/api';
import { MAIN_LINK, SIDE_LINK } from '@/modules/travel/choice';
import { NS } from '@/modules/travel/i18n';
import manifest from '@/modules/travel/manifest';
import { TripCard } from '@/modules/travel/trip-card';
import { TripGlance } from '@/modules/travel/trip-glance';
import { Waiting } from '@/modules/travel/waiting';

/** How many trips coming up Home shows; My Trips has them all. Each card asks for its trip's
 *  overview, so Home stays a few requests long. */
const UPCOMING_SHOWN = 5;

/**
 * Travel's home: a greeting, the trip under way and those coming up, each with its countdown,
 * how ready it is and what to do next, and quick ways to plan a trip, see them all, and prepare
 * tomorrow or pack for the next trip (the one under way, else the soonest), once there is one.
 */
export function HomePage() {
  const { t } = useTranslation(NS);
  const name = useSession((state) => state.user?.name);
  const active = useTrips({ phase: 'active' });
  const upcoming = useTrips({ phase: 'upcoming', page_size: UPCOMING_SHOWN });
  // The list still loading (or failed) is the one shown as such; trying again asks for both.
  const loading = active.data ? upcoming : active;
  const next = active.data?.[0] ?? upcoming.data?.[0];

  return (
    <div className="space-y-6">
      <section aria-label={t('home.quick')} className="space-y-3">
        <p className="text-lg">{name ? t('home.greeting', { name }) : t('home.greetingPlain')}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="new" className={MAIN_LINK}>
            <Plus aria-hidden="true" className="size-5" />
            {t('plan')}
          </Link>
          <Link to="trips" className={SIDE_LINK}>
            <Luggage aria-hidden="true" className="size-5" />
            {t('home.allTrips')}
          </Link>
          {next && (
            <>
              <Link to={`trips/${next.id}/prepare?when=tomorrow`} className={SIDE_LINK}>
                <Sunrise aria-hidden="true" className="size-5" />
                {t('home.prepareNext', { title: next.title })}
              </Link>
              <Link to={`trips/${next.id}/packing`} className={SIDE_LINK}>
                <Backpack aria-hidden="true" className="size-5" />
                {t('home.packNext', { title: next.title })}
              </Link>
            </>
          )}
        </div>
      </section>
      {!active.data || !upcoming.data ? (
        <Waiting
          query={{
            isPending: loading.isPending,
            isError: loading.isError,
            fetchStatus: loading.fetchStatus,
            refetch: () => Promise.all([active.refetch(), upcoming.refetch()]),
          }}
          failed={t('home.loadError')}
        />
      ) : active.data.length + upcoming.data.length === 0 ? (
        // The way to plan one is right above, among the quick actions.
        <EmptyState icon={manifest.icon} title={t('home.empty')} body={t('home.emptyBody')} />
      ) : (
        <>
          <TripList title={t('home.active')} trips={active.data} />
          <TripList title={t('home.upcoming')} trips={upcoming.data}>
            {upcoming.hasNextPage && (
              <Link
                to="trips?phase=upcoming"
                className="inline-block text-sm font-medium text-primary underline underline-offset-4"
              >
                {t('home.moreUpcoming')}
              </Link>
            )}
          </TripList>
        </>
      )}
    </div>
  );
}

/** One group of trips under its heading, each with how it stands; nothing when it has none. */
function TripList({
  title,
  trips,
  children,
}: {
  title: string;
  trips: Trip[];
  children?: ReactNode;
}) {
  const headingId = useId();
  if (trips.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-semibold">
        {title}
      </h2>
      <ul role="list" className="grid gap-3 sm:grid-cols-2">
        {trips.map((trip) => (
          <li key={trip.id}>
            <TripCard trip={trip} to={`trips/${trip.id}`}>
              <TripGlance trip={trip} />
            </TripCard>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}
