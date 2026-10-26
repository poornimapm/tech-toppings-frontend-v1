import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { saveFile } from '@/core/api/save-file';
import { forgetAccount } from '@/core/auth/device-cleanup';
import { userKeys } from '@/core/auth/queries';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';

type Schemas = components['schemas'];
export type TwoFactorStatus = Schemas['TwoFactorOut'];
export type TwoFactorConfirmIn = Schemas['TwoFactorConfirmIn'];
export type AccountDeleteIn = Schemas['AccountDeleteIn'];

const twoFactorKey = [...userKeys.all, 'two-factor'] as const;

/** Keep the signed-in user's `two_factor` flag in step with the server. */
function markTwoFactor(on: boolean): void {
  const { user, setUser } = useSession.getState();
  if (user) setUser({ ...user, two_factor: on });
}

export function useTwoFactor() {
  return useQuery({
    queryKey: twoFactorKey,
    queryFn: () => unwrap(api.GET('/v1/auth/totp')),
  });
}

/**
 * Turning it on, off, and renewing recovery codes: each refreshes the status once it worked
 * (a wrong code changed nothing, and costs no extra request against the rate limit).
 */
export function useTwoFactorActions() {
  const queryClient = useQueryClient();
  const changed = () => queryClient.invalidateQueries({ queryKey: twoFactorKey });
  return {
    setup: useMutation({ mutationFn: () => unwrap(api.POST('/v1/auth/totp/setup')) }),
    enable: useMutation({
      mutationFn: (body: TwoFactorConfirmIn) => unwrap(api.POST('/v1/auth/totp/enable', { body })),
      onSuccess: () => {
        markTwoFactor(true);
        void changed();
      },
    }),
    disable: useMutation({
      mutationFn: (body: TwoFactorConfirmIn) => unwrap(api.POST('/v1/auth/totp/disable', { body })),
      onSuccess: () => {
        markTwoFactor(false);
        void changed();
      },
    }),
    renew: useMutation({
      mutationFn: (code: string) =>
        unwrap(api.POST('/v1/auth/totp/recovery-codes', { body: { code } })),
      onSuccess: changed,
    }),
  };
}

const EXPORT_NAME = 'my-data.json';

/** Everything the app keeps about the user, downloaded as one JSON file. */
export function useExportData() {
  return useMutation({
    mutationFn: () => saveFile(api.GET('/v1/me/export', { parseAs: 'blob' }), EXPORT_NAME),
  });
}

/**
 * Delete the account for good; on success the session is gone and so is the user's cached data,
 * including what this device kept for it (offline items, drafts).
 * `onDeleted` runs first: clearing the session unmounts the page that asked, and a callback
 * passed to `mutate` would never run.
 */
export function useDeleteAccount(onDeleted: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AccountDeleteIn) => unwrap(api.DELETE('/v1/me', { body })),
    onSuccess: async () => {
      const owner = useSession.getState().user?.id;
      if (owner) await forgetAccount(owner, env.wakeThresholdMs);
      onDeleted();
      useSession.getState().clear();
      queryClient.removeQueries({ queryKey: userKeys.all });
    },
  });
}
