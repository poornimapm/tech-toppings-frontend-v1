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
  clear: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  status: 'unknown',
  accessToken: null,
  user: null,
  setSession: (token) => {
    set({ status: 'authenticated', accessToken: token.access_token, user: token.user });
  },
  setUser: (user) => {
    set({ user });
  },
  clear: () => {
    set({ status: 'anonymous', accessToken: null, user: null });
  },
}));
