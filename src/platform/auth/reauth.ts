import { useState } from 'react';

import { ApiError } from '@/core/api/api-error';
import { useSession } from '@/core/auth/session-store';

/**
 * Proof it's really the account holder, now, before a change a stolen session must not make:
 * the password, or for an account without one a Google sign-in made moments ago.
 */
export function useReauth() {
  const hasPassword = useSession((state) => state.user?.has_password ?? true);
  const [password, setPassword] = useState('');
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  return {
    hasPassword,
    password,
    setPassword,
    googleToken,
    setGoogleToken,
    body: {
      password: hasPassword ? password : null,
      google_id_token: hasPassword ? null : googleToken,
    },
    ready: hasPassword ? password.length > 0 : googleToken !== null,
    /** The server refused the Google sign-in (too old, or someone else's): ask for a new one. */
    retryOn: (error: unknown) => {
      if (error instanceof ApiError && error.code === 'AUTH_GOOGLE_REAUTH_REQUIRED') {
        setGoogleToken(null);
      }
    },
  };
}

export type Reauth = ReturnType<typeof useReauth>;
