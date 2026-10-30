import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { todayIn } from '@/core/utils/dates';
import { draftsFrom } from '@/modules/expenses/capture';
import { entryDrafts, loanDrafts } from '@/modules/expenses/drafts-store';
import { DraftsTray } from '@/modules/expenses/drafts-tray';
import { iouDraftsFrom } from '@/modules/expenses/iou-capture';
import { QuickAdd } from '@/modules/expenses/quick-add';

/**
 * Capture on the Expenses page: the quick-add bar and what waits to be checked, entries and
 * loans. Both also arrive from the general assistant (the command palette), which opens this
 * page with them in the router state, and from what was said offline (read once back online).
 * Drafts are kept on this device until saved or dismissed.
 */
export function CapturePanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const timezone = useSession((state) => state.user?.timezone);
  const drafts = entryDrafts.useList();
  const loans = loanDrafts.useList();
  const [taken, setTaken] = useState<ClientAction | null>(null);

  /** Puts what the assistant handed over on the card (a scan's drafts marked as one receipt);
   *  false when there was nothing to check. */
  function take(actions: ClientAction[], receipt?: string): boolean {
    const today = todayIn(timezone);
    const entries = actions
      .flatMap((action) => draftsFrom(action, today))
      .map((draft) => (receipt ? { ...draft, receipt } : draft));
    const owed = actions.flatMap((action) => iouDraftsFrom(action, today));
    drafts.add(entries);
    loans.add(owed);
    return entries.length + owed.length > 0;
  }

  const handed = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  if (handed && handed !== taken) {
    // Taken once, in this render: the effect below then clears it from the history entry.
    setTaken(handed);
    take([handed]);
  }

  const { pathname, search, hash } = location;
  useEffect(() => {
    // The drafts are kept now: the history entry forgets them, or a reload or Back would hand
    // them over again.
    if (handed) void navigate({ pathname, search, hash }, { replace: true, state: null });
  }, [handed, hash, navigate, pathname, search]);

  return (
    <>
      <QuickAdd onRead={take} />
      <DraftsTray
        drafts={drafts.items}
        onRemove={drafts.remove}
        onCombine={(keys, one) => {
          drafts.add([one]);
          keys.forEach(drafts.remove);
        }}
        loans={loans}
      />
    </>
  );
}
