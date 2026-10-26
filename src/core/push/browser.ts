import { env } from '@/core/config/env';
import { PUSH_TEXTS_CACHE, PUSH_TEXTS_URL, type PushTexts } from '@/core/push/texts';

/** This browser can receive pushes (iPhone and iPad: only the app added to the Home Screen). */
export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Base64url text as bytes: the server's public key as `applicationServerKey` wants it. */
export function base64urlBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replaceAll('-', '+').replaceAll('_', '/');
  const raw = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

/** Made under this server key: after the keys change, the server can no longer push to it. */
export function matchesKey(subscription: PushSubscription, publicKey: string): boolean {
  const key = subscription.options.applicationServerKey;
  if (!key) return false;
  const given = new Uint8Array(key);
  const wanted = base64urlBytes(publicKey);
  return given.length === wanted.length && given.every((byte, index) => byte === wanted[index]);
}

/** The service worker, once registered (production builds; none on the dev server). */
async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  return pushSupported() ? navigator.serviceWorker.getRegistration() : undefined;
}

/** The worker once active: one still installing (a first visit) is waited for, briefly. */
async function activeWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!(await registration())) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      resolve(undefined);
    }, env.wakeThresholdMs);
  });
  try {
    return await Promise.race([navigator.serviceWorker.ready, late]);
  } finally {
    clearTimeout(timer);
  }
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  return (await (await registration())?.pushManager.getSubscription()) ?? null;
}

/** The person blocked notifications for this site (only their site settings undo it). */
export class PushDeniedError extends Error {
  override readonly name = 'PushDeniedError';
}

/** No active service worker yet (the dev server has none; a first visit may still install it). */
export class PushNoWorkerError extends Error {
  override readonly name = 'PushNoWorkerError';
}

/**
 * Subscribe this browser under `publicKey`, asking the person first; null when they closed the
 * prompt without answering (nothing is decided: they can be asked again). A subscription under
 * another key is dropped first: browsers refuse a second one, and nothing reaches it any more.
 */
export async function subscribeBrowser(publicKey: string): Promise<PushSubscription | null> {
  const worker = await activeWorker();
  if (!worker) throw new PushNoWorkerError();
  const answer = await Notification.requestPermission();
  if (answer === 'denied') throw new PushDeniedError();
  if (answer !== 'granted') return null;
  const existing = await worker.pushManager.getSubscription();
  if (existing && matchesKey(existing, publicKey)) return existing;
  await existing?.unsubscribe();
  return worker.pushManager.subscribe({
    userVisibleOnly: true, // every push shows a notification: no silent tracking
    applicationServerKey: base64urlBytes(publicKey),
  });
}

/** Stop this browser's pushes and drop their wording; the endpoint it had, for the server. */
export async function clearBrowser(): Promise<string | null> {
  const subscription = await currentSubscription();
  const cleared: Promise<boolean>[] = [];
  if (subscription) cleared.push(subscription.unsubscribe());
  if ('caches' in window) cleared.push(caches.delete(PUSH_TEXTS_CACHE));
  await Promise.allSettled(cleared);
  return subscription?.endpoint ?? null;
}

/** Keep the worker's wording in step with the page (language, modules). */
export async function writePushTexts(texts: PushTexts): Promise<void> {
  if (!('caches' in window)) return;
  const cache = await caches.open(PUSH_TEXTS_CACHE);
  await cache.put(
    PUSH_TEXTS_URL,
    new Response(JSON.stringify(texts), { headers: { 'Content-Type': 'application/json' } }),
  );
}
