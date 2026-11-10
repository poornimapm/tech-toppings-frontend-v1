import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState } from '@/design-system';
import { EventEntry } from '@/modules/travel/event-entry';
import { useEvents } from '@/modules/travel/history-api';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';
import { Waiting } from '@/modules/travel/waiting';

/** What changed on the trip, newest first, a page at a time: each change in words, field by
 *  field, with a way to take it back while nothing it touched has changed since. */
export function HistoryTab() {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { trip } = useTripContext();
  const events = useEvents(trip.id);

  return (
    <div className="space-y-4">
      {!events.data ? (
        <Waiting query={events} failed={t('history.loadError')} />
      ) : events.data.length === 0 ? (
        <EmptyState icon={History} title={t('history.empty')} />
      ) : (
        <ol aria-label={t('history.list', { title: trip.title })} className="space-y-2">
          {events.data.map((event) => (
            <EventEntry key={event.id} event={event} />
          ))}
        </ol>
      )}
      {events.hasNextPage && (
        <Button
          variant="secondary"
          className="min-h-11"
          aria-disabled={events.isFetching || undefined}
          onClick={() => {
            if (!events.isFetching) void events.fetchNextPage();
          }}
        >
          {tCommon('actions.showMore')}
        </Button>
      )}
    </div>
  );
}
