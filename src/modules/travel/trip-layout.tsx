import {
  Banknote,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  History,
  Luggage,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router';

import { cx } from '@/core/utils/cx';
import { Badge, EmptyState } from '@/design-system';
import { failureCode, useOptions, useTrip } from '@/modules/travel/api';
import { SIDE_LINK } from '@/modules/travel/choice';
import { NS } from '@/modules/travel/i18n';
import type { TripContext } from '@/modules/travel/trip-context';
import { daysOf, placesOf } from '@/modules/travel/trip-words';
import { Waiting } from '@/modules/travel/waiting';

/** A trip's sections, in tab order: only those built so far. */
const TABS: {
  to: string;
  key: 'overview' | 'itinerary' | 'prepare' | 'packing' | 'budget' | 'bookings' | 'history';
  icon: LucideIcon;
}[] = [
  { to: '', key: 'overview', icon: Gauge },
  { to: 'itinerary', key: 'itinerary', icon: CalendarClock },
  { to: 'prepare', key: 'prepare', icon: ClipboardCheck },
  { to: 'packing', key: 'packing', icon: Luggage },
  { to: 'budget', key: 'budget', icon: Banknote },
  { to: 'bookings', key: 'bookings', icon: Ticket },
  { to: 'history', key: 'history', icon: History },
];

/** One trip's frame: its name, where and when, and its sections as tabs that scroll sideways
 *  on a phone. Every tab works on the trip loaded here. */
export function TripLayout() {
  const { t, i18n } = useTranslation(NS);
  const { id = '' } = useParams();
  const { pathname } = useLocation();
  const trip = useTrip(id);
  const options = useOptions();
  const headingId = useId();
  const bar = useRef<HTMLElement>(null);
  const shown = Boolean(trip.data && options.data);

  // On a phone the open tab may sit past the bar's edge: centre it by scrolling the bar (never
  // the page), so "you are here" always shows. The ends stop where the bar does.
  useEffect(() => {
    const open = bar.current?.querySelector('[aria-current="page"]');
    if (!bar.current || !open) return;
    const [tab, box] = [open.getBoundingClientRect(), bar.current.getBoundingClientRect()];
    bar.current.scrollLeft += (tab.left + tab.right - box.left - box.right) / 2;
  }, [pathname, shown]);

  if (failureCode(trip.error) === 'NOT_FOUND' && !trip.data) {
    return (
      <EmptyState
        icon={Luggage}
        title={t('tripPage.notFound')}
        action={
          <Link to=".." relative="path" className={SIDE_LINK}>
            {t('home.allTrips')}
          </Link>
        }
      />
    );
  }
  if (!trip.data || !options.data) {
    const loading = trip.data ? options : trip;
    return <Waiting query={loading} failed={t('tripPage.loadError')} />;
  }
  const current = trip.data;

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-2xl font-bold tracking-tight break-words">
            {current.title}
          </h2>
          <p className="text-sm break-words text-muted">
            {placesOf(current.destinations)} · {daysOf(current, i18n.language)}
          </p>
        </div>
        <Badge>{t(`trip.modes.${current.mode}`)}</Badge>
      </header>
      <nav
        ref={bar}
        aria-label={t('tabs.label', { title: current.title })}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {TABS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={key}
            to={to}
            end={to === ''}
            className={({ isActive }) =>
              cx(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text hover:bg-bg',
              )
            }
          >
            <Icon aria-hidden="true" className="size-4" />
            {t(`tabs.${key}`)}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ trip: current, options: options.data } satisfies TripContext} />
    </section>
  );
}
