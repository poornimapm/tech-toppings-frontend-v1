import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { inAppPath, listenForOpen } from '@/core/pwa/open-from-notification';
import { usePwa, type InstallPromptEvent } from '@/core/pwa/pwa-store';
import { listenForInstall, registerServiceWorker } from '@/core/pwa/register';
import { renderApp } from '@/test/render';

const { reload: pageReload } = usePwa.getState();

beforeAll(async () => {
  await import('@/platform/dashboard/dashboard-page');
}, 120_000);

afterEach(() => {
  usePwa.setState({ waiting: null, installPrompt: null, updating: false, reload: pageReload });
});

/** Stands in for the page reload (jsdom cannot reload). */
function fakeReload() {
  const reload = vi.fn();
  usePwa.setState({ reload });
  return reload;
}

/** A worker that remembers what the page told it (`posted`). */
function fakeWorker(state: ServiceWorkerState = 'installed') {
  const posted = vi.fn();
  const worker = Object.assign(new EventTarget(), { state, postMessage: posted });
  return Object.assign(worker as unknown as ServiceWorker, { posted });
}

/** A service worker container with a registration whose waiting/installing workers we set. */
function fakeContainer(controller: boolean, waiting: ServiceWorker | null = null) {
  const registration = Object.assign(new EventTarget(), {
    waiting,
    installing: null as ServiceWorker | null,
  });
  const register = vi.fn(() => Promise.resolve(registration));
  const container = Object.assign(new EventTarget(), {
    controller: controller ? fakeWorker('activated') : null,
    register,
  });
  return { container: container as unknown as ServiceWorkerContainer, registration, register };
}

function installOffer() {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
  return event as InstallPromptEvent & { prompt: ReturnType<typeof vi.fn> };
}

