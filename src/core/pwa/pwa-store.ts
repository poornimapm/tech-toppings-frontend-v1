import { create } from 'zustand';

/** Chrome's install offer (not in the DOM typings): kept until the user asks to install. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** A new version, installed and waiting for the user to reload into it. */
  waiting: ServiceWorker | null;
  /** The browser offers to install the app (until it is installed or the offer is used). */
  installPrompt: InstallPromptEvent | null;
  /** Set when the user chose to reload into the new version. */
  updating: boolean;
  /** How the page reloads into the new version (tests replace it: jsdom cannot reload). */
  reload: () => void;
  offerUpdate: (worker: ServiceWorker) => void;
  applyUpdate: () => void;
  offerInstall: (event: InstallPromptEvent | null) => void;
  install: () => Promise<void>;
}

export const usePwa = create<PwaState>()((set, get) => ({
  waiting: null,
  installPrompt: null,
  updating: false,
  reload: () => {
    window.location.reload();
  },
  offerUpdate: (worker) => {
    set({ waiting: worker, updating: false }); // a newer one replaces any still on its way
  },
  applyUpdate: () => {
    const { waiting, reload } = get();
    set({ updating: true });
    // Only a waiting version can be asked to take over (the page reloads when it has). One that
    // another tab already started is in charge here too, so no takeover will come: reload now.
    // So does a press after the takeover, when the user stayed at the leave prompt (unsaved
    // work). A press before it asks again, rather than reload the old version mid-takeover.
    if (waiting?.state === 'installed') waiting.postMessage('skip-waiting');
    else reload();
  },
  offerInstall: (event) => {
    set({ installPrompt: event });
  },
  install: async () => {
    const event = get().installPrompt;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    set({ installPrompt: null }); // an offer can be used once
  },
}));
