import { Check, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, toast } from '@/design-system';
import { ChangeList } from '@/modules/travel/change-list';
import {
  useApplySuggestions,
  useSuggestions,
  type SuggestAsk,
  type SuggestResult,
} from '@/modules/travel/checklist-api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useUndo } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { useOnce } from '@/modules/travel/use-once';
import { Waiting } from '@/modules/travel/waiting';

/**
 * Suggestions by rule, previewed first: what would be added, with nothing written, labelled as
 * suggestions rather than requirements. Added, they show as "What changed?" with a way to take
 * them all back. Nothing the person has, edited, finished or removed is ever touched.
 */
export function SuggestDialog({ asked, onClose }: { asked: SuggestAsk; onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { trip } = useTripContext();
  const add = useApplySuggestions(trip.id);
  const undo = useUndo();
  const [done, setDone] = useState<SuggestResult | null>(null);
  const preview = useSuggestions(trip.id, asked, done === null);
  const shown = preview.data;

  const apply = useOnce(async () => {
    const result = await add.mutateAsync(asked).catch(() => null); // shown from add.error
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
      title={done ? t('change.whatChanged') : t(asked.packing ? 'suggest.packing' : 'suggest.day')}
    >
      <div className="space-y-4">
        <Failure error={undo.error ?? add.error} />
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
        ) : !shown ? (
          <Waiting query={preview} failed={t('suggest.loadError')} className="h-24 rounded-2xl" />
        ) : shown.what_changed.length === 0 ? (
          <>
            <p className="text-sm">{t('suggest.none')}</p>
            <div className="flex">{close(t('change.close'))}</div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{t('suggest.intro')}</p>
            <ChangeList result={shown} planned currency={trip.currency} />
            {shown.more && <p className="text-sm text-muted">{t('suggest.more')}</p>}
            <div className="flex flex-wrap gap-2">
              {close(tCommon('actions.cancel'))}
              <Button
                className="min-h-11 flex-1"
                aria-disabled={add.isPending || undefined}
                onClick={apply}
              >
                <Check aria-hidden="true" className="size-4" />
                {t('suggest.add', { count: shown.what_changed.length })}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
