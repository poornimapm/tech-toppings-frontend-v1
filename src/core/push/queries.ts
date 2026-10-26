import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { api, unwrap } from '@/core/api/client';
import { userKeys } from '@/core/auth/queries';
import {
  base64urlBytes,
  clearBrowser,
  currentSubscription,
  matchesKey,
  pushSupported,
  subscribeBrowser,
} from '@/core/push/browser';

const pushKeys = {
  server: [...userKeys.all, 'push'] as const,
  browser: ['push', 'browser'] as const, // this device's, not the account's
};

/** Whether this server can push, and to how many of the user's browsers. */
export function usePushServer(enabled = true) {
  return useQuery({
    queryKey: pushKeys.server,
    queryFn: () => unwrap(api.GET('/v1/push')),
    enabled,
  });
}

/**
 * Whether this browser can receive pushes, what the person allowed, and whether it receives this
 * server's: a subscription made under another key (the server's keys changed) counts as off.
 */
export function useBrowserPush(publicKey: string | null | undefined) {
  return useQuery({
    queryKey: [...pushKeys.browser, publicKey ?? null],
    queryFn: async () => {
      const subscription = await currentSubscription();
      return {
        supported: pushSupported(),
        permission: pushSupported() ? Notification.permission : 'denied',
        subscribed: Boolean(publicKey && subscription && matchesKey(subscription, publicKey)),
      };
    },
    // Read again on coming back, say from the site settings where a block was lifted.
    refetchOnWindowFocus: 'always',
  });
}

/** Where the server pushes to this browser; an upsert, so sending it again is harmless. */
function register(subscription: PushSubscription) {
  const { endpoint = '', keys } = subscription.toJSON();
  return unwrap(
    api.POST('/v1/push/subscriptions', {
      body: { endpoint, keys: { p256dh: keys?.p256dh ?? '', auth: keys?.auth ?? '' } },
    }),
  );
}

function forget(endpoint: string) {
  return unwrap(api.DELETE('/v1/push/subscriptions', { body: { endpoint } }));
}

/**
 * Signing out: this browser stops receiving the account's pushes at once, then the server is
 * told while the token still works (best effort: a later push finds the browser gone anyway).
 */
export async function leaveBrowser(): Promise<void> {
  const endpoint = await clearBrowser();
  if (endpoint) await forget(endpoint);
}

/**
 * The session an access token belongs to: its `sid` claim (a JWT's payload is not secret). A
 * refresh keeps it; a sign-in or a password change issues a new one. A token that is no JWT
 * counts as a session of its own.
 */
export function sessionOf(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  try {
    const payload = base64urlBytes(token.split('.')[1] ?? '');
    const { sid } = JSON.parse(new TextDecoder().decode(payload)) as { sid?: unknown };
    if (typeof sid === 'string' && sid) return sid;
  } catch {
    // not a JWT
  }
  return token;
}

/**
 * Registers this browser's subscription again once per session, when it was already on: the
 * server lets it go when its session ends (a password change ends this one and starts another),
 * may have dropped it for too many devices, or given it to another account signed in here before.
 * `session` is from {@link sessionOf}; `subscribed` is undefined until known.
 */
export function useKeepRegistered(session: string | undefined, subscribed: boolean | undefined) {
  const client = useQueryClient();
  const checked = useRef<string>(undefined);
  useEffect(() => {
    if (!session || subscribed === undefined || checked.current === session) return;
    checked.current = session;
    if (!subscribed) return; // turning it on registers it
    void (async () => {
      const subscription = await currentSubscription();
      if (subscription) await register(subscription);
      await client.invalidateQueries({ queryKey: pushKeys.server });
    })().catch(() => undefined); // best effort: the next start tries again
  }, [client, session, subscribed]);
}

export function usePushActions() {
  const client = useQueryClient();
  const changed = async () => {
    await client.invalidateQueries({ queryKey: pushKeys.server });
    await client.invalidateQueries({ queryKey: pushKeys.browser });
  };
  return {
    /** True once on; false when the person closed the prompt without answering. */
    enable: useMutation({
      mutationFn: async (publicKey: string) => {
        const before = await currentSubscription();
        const subscription = await subscribeBrowser(publicKey);
        if (!subscription) return false;
        try {
          await register(subscription);
        } catch (error) {
          // Unknown to the server, it would get nothing: don't leave it looking on.
          await subscription.unsubscribe().catch(() => false);
          throw error;
        }
        // One made under an old key was replaced: its endpoint is dead.
        if (before && before.endpoint !== subscription.endpoint) {
          await forget(before.endpoint).catch(() => undefined);
        }
        return true;
      },
      onSettled: changed,
    }),
    disable: useMutation({
      mutationFn: async () => {
        const subscription = await currentSubscription();
        if (!subscription) return;
        try {
          await forget(subscription.endpoint);
        } finally {
          await clearBrowser(); // the server not told: its next push here finds it gone
        }
      },
      onSettled: changed,
    }),
    test: useMutation({ mutationFn: () => unwrap(api.POST('/v1/push/test')) }),
  };
}
