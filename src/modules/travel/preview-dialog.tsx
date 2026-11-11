import { skipToken, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Check, Undo2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, toast } from '@/design-system';
import { failureCode, travelKeys, useTravelChange } from '@/modules/travel/api';
import { ChangeList } from '@/modules/travel/change-list';
import { Failure } from '@/modules/travel/failure';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';
import { useUndo, type ChangeResult } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { useOnce } from '@/modules/travel/use-once';
import { Waiting } from '@/modules/travel/waiting';

/** What adding some records would do (`apply` false: nothing is written), or did. */
export type Addition = ChangeResult & { more?: boolean };
export type AskAddition = (apply: boolean) => Promise<Addition>;

/** An AI draft added already (an add whose answer was lost, tried again): it isn't added twice. */
const ADDED = 'TRAVEL_AI_DRAFT_APPLIED';

/**
 * Records to add (suggestions, an AI draft), previewed first: what would be added, with nothing
 * written. Added, they show as "What changed?" with a way to take them all back. Nothing the
 * person has, edited, finished or removed is ever touched. `children` show above the preview until
 * it is added: what it was asked from (an AI's progress), and, while `ask` is null, why there is
 * nothing to preview yet. A draft refused as added already is taken as added: the trip's records
 * are asked for afresh, and only Close is left.
 */
export function PreviewDialog({
  title,
  intro,
  none,
  add,
  failed,
  previewKey,
  ask,
  onClose,
  children,
}: {
  title: string;
  /** Said over the preview: nothing is added yet, and what these are. */
  intro: string;
  /** Said when there is nothing to add. */
  none: string;
  /** The button that adds them, by how many. */
  add: (count: number) => string;
  /** What couldn't be loaded, when the preview fails for no reason of Travel's own. */
  failed: string;
  /** Unique to what is asked: the preview is asked afresh for each. */
  previewKey: QueryKey;
  ask: AskAddition | null;
  onClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { trip } = useTripContext();
  const client = useQueryClient();
  const adding = useTravelChange((asked: AskAddition) => asked(true));
  const undo = useUndo();
  const [done, setDone] = useState<Addition | null>(null);
  const added = failureCode(adding.error) === ADDED;
  const preview = useQuery({
    queryKey: previewKey,
    queryFn: ask && !done ? () => ask(false) : skipToken,
    staleTime: 0,
    gcTime: 0,
  });
  const shown = ask ? preview.data : undefined;
  const code = failureCode(preview.error) ?? '';

  const apply = useOnce(async () => {
    if (!ask) return false;
    const result = await adding.mutateAsync(ask).catch((error: unknown) => {
      if (failureCode(error) === ADDED) void client.invalidateQueries({ queryKey: travelKeys.all });
      return null; // shown from adding.error
    });
    if (result) setDone(result);
    return result !== null;
  });

  const takeBack = useOnce(async () => {
    const undone = await undo.mutateAsync(done?.event_id ?? '').catch(() => null);
    if (undone) {
      toast(t('change.undone'), { tone: 'success' });
      onClose();
    }
    return undone !== null;
  });

  const close = (label: string) => (
    <Button variant="secondary" className="min-h-11 flex-1" onClick={onClose}>
      {label}
    </Button>
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={done ? t('change.whatChanged') : title}
    >
      <div className="space-y-4">
        <Failure error={undo.error ?? adding.error} />
        {done ? (
          <>
            <ChangeList result={done} planned={false} currency={trip.currency} />
            {done.more && <p className="text-sm text-muted">{t('suggest.more')}</p>}
            <div className="flex flex-wrap gap-2">
              {done.event_id && (
                <Button
                  variant="secondary"
                  className="min-h-11"
                  aria-disabled={undo.isPending || undefined}
                  onClick={takeBack}
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                  {t('change.undo')}
                </Button>
              )}
              {close(t('change.close'))}
            </div>
          </>
        ) : added ? (
          <div className="flex">{close(t('change.close'))}</div>
        ) : (
          <>
            {children}
            {!ask ? null : !shown ? (
              <Waiting
                query={preview}
                // A refusal of Travel's own (no room left, say) is worded as such.
                failed={isKnown(en.errors, code) ? failureText(preview.error) : failed}
                className="h-24 rounded-2xl"
              />
            ) : shown.what_changed.length === 0 ? (
              <>
                <p className="text-sm">{none}</p>
                <div className="flex">{close(t('change.close'))}</div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{intro}</p>
                <ChangeList result={shown} planned currency={trip.currency} />
                {shown.more && <p className="text-sm text-muted">{t('suggest.more')}</p>}
                <div className="flex flex-wrap gap-2">
                  {close(tCommon('actions.cancel'))}
                  <Button
                    className="min-h-11 flex-1"
                    aria-disabled={adding.isPending || undefined}
                    onClick={apply}
                  >
                    <Check aria-hidden="true" className="size-4" />
                    {add(shown.what_changed.length)}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
