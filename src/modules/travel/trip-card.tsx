import { CalendarDays, Compass, Users } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge } from '@/design-system';
import type { Trip } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import { daysOf, placesOf } from '@/modules/travel/trip-words';

/**
 * A trip's own facts: where it goes, when, what kind of trip, who is going and its mode, each
 * with an icon and in words; its name opens the trip (`to`, from the page showing it). `children`
 * add what the page knows more of it (on Home, how it stands).
 */
export function TripCard({ trip, to, children }: { trip: Trip; to: string; children?: ReactNode }) {
  const { t, i18n } = useTranslation(NS);
  const headingId = useId();
  const facts = [
    { key: 'days', icon: CalendarDays, text: daysOf(trip, i18n.language) },
    // "Other" says nothing on a card: only a kind the person chose is shown.
    trip.trip_type === 'other'
      ? null
      : { key: 'type', icon: Compass, text: t(`trip.types.${trip.trip_type}`) },
    {
      key: 'travellers',
      icon: Users,
      text: trip.travellers.length
        ? t('trip.travellers', { count: trip.travellers.length })
        : t('trip.noTravellers'),
    },
  ].filter((fact) => fact !== null);

  return (
    <article
      aria-labelledby={headingId}
      className="space-y-3 rounded-3xl border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="text-lg font-semibold break-words">
            <Link to={to} className="text-primary underline-offset-4 hover:underline">
              {trip.title}
            </Link>
          </h3>
          <p className="text-sm break-words text-muted">{placesOf(trip.destinations)}</p>
        </div>
        <Badge>{t(`trip.modes.${trip.mode}`)}</Badge>
      </div>
      <ul role="list" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {facts.map(({ key, icon: Icon, text }) => (
          <li key={key} className="flex items-center gap-1.5">
            <Icon aria-hidden="true" className="size-4 text-muted" />
            {text}
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}
