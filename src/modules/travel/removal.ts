import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@/design-system';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';
import { useUndo } from '@/modules/travel/plan-api';

const sorry = (error: unknown) => toast(failureText(error), { tone: 'danger' });

/** What a write answers besides: the event of the trip's history it recorded, if any. */
interface Recorded {
  event_id: string | null;
}

/**
 * A toast for a change just made, with Undo: that takes back exactly the event the change
 * answered, nothing found by searching. With none, the change changed nothing: that is said, with
 * nothing to undo. How the undo went is said by toast alone, so a refusal is seen even once what
 * made the change has gone (a dialog closed, a card removed). Answers `(recorded, said)`: `said`
 * is the toast's words.
 */
export function useUndoToast() {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const undo = useUndo();
  return ({ event_id: eventId }: Recorded, said: string) => {
    if (eventId === null) {
      toast(t('change.unchanged'));
      return;
    }
    toast(said, {
      action: {
        label: tCommon('actions.undo'),
        onAction: () => {
          // Not `mutate`'s own callbacks: they are dropped once the one who asked has unmounted.
          void undo
            .mutateAsync(eventId)
            .then(() => toast(t('change.undone'), { tone: 'success' }), sorry);
        },
      },
    });
  };
}

/**
 * Removing a record of the trip with a moment to take it back (`useUndoToast`). A second press
 * while one goes isn't sent again, and a refusal is said. Answers `(id, said)`: `said` is the
 * toast's words.
 */
export function useRemoval(remove: (id: string) => Promise<Recorded>) {
  const undoable = useUndoToast();
  const going = useRef(new Set<string>());

  return async (id: string, said: string) => {
    if (going.current.has(id)) return;
    going.current.add(id);
    try {
      undoable(await remove(id), said);
    } catch (error) {
      sorry(error);
    } finally {
      going.current.delete(id);
    }
  };
}
