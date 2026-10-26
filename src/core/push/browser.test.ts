import { afterEach, describe, expect, it, vi } from 'vitest';

import { env } from '@/core/config/env';
import {
  clearBrowser,
  matchesKey,
  PushDeniedError,
  PushNoWorkerError,
  subscribeBrowser,
} from '@/core/push/browser';

const KEY =
  'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
const OLD_KEY = `B${'A'.repeat(KEY.length - 1)}`;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

/** A browser with push: its worker (active, still installing, or none) and the person's answer. */
function fakeBrowser({
  answer = 'granted',
  worker = 'active',
}: { answer?: NotificationPermission; worker?: 'active' | 'installing' | 'none' } = {}) {
  let held: PushSubscription | null = null;
  let made = 0;
  const unsubscribed: string[] = [];
  const subscribe = vi.fn(({ applicationServerKey }: PushSubscriptionOptionsInit) => {
    made += 1;
    const endpoint = `https://fcm.googleapis.com/fcm/send/${made}`;
    const subscription = {
      endpoint,
      options: { applicationServerKey: (applicationServerKey as Uint8Array).slice().buffer },
      unsubscribe: () => {
        unsubscribed.push(endpoint);
        held = null;
        return Promise.resolve(true);
      },
    } as unknown as PushSubscription;
    held = subscription;
    return Promise.resolve(subscription);
  });
  const registration = { pushManager: { getSubscription: () => Promise.resolve(held), subscribe } };
  const requestPermission = vi.fn(() => Promise.resolve(answer));
  vi.stubGlobal('PushManager', {});
  vi.stubGlobal('Notification', { permission: 'default', requestPermission });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve(worker === 'none' ? undefined : registration),
      ready: worker === 'active' ? Promise.resolve(registration) : new Promise(() => undefined),
    },
  });
  return { subscribe, requestPermission, unsubscribed };
}

async function subscribed(key: string): Promise<PushSubscription> {
  const subscription = await subscribeBrowser(key);
  if (!subscription) throw new Error('not subscribed');
  return subscription;
}

describe('this browser’s subscription', () => {
  it('counts only one made under the server’s current key', async () => {
    fakeBrowser();
    const subscription = await subscribed(KEY);

    expect(matchesKey(subscription, KEY)).toBe(true);
    expect(matchesKey(subscription, OLD_KEY)).toBe(false);
    const keyless = { options: { applicationServerKey: null } } as PushSubscription;
    expect(matchesKey(keyless, KEY)).toBe(false);
  });

  it('replaces one made under an old key, and keeps a current one', async () => {
    const { subscribe, unsubscribed } = fakeBrowser();
    const old = await subscribed(OLD_KEY);

    const current = await subscribed(KEY);
    expect(unsubscribed).toEqual([old.endpoint]); // a browser refuses a second one
    expect(current.endpoint).not.toBe(old.endpoint);
    expect(await subscribed(KEY)).toBe(current);
    expect(subscribe).toHaveBeenCalledTimes(2);
  });

  it('is blocked only by “no”: a prompt closed without an answer decides nothing', async () => {
    fakeBrowser({ answer: 'denied' });
    await expect(subscribeBrowser(KEY)).rejects.toBeInstanceOf(PushDeniedError);

    const { subscribe } = fakeBrowser({ answer: 'default' });
    expect(await subscribeBrowser(KEY)).toBeNull();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('asks nothing without an active worker, and waits only briefly for one installing', async () => {
    const none = fakeBrowser({ worker: 'none' });
    await expect(subscribeBrowser(KEY)).rejects.toBeInstanceOf(PushNoWorkerError);
    expect(none.requestPermission).not.toHaveBeenCalled();

    vi.useFakeTimers();
    const installing = fakeBrowser({ worker: 'installing' });
    const refused = expect(subscribeBrowser(KEY)).rejects.toBeInstanceOf(PushNoWorkerError);
    await vi.advanceTimersByTimeAsync(env.wakeThresholdMs);
    await refused;
    expect(installing.requestPermission).not.toHaveBeenCalled();
  });

  it('is let go together with the wording the worker kept for it', async () => {
    const { unsubscribed } = fakeBrowser();
    const subscription = await subscribed(KEY);
    const drop = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal('caches', { delete: drop });

    expect(await clearBrowser()).toBe(subscription.endpoint);
    expect(unsubscribed).toEqual([subscription.endpoint]);
    expect(drop).toHaveBeenCalledWith('tt-push-texts');
    expect(await clearBrowser()).toBeNull();
  });
});
