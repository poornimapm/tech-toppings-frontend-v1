import { Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, Badge, Button, toast } from '@/design-system';
import { failureCode } from '@/modules/travel/api';
import { ChangeLine } from '@/modules/travel/change-list';
import { failureText } from '@/modules/travel/failure-text';
import type { TripEvent } from '@/modules/travel/history-api';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';
import { useUndo } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { weekdayOf } from '@/modules/travel/trip-words';
import { useOnce } from '@/modules/travel/use-once';
import { useWords } from '@/modules/travel/words';

type Summary = TripEvent['summary'];

const textOf = (value: unknown) => (typeof value === 'string' ? value : '');
/** Kinds worded by how many records they added (their words have a form for one, and more). */
const COUNTED = ['checklist_suggested', 'checklist_ai_suggested', 'day_drafted'] as const;

/** A change in a line of words, from its kind and the figures the server kept with it: an undo
 *  says what it took back. A kind this build doesn't word is "A change". A suggestion still as
 *  worded (its key kept with it) is named in the app's own words. */
function useHeadline() {
  const { t, i18n } = useTranslation(NS);
  const words = useWords();
  const headline = (kind: string, summary: Summary): string => {
    const day = textOf(summary.day);
    const title = words.item(textOf(summary.title), textOf(summary.suggestion_key), true);
    const said = { title, day: day && weekdayOf(day, i18n.language) };
    if (kind === 'undo')
      return t('history.undid', { what: headline(textOf(summary.undid), summary) });
    const counted = COUNTED.find((each) => each === kind);
    if (counted) {
      const count = typeof summary.count === 'number' ? summary.count : 0;
      return t(`history.kinds.${counted}`, { ...said, count });
    }
    return isKnown(en.history.kinds, kind)
      ? t(`history.kinds.${kind}`, said)
      : t('history.unknown');
  };
  return headline;
}

/**
 * One change on the trip: what it was, when, for which day and whether it applied an AI draft,
 * then what it did record by record. While it can be taken back there is an Undo; refused
 * (something it touched changed since, say), why is said beside it, with what to do instead.
 */
export function EventEntry({ event }: { event: TripEvent }) {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const headline = useHeadline();
  const undo = useUndo();
  const what = headline(event.kind, event.summary);
  const day = textOf(event.summary.day);
  const when = new Date(event.at).toLocaleString(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const takeBack = useOnce(async () => {
    const undone = await undo.mutateAsync(event.id).catch(() => null); // shown from undo.error
    if (undone) toast(t('change.undone'), { tone: 'success' });
    return undone !== null;
  });

  return (
    <li className="space-y-2 rounded-2xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words">{what}</p>
          <p className="text-sm text-muted">
            {[when, day && t('history.forDay', { day: weekdayOf(day, i18n.language) })]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {event.source === 'ai' && (
            <p className="mt-1">
              <Badge tone="beta" icon={<Sparkles aria-hidden="true" className="size-3" />}>
                {t('history.ai')}
              </Badge>
            </p>
          )}
        </div>
        {event.undone_at ? (
          <Badge tone="locked">{t('history.undone')}</Badge>
        ) : (
          event.undoable && (
            <Button
              variant="secondary"
              className="min-h-11"
              aria-label={t('history.undoLabel', { what })}
              aria-disabled={undo.isPending || undefined}
              onClick={takeBack}
            >
              <Undo2 aria-hidden="true" className="size-4" />
              {t('history.undo')}
            </Button>
          )
        )}
      </div>
      {/* Kept mounted, so a refusal is announced as it comes. */}
      <Alert tone="danger">
        {undo.error ? (
          <>
            {failureText(undo.error)}
            {failureCode(undo.error) === 'TRAVEL_UNDO_STALE' && ` ${t('history.staleHint')}`}
          </>
        ) : null}
      </Alert>
      {event.changes.length > 0 && (
        <details className="text-sm">
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">
            {t('change.whatChanged')}
          </summary>
          <ul role="list" className="space-y-2">
            {event.changes.map((change, index) => (
              <ChangeLine
                key={`${change.record_id ?? 'new'}-${String(index)}`}
                change={change}
                planned={false}
                currency={trip.currency}
              />
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
