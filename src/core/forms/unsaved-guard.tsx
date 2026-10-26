import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlocker, type BlockerFunction } from 'react-router';
import { create } from 'zustand';

import { Button, Dialog } from '@/design-system';

/** The forms on screen holding input not yet saved, in the order they got it. */
const useUnsaved = create<{ forms: string[] }>()(() => ({ forms: [] }));

/** Another page replaces this one and its forms; a new search or filter on it keeps them. */
const leavesPage: BlockerFunction = ({ currentLocation, nextLocation }) =>
  currentLocation.pathname !== nextLocation.pathname;

/** Holds every way out of the page while mounted (the router allows one such hold). */
function LeavePrompt() {
  const { t } = useTranslation();
  const blocker = useBlocker(leavesPage);
  useEffect(() => {
    // Closing or reloading the tab: the browser asks, in its own words.
    const ask = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', ask);
    return () => {
      window.removeEventListener('beforeunload', ask);
    };
  }, []);
  const stay = () => {
    blocker.reset?.();
  };

  return (
    <Dialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open) stay();
      }}
      title={t('unsaved.title')}
      description={t('unsaved.body')}
    >
      <div className="flex flex-wrap gap-2">
        <Button onClick={stay}>{t('unsaved.stay')}</Button>
        <Button
          variant="ghost"
          onClick={() => {
            blocker.proceed?.();
          }}
        >
          {t('unsaved.leave')}
        </Button>
      </div>
    </Dialog>
  );
}

/**
 * Keeps input from being lost unseen: while `dirty`, going to another page (a link, the palette,
 * a clicked notification, Back) first asks whether to leave without saving, and closing or
 * reloading the tab asks too. However many forms hold input, one question is asked.
 */
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const id = useId();
  const asks = useUnsaved((state) => state.forms[0] === id);
  useEffect(() => {
    if (!dirty) return;
    useUnsaved.setState((state) => ({ forms: [...state.forms, id] }));
    return () => {
      useUnsaved.setState((state) => ({ forms: state.forms.filter((form) => form !== id) }));
    };
  }, [dirty, id]);

  return asks ? <LeavePrompt /> : null;
}