describe('registering the service worker', () => {
  it('does nothing outside a production build', async () => {
    const { container, register } = fakeContainer(true);
    await registerServiceWorker(container);
    expect(register).not.toHaveBeenCalled();
  });

  it('offers a waiting update, and reloads only once the user applies it', async () => {
    vi.stubEnv('PROD', true);
    const waiting = fakeWorker();
    const { container } = fakeContainer(true, waiting);
    const reload = fakeReload();
    await registerServiceWorker(container);
    expect(usePwa.getState().waiting).toBe(waiting);

    usePwa.getState().applyUpdate();
    expect(waiting.posted).toHaveBeenCalledWith('skip-waiting');
    expect(reload).not.toHaveBeenCalled(); // not before the new version is in charge
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('when another tab started the new version, keeps running, and Reload then just reloads', async () => {
    vi.stubEnv('PROD', true);
    const waiting = fakeWorker();
    const { container } = fakeContainer(true, waiting);
    const reload = fakeReload();
    await registerServiceWorker(container);

    // Another tab's Reload: the new version takes this tab over too.
    Object.assign(waiting, { state: 'activated' });
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).not.toHaveBeenCalled(); // not asked for: never reload under the user
    expect(usePwa.getState().waiting).toBe(waiting); // still offered

    usePwa.getState().applyUpdate();
    expect(waiting.posted).not.toHaveBeenCalled(); // it is in charge: no takeover will come
    expect(reload).toHaveBeenCalledOnce();
  });

  it('offers a newer version in place of one still on its way', async () => {
    vi.stubEnv('PROD', true);
    const first = fakeWorker();
    const { container, registration } = fakeContainer(true, first);
    await registerServiceWorker(container);
    usePwa.getState().applyUpdate();
    expect(usePwa.getState().updating).toBe(true);

    const newer = fakeWorker('installing');
    registration.installing = newer;
    registration.dispatchEvent(new Event('updatefound'));
    Object.assign(newer, { state: 'installed' });
    newer.dispatchEvent(new Event('statechange'));
    expect(usePwa.getState()).toMatchObject({ waiting: newer, updating: false }); // Reload works
  });

  it('treats the very first install as no update', async () => {
    vi.stubEnv('PROD', true);
    const { container, registration } = fakeContainer(false);
    await registerServiceWorker(container);
    const worker = fakeWorker('installing');
    registration.installing = worker;
    registration.dispatchEvent(new Event('updatefound'));
    Object.assign(worker, { state: 'installed' });
    worker.dispatchEvent(new Event('statechange'));
    expect(usePwa.getState().waiting).toBeNull();
  });
});

describe('opening a clicked notification', () => {
  function message(data: unknown) {
    return new MessageEvent('message', { data });
  }

  it('routes this window to the notification’s page', () => {
    const container = new EventTarget() as ServiceWorkerContainer;
    const navigate = vi.fn();
    const stop = listenForOpen(navigate, container);
    container.dispatchEvent(message({ type: 'tt-open', url: '/m/expenses/loans?x=1#due' }));
    expect(navigate).toHaveBeenCalledWith('/m/expenses/loans?x=1#due');

    container.dispatchEvent(message({ type: 'tt-push', message: {} }));
    container.dispatchEvent(message({ type: 'tt-open', url: 'https://elsewhere.example.com/' }));
    container.dispatchEvent(message('skip-waiting'));
    stop();
    container.dispatchEvent(message({ type: 'tt-open', url: '/notifications' }));
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('routes only to a path of this app', () => {
    const origin = 'https://app.example.com';
    expect(inAppPath('/notifications', origin)).toBe('/notifications');
    expect(inAppPath('//elsewhere.example.com/x', origin)).toBeNull();
    expect(inAppPath('/\\elsewhere.example.com/x', origin)).toBeNull();
    expect(inAppPath('javascript:alert(1)', origin)).toBeNull();
    expect(inAppPath(`${origin}/notifications`, origin)).toBeNull(); // a path, not a URL
    expect(inAppPath(42, origin)).toBeNull();
  });
});

describe('installing the app', () => {
  it('keeps the browser’s offer for the Install button, and uses it once', async () => {
    const target = new EventTarget() as Window;
    listenForInstall(target);
    const offer = installOffer();
    target.dispatchEvent(offer);
    expect(offer.defaultPrevented).toBe(true); // no mini-infobar: the app asks when it suits
    expect(usePwa.getState().installPrompt).toBe(offer);

    await usePwa.getState().install();
    expect(offer.prompt).toHaveBeenCalledOnce();
    expect(usePwa.getState().installPrompt).toBeNull();
  });

  it('forgets the offer once installed', () => {
    const target = new EventTarget() as Window;
    listenForInstall(target);
    target.dispatchEvent(installOffer());
    target.dispatchEvent(new Event('appinstalled'));
    expect(usePwa.getState().installPrompt).toBeNull();
  });
});

describe('the shell', () => {
  it('says when the device is offline, and when it is back', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderApp('/');
    expect(
      await screen.findByText(/You're offline\. You can keep adding expenses/),
    ).toBeInTheDocument();

    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => {
      expect(screen.queryByText(/You're offline/)).toBeNull();
    });
  });

  it('offers a new version and an install button when there are', async () => {
    const waiting = fakeWorker();
    usePwa.setState({ waiting, installPrompt: installOffer() });
    const { user } = renderApp('/');

    const banner = (await screen.findByText('A new version of the app is ready.')).parentElement;
    await user.click(within(banner ?? document.body).getByRole('button', { name: 'Reload' }));
    expect(waiting.posted).toHaveBeenCalledWith('skip-waiting');
    expect(screen.getByRole('button', { name: 'Install the app on this device' })).toBeVisible();
  });

  it('reloads again on a second press when the user stayed at the leave prompt', async () => {
    vi.stubEnv('PROD', true);
    const waiting = fakeWorker();
    const { container } = fakeContainer(true, waiting);
    const reload = fakeReload(); // does nothing: the user chose to stay (unsaved work)
    await registerServiceWorker(container);
    vi.unstubAllEnvs();
    const { user } = renderApp('/');
    const banner = (await screen.findByText('A new version of the app is ready.')).parentElement;
    const button = within(banner ?? document.body).getByRole('button', { name: 'Reload' });

    await user.click(button);
    Object.assign(waiting, { state: 'activated' }); // the new version took over
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledOnce();

    expect(button).toBeEnabled(); // busy, yet still pressable: no browser reload in the app
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(reload).toHaveBeenCalledTimes(2);
    expect(waiting.posted).toHaveBeenCalledOnce();
  });
});
