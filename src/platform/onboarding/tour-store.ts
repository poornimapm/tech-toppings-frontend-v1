import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** An account this new is shown the tour when the app opens (once: then it is "seen"). */
const NEW_ACCOUNT_MS = 10 * 60 * 1000;

interface TourState {
  /** Accounts that have seen the tour on this device. */
  seen: string[];
  /** Asked for again (the palette's "Show the tour"). */
  requested: boolean;
  request: () => void;
  finish: (userId: string) => void;
}

export const useTour = create<TourState>()(
  persist(
    (set) => ({
      seen: [],
      requested: false,
      request: () => {
        set({ requested: true });
      },
      finish: (userId) => {
        set((state) => ({ seen: [...new Set([...state.seen, userId])], requested: false }));
      },
    }),
    { name: 'tt-tour', partialize: (state) => ({ seen: state.seen }) },
  ),
);

/** A just-made account that hasn't seen it, or anyone who asked for it. */
export function shouldShowTour(
  user: { id: string; created_at: string },
  state: Pick<TourState, 'seen' | 'requested'>,
  now: number = Date.now(),
): boolean {
  if (state.requested) return true;
  const fresh = now - new Date(user.created_at).getTime() < NEW_ACCOUNT_MS;
  return fresh && !state.seen.includes(user.id);
}

/** The tour's code is fetched only when it is shown. */
export const loadTour = () => import('@/platform/onboarding/tour');
