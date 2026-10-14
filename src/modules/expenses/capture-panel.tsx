import { useState } from 'react';
import { useLocation } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { todayIn } from '@/core/utils/dates';
import { draftsFrom, type Draft } from '@/modules/expenses/capture';
import { DraftsTray } from '@/modules/expenses/drafts-tray';
import { QuickAdd } from '@/modules/expenses/quick-add';

/**
 * Capture on the Expenses page: the quick-add bar and the drafts waiting to be checked.
 * Drafts also arrive from the general assistant (the command palette), which opens this page
 * with them in the router state.
 *
 * Reading and saving overlap (new text can be read while a draft is still saving), so the
 * list only ever changes by adding or removing from its latest value, never by replacing it
 * with a copy taken earlier.
 */
export function CapturePanel() {
  const location = useLocation();
  const timezone = useSession((state) => state.user?.timezone);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [taken, setTaken] = useState<ClientAction | null>(null);
  const add = (more: Draft[]) => {
    setDrafts((current) => [...current, ...more]);
  };

  const handed = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  if (handed && handed !== taken) {
    // Taken once: the same state stays in the location while filters change the URL.
    setTaken(handed);
    add(draftsFrom(handed, todayIn(timezone)));
  }

  return (
    <>
      <QuickAdd onDrafts={add} />
      <DraftsTray
        drafts={drafts}
        onRemove={(key) => {
          setDrafts((current) => current.filter((draft) => draft.key !== key));
        }}
      />
    </>
  );
}
