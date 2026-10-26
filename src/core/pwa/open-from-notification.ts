/** A path of this app (with its query and hash), or null for anything else: another site,
 *  a protocol-relative `//host`, a `javascript:` URL. */
export function inAppPath(url: unknown, origin: string = window.location.origin): string | null {
  if (typeof url !== 'string' || !url.startsWith('/')) return null;
  const target = new URL(url, origin);
  return target.origin === origin ? target.pathname + target.search + target.hash : null;
}

/**
 * A clicked notification opens its page in this window (ADR-0018): the service worker focuses
 * the window and asks it to route there, without a reload. Routing still leaves the current
 * page: a form with unsaved input asks first (the unsaved-work guard, src/core/forms/).
 */
export function listenForOpen(
  navigate: (path: string) => unknown,
  container: ServiceWorkerContainer | null = 'serviceWorker' in navigator
    ? navigator.serviceWorker
    : null,
): () => void {
  if (!container) return () => undefined;
  const onMessage = (event: MessageEvent<unknown>) => {
    const data = event.data as { type?: unknown; url?: unknown } | null;
    if (data?.type !== 'tt-open') return;
    const path = inAppPath(data.url);
    if (path) void navigate(path);
  };
  container.addEventListener('message', onMessage);
  return () => {
    container.removeEventListener('message', onMessage);
  };
}
