import { useState } from 'react';
import { useLocation } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { todayIn } from '@/core/utils/dates';
import { draftsFrom, type Draft } from '@/modules/expenses/capture';
import { DraftsTray } from '@/modules/expenses/drafts-tray';
import { iouDraftsFrom, type IouDraft } from '@/modules/expenses/iou-capture';
import { useKeyedList } from '@/modules/expenses/keyed-list';
import { QuickAdd } from '@/modules/expenses/quick-add';

/**
 * Capture on the Expenses page: the quick-add bar and what waits to be checked, entries and
 * loans. Both also arrive from the general assistant (the command palette), which opens this
 * page with them in the router state.
 */
export function CapturePanel() {
  const location = useLocation();
  const timezone = useSession((state) => state.user?.timezone);
  const drafts = useKeyedList<Draft>();
  const loans = useKeyedList<IouDraft>();
  const [taken, setTaken] = useState<ClientAction | null>(null);

  /** Puts what the assistant handed over on the card; false when there was nothing to check. */
  function take(actions: ClientAction[]): boolean {
    const today = todayIn(timezone);
    const entries = actions.flatMap((action) => draftsFrom(action, today));
    const owed = actions.flatMap((action) => iouDraftsFrom(action, today));
    drafts.add(entries);
    loans.add(owed);
    return entries.length + owed.length > 0;
  }

  const handed = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  if (handed && handed !== taken) {
    // Taken once: the same state stays in the location while filters change the URL.
    setTaken(handed);
    take([handed]);
  }

  return (
    <>
      <QuickAdd onRead={take} />
      <DraftsTray drafts={drafts.items} onRemove={drafts.remove} loans={loans} />
    </>
  );
}
