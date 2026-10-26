import { create } from 'zustand';

import type { components } from '@/core/api/schema';

export type AuthUser = components['schemas']['UserOut'];
export type TokenResponse = components['schemas']['TokenOut'];

/** `unknown` until the first refresh attempt settles (shown as a splash, never as signed out). */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
  status: SessionStatus;
  /** Kept in memory only (ADR-0003); the refresh token lives in an httpOnly cookie. */
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: TokenResponse) => void;
  setUser: (user: AuthUser) => void;
  /** Signed out for good (sign-out, account deleted, the server ended the session): this
   *  browser forgets it had a session. */
  clear: () => void;
  /** Signed out for now: the session couldn't be confirmed (offline, a server error), so the
   *  next start asks the server again. */
  setAnonymous: () => void;
}

/** Whether this browser is known to be signed out: a hint, not a secret (the session itself is
 *  the httpOnly cookie). '0' is written when it signs out (or the server says there is no
 *  session), so later visits open without asking the server (faster, and no 401 in the console).
 *  Without the hint (a new browser, one from before it, or storage the browser cleared, as
 *  Safari does after 7 days) the cookie may still hold a session, so the server is asked. */
const HINT = 'tt-session';

function remember(signedIn: boolean): void {
  try {
    localStorage.setItem(HINT, signedIn ? '1' : '0');
  } catch {
    // storage blocked: every visit asks the server, as before
  }
}

export function mayHaveSession(): boolean {
  try {
    return localStorage.getItem(HINT) !== '0';
  } catch {
    return true; // can't tell: ask the server
  }
}

const ANONYMOUS = { status: 'anonymous', accessToken: null, user: null } as const;

export const useSession = create<SessionState>()((set) => ({
  status: 'unknown',
  accessToken: null,
  user: null,
  setSession: (token) => {
    remember(true);
    set({ status: 'authenticated', accessToken: token.access_token, user: token.user });
  },
  setUser: (user) => {
    set({ user });
  },
  clear: () => {
    remember(false);
    set(ANONYMOUS);
  },
  setAnonymous: () => {
    set(ANONYMOUS);
  },
}));
