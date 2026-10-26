import { usePwa, type InstallPromptEvent } from '@/core/pwa/pwa-store';

const SERVICE_WORKER = `${import.meta.env.BASE_URL}sw.js`;

/** Keep the browser's install offer for the app's own "Install" button. */
export function listenForInstall(target: Window = window): void {
  target.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    usePwa.getState().offerInstall(event as InstallPromptEvent);
  });
  target.addEventListener('appinstalled', () => {
    usePwa.getState().offerInstall(null);
  });
}

/**
 * Register the service worker (production builds only: the dev server has none). A new version
 * is offered once installed, and the page reloads into it only after the user said so. When
 * another tab's user did, this tab is taken over too but keeps running: its offer stays, and
 * Reload then just reloads.
 */
export async function registerServiceWorker(
  container: ServiceWorkerContainer | null = 'serviceWorker' in navigator
    ? navigator.serviceWorker
    : null,
): Promise<void> {
  if (!import.meta.env.PROD || !container) return;
  const registration = await container.register(SERVICE_WORKER);
  const offer = (worker: ServiceWorker | null) => {
    // With no controller yet this is the first install, not an update.
    if (worker && container.controller) usePwa.getState().offerUpdate(worker);
  };
  offer(registration.waiting);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') offer(worker);
    });
  });
  container.addEventListener('controllerchange', () => {
    const { updating, reload } = usePwa.getState();
    if (updating) reload();
  });
}
