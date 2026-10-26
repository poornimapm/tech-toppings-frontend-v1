import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { userKeys } from '@/core/auth/queries';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';
import { useModuleRegistry } from '@/core/modules/registry';
import { flush, loadOutbox, useOutbox, type SenderLookup } from '@/core/offline/outbox';
import { useOnline } from '@/core/pwa/use-online';
import { toast } from '@/design-system';

/**
 * Sends what was made offline (ADR-0010): when the app opens signed in, whenever the device is
 * back online, and when something new is queued while online. The service worker can't do it:
 * the access token lives only in the page.
 */
export function OutboxSync() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const registry = useModuleRegistry();
  const online = useOnline();
  const owner = useSession((state) => (state.status === 'authenticated' ? state.user?.id : null));
  const waiting = useOutbox((state) =>
    state.items.some((item) => item.owner === owner && !item.failure),
  );

  useEffect(() => {
    loadOutbox().catch(() => undefined); // storage unreadable: nothing to show, nothing to send
  }, []);

  useEffect(() => {
    if (!owner || !online || !waiting) return;
    const stop = new AbortController();
    const senderFor: SenderLookup = async (kind) => {
      const load = registry.all().find((module) => module.outbox?.[kind])?.outbox?.[kind];
      return load ? await load() : undefined;
    };
    const send = () =>
      void flush(owner, senderFor, stop.signal)
        .then(async (sent) => {
          if (sent === 0) return;
          toast(t('outbox.sent', { count: sent }), { tone: 'success' });
          await client.invalidateQueries({ queryKey: userKeys.all });
        })
        .catch(() => undefined); // best effort: the next try starts over
    send();
    // Online, but the server may be waking up: try again until all is sent.
    const timer = setInterval(send, env.healthPollMs);
    return () => {
      clearInterval(timer);
      stop.abort(); // signed out, offline or gone: what is left waits
    };
  }, [client, online, owner, registry, t, waiting]);

  return null;
}
