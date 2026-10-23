import { ApiError } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useSession, type TokenResponse } from '@/core/auth/session-store';

type Schemas = components['schemas'];

const REFRESH_LOCK = 'tt-auth-refresh';

let inflight: Promise<TokenResponse> | null = null;

/** Run `task` while holding a cross-tab lock where the browser supports Web Locks, so two
 *  tabs never rotate the same refresh cookie at once (ADR-0003). */
async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks ? await locks.request(REFRESH_LOCK, task) : task();
}

async function requestRefresh(retriedRace = false): Promise<TokenResponse> {
  try {
    const token = await unwrap(api.POST('/v1/auth/refresh'));
    useSession.getState().setSession(token);
    return token;
  } catch (error) {
    // Another tab rotated the cookie a moment ago; the browser now holds the new one.
    if (error instanceof ApiError && error.code === 'AUTH_REFRESH_RACE' && !retriedRace) {
      return requestRefresh(true);
    }
    if (error instanceof ApiError && error.status === 401) {
      useSession.getState().clear();
    }
    throw error;
  }
}

/** Exchange the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<TokenResponse> {
  inflight ??= withRefreshLock(() => requestRefresh()).finally(() => {
    inflight = null;
  });
  return inflight;
}

function establish(token: TokenResponse): TokenResponse {
  useSession.getState().setSession(token);
  return token;
}

/** With two-step sign-in on, the first step answers with a challenge instead of a session. */
export type TwoFactorChallenge = Schemas['TwoFactorChallengeOut'];
export type SignInResult = TokenResponse | TwoFactorChallenge;

export function needsCode(result: SignInResult): result is TwoFactorChallenge {
  return 'challenge_token' in result;
}

function establishOrAsk(result: SignInResult): SignInResult {
  return needsCode(result) ? result : establish(result);
}

export async function signIn(credentials: Schemas['LoginIn']): Promise<SignInResult> {
  return establishOrAsk(await unwrap(api.POST('/v1/auth/login', { body: credentials })));
}

/** The second step: the challenge and a code from the authenticator app (or a recovery code). */
export async function finishSignIn(challengeToken: string, code: string): Promise<TokenResponse> {
  return establish(
    await unwrap(
      api.POST('/v1/auth/login/totp', { body: { challenge_token: challengeToken, code } }),
    ),
  );
}

export async function register(details: Schemas['RegisterIn']): Promise<TokenResponse> {
  return establish(await unwrap(api.POST('/v1/auth/register', { body: details })));
}

export async function signInWithGoogle(idToken: string): Promise<SignInResult> {
  return establishOrAsk(await unwrap(api.POST('/v1/auth/google', { body: { id_token: idToken } })));
}

export async function changePassword(input: Schemas['PasswordChangeIn']): Promise<TokenResponse> {
  return establish(await unwrap(api.POST('/v1/auth/password/change', { body: input })));
}

/** Sign out this device. Local state is cleared even if the server can't be reached. */
export async function signOut(): Promise<void> {
  try {
    await unwrap(api.POST('/v1/auth/logout'));
  } finally {
    useSession.getState().clear();
  }
}

export async function signOutEverywhere(): Promise<void> {
  try {
    await unwrap(api.POST('/v1/auth/logout-all'));
  } finally {
    useSession.getState().clear();
  }
}
