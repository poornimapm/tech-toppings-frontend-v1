import { useCallback } from 'react';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useSession } from '@/core/auth/session-store';

type PreferenceChanges = Pick<components['schemas']['UserUpdate'], 'locale' | 'theme'>;

/** Persist an explicit preference change to the account (signed-in users only), so it follows
 *  the user to other devices. Failures are ignored: the local choice still applies. */
export function useSavePreferences(): (changes: PreferenceChanges) => void {
  return useCallback((changes) => {
    if (useSession.getState().status !== 'authenticated') return;
    unwrap(api.PATCH('/v1/me', { body: changes }))
      .then((user) => {
        useSession.getState().setUser(user);
      })
      .catch(() => undefined);
  }, []);
}
