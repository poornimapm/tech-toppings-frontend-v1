import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { beforeSignOut, onForgetAccount } from '@/core/auth/device-cleanup';
import { userKeys } from '@/core/auth/queries';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';
import { toLanguage } from '@/core/i18n';
import { textFor } from '@/core/modules/module-text';
import { slugOf, useModuleRegistry } from '@/core/modules/registry';
import { clearBrowser, pushSupported, writePushTexts } from '@/core/push/browser';
import {
  leaveBrowser,
  sessionOf,
  useBrowserPush,
  useKeepRegistered,
  usePushServer,
} from '@/core/push/queries';
import type { PushTexts } from '@/core/push/texts';

/** `{module: {launched: '…'}}` -> `{'module.launched': '…'}`: notification codes are dotted. */
function flatten(tree: unknown, prefix = ''): Record<string, string> {
  if (typeof tree === 'string') return { [prefix]: tree };
  if (typeof tree !== 'object' || tree === null) return {};
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      Object.entries(flatten(value, prefix ? `${prefix}.${key}` : key)),
    ),
  );
}

/**
 * Keeps the service worker able to word pushes (ADR-0018): while this browser receives them,
 * the texts are written again whenever the language changes, and the server is reminded of it
 * once per session. A push always shows a notification, even with the app in front; open
 * windows also refresh their bell. Signing out (or deleting the account) stops this browser's
 * pushes.
 */
export function PushSync() {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const registry = useModuleRegistry();
  const session = useSession((state) => sessionOf(state.accessToken));
  const publicKey = usePushServer(pushSupported()).data?.public_key ?? null;
  const browser = useBrowserPush(publicKey).data;
  const subscribed = browser?.subscribed ?? false;
  const language = toLanguage(i18n.language);

  useKeepRegistered(session, publicKey ? browser?.subscribed : undefined);

  useEffect(() => {
    const unregister = [beforeSignOut(leaveBrowser), onForgetAccount(clearBrowser)];
    return () => {
      unregister.forEach((stop) => {
        stop();
      });
    };
  }, []);

  useEffect(() => {
    if (!subscribed) return;
    const texts: PushTexts = {
      language,
      appName: env.appName,
      fallback: t('push.fallback'),
      feed: flatten(t('feed', { returnObjects: true })),
      modules: {},
      links: {},
    };
    for (const definition of registry.all()) {
      const strings = textFor(definition, language);
      Object.assign(texts.feed, strings.feed);
      Object.assign(texts.links, definition.links);
      texts.modules[definition.key] = { name: strings.name, home: `/m/${slugOf(definition.key)}` };
    }
    void writePushTexts(texts);
  }, [language, registry, subscribed, t]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const container = navigator.serviceWorker;
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === 'tt-push') void client.invalidateQueries({ queryKey: userKeys.all });
    };
    container.addEventListener('message', onMessage);
    return () => {
      container.removeEventListener('message', onMessage);
    };
  }, [client]);

  return null;
}
