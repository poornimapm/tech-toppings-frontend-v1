import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { runSignOutSteps } from '@/core/auth/device-cleanup';
import { useSession } from '@/core/auth/session-store';
import { errorEnvelope, server, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

const PUBLIC_KEY =
  'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
const OLD_KEY = `B${'A'.repeat(PUBLIC_KEY.length - 1)}`;
const endpointOf = (n: number) => `https://fcm.googleapis.com/fcm/send/browser-${n}`;
const KEYS = { p256dh: 'browser-key', auth: 'browser-auth' };

beforeAll(async () => {
  await import('@/platform/notifications/notifications-page');
}, 120_000);

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

function bytesOf(base64url: string): Uint8Array<ArrayBuffer> {
  const raw = atob(base64url.replaceAll('-', '+').replaceAll('_', '/') + '=');
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

interface Options {
  /** What the person answers to "allow notifications?" (`default`: closed the prompt). */
  answer?: NotificationPermission;
  /** No service worker: the dev server, or one that failed to install. */
  noWorker?: boolean;
  /** Already subscribed, under this key. */
  heldUnder?: string;
}

/** This browser's push support, as a real one behaves. */
function fakeBrowser({ answer = 'granted', noWorker = false, heldUnder }: Options = {}) {
  let permission: NotificationPermission = heldUnder ? 'granted' : 'default';
  let made = 0;
  let held: { endpoint: string } | null = null;
  const subscribe = vi.fn(({ applicationServerKey }: PushSubscriptionOptionsInit) => {
    made += 1;
    const subscription = {
      endpoint: endpointOf(made),
      options: { applicationServerKey: (applicationServerKey as Uint8Array).slice().buffer },
      toJSON: () => ({ endpoint: subscription.endpoint, keys: KEYS }),
      unsubscribe: () => {
        held = null;
        return Promise.resolve(true);
      },
    };
    held = subscription;
    return Promise.resolve(subscription);
  });
  if (heldUnder) void subscribe({ applicationServerKey: bytesOf(heldUnder) });
  subscribe.mockClear();
  const registration = noWorker
    ? undefined
    : { pushManager: { getSubscription: () => Promise.resolve(held), subscribe } };
  const requestPermission = vi.fn(() => {
    permission = answer;
    return Promise.resolve(answer);
  });
  vi.stubGlobal('PushManager', {}); // only its presence is checked
  vi.stubGlobal('Notification', {
    get permission() {
      return permission;
    },
    requestPermission,
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve(registration),
      ready: Promise.resolve(registration),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  return { subscribe, requestPermission, held: () => held };
}

/** A server that can push, remembering what it was sent. */
function pushServer() {
  const sent: { method: string; body: unknown }[] = [];
  let devices = 0;
  server.use(
    http.get('*/api/v1/push', () =>
      HttpResponse.json({ available: true, public_key: PUBLIC_KEY, devices }),
    ),
    http.post('*/api/v1/push/subscriptions', async ({ request }) => {
      sent.push({ method: 'POST', body: await request.json() });
      devices = 1;
      return HttpResponse.json({ available: true, public_key: PUBLIC_KEY, devices });
    }),
    http.delete('*/api/v1/push/subscriptions', async ({ request }) => {
      sent.push({ method: 'DELETE', body: await request.json() });
      devices = 0;
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/v1/push/test', () => HttpResponse.json({ sent: devices })),
  );
  return sent;
}

/** An access token as the server makes them: a JWT whose payload names its session. */
function jwt(sid: string, iat = 0): string {
  const part = (json: object) =>
    btoa(JSON.stringify(json)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `${part({ alg: 'HS256' })}.${part({ sid, iat })}.signature`;
}

/** Holds a request until released. */
function gate() {
  let open!: () => void;
  const held = new Promise<void>((resolve) => {
    open = resolve;
  });
  return {
    held,
    release: () => {
      open();
    },
  };
}

async function card() {
  const app = renderApp('/notifications');
  const title = await screen.findByRole('heading', { name: 'Reminders on this device' });
  return { ...app, section: within(title.closest('section') ?? document.body) };
}

describe('reminders on this device', () => {
  it('is turned on in this browser, tested, and turned off, keeping focus and saying so', async () => {
    const browser = fakeBrowser();
    const sent = pushServer();
    const { user, section } = await card();
    expect(section.getByRole('status')).toHaveTextContent(/^Off for this browser\./);

    await user.click(section.getByRole('button', { name: 'Turn on' }));
    await waitFor(() => {
      expect(section.getByRole('status')).toHaveTextContent('On for this browser.');
    });
    await waitFor(() => {
      expect(section.getByRole('button', { name: 'Send a test' })).toHaveFocus();
    });
    const [options] = browser.subscribe.mock.calls[0] ?? [];
    expect(options?.userVisibleOnly).toBe(true);
    expect((options?.applicationServerKey as Uint8Array).length).toBe(65);
    expect(sent).toEqual([{ method: 'POST', body: { endpoint: endpointOf(1), keys: KEYS } }]);

    await user.click(section.getByRole('button', { name: 'Send a test' }));
    expect(await screen.findByText('Sent to 1 device.')).toBeInTheDocument();

    await user.click(section.getByRole('button', { name: 'Turn off' }));
    await waitFor(() => {
      expect(section.getByRole('button', { name: 'Turn on' })).toHaveFocus();
    });
    expect(section.getByRole('status')).toHaveTextContent(/^Off for this browser\./);
    expect(sent.at(-1)).toEqual({ method: 'DELETE', body: { endpoint: endpointOf(1) } });
    expect(browser.held()).toBeNull();
  });

  it('says blocked only when the person said no', async () => {
    fakeBrowser({ answer: 'denied' });
    pushServer();
    const { user, section } = await card();
    await user.click(section.getByRole('button', { name: 'Turn on' }));
    await waitFor(() => {
      expect(section.getByRole('status')).toHaveTextContent(/blocked for this site/);
    });
    expect(section.queryByRole('button')).toBeNull();
    await waitFor(() => {
      expect(section.getByRole('status')).toHaveFocus();
    });
  });

  it.each<[string, Options, RegExp]>([
    ['a prompt closed without an answer', { answer: 'default' }, /weren't allowed yet/],
    ['no service worker', { noWorker: true }, /isn't ready for notifications yet/],
  ])('leaves it to try again after %s', async (_case, options, hint) => {
    const browser = fakeBrowser(options);
    pushServer();
    const { user, section } = await card();
    await user.click(section.getByRole('button', { name: 'Turn on' }));
    await waitFor(() => {
      expect(section.getByRole('status')).toHaveTextContent(hint);
    });
    expect(section.getByRole('button', { name: 'Turn on' })).toHaveFocus();
    expect(section.queryByRole('alert')).toBeEmptyDOMElement();
    expect(browser.requestPermission).toHaveBeenCalledTimes(options.noWorker ? 0 : 1);
  });

  it('lets the browser go again when the server won’t take it', async () => {
    const browser = fakeBrowser();
    pushServer();
    server.use(
      http.post('*/api/v1/push/subscriptions', () =>
        HttpResponse.json(errorEnvelope('PUSH_ENDPOINT_NOT_ALLOWED', 'x'), { status: 422 }),
      ),
    );
    const { user, section } = await card();
    await user.click(section.getByRole('button', { name: 'Turn on' }));
    expect(await section.findByText(/notification service isn't one/)).toBeVisible();
    expect(browser.held()).toBeNull();
    expect(section.getByRole('button', { name: 'Turn on' })).toBeVisible();
  });

  it('counts a subscription under old keys as off, and replaces it', async () => {
    fakeBrowser({ heldUnder: OLD_KEY });
    const sent = pushServer();
    const { user, section } = await card();
    expect(section.getByRole('status')).toHaveTextContent(/^Off for this browser\./);

    await user.click(section.getByRole('button', { name: 'Turn on' }));
    await waitFor(() => {
      expect(section.getByRole('status')).toHaveTextContent('On for this browser.');
    });
    expect(sent).toEqual([
      { method: 'POST', body: { endpoint: endpointOf(2), keys: KEYS } },
      { method: 'DELETE', body: { endpoint: endpointOf(1) } },
    ]);
  });

  it('reminds the server of this browser once per sign-in, and lets it go on sign-out', async () => {
    const browser = fakeBrowser({ heldUnder: PUBLIC_KEY });
    const drop = vi.fn(() => Promise.resolve(true));
    const put = vi.fn(() => Promise.resolve());
    vi.stubGlobal('caches', { delete: drop, open: () => Promise.resolve({ put }) });
    const sent = pushServer();
    const { section, unmount } = await card();
    expect(section.getByRole('status')).toHaveTextContent('On for this browser.');
    await waitFor(() => {
      expect(sent).toEqual([{ method: 'POST', body: { endpoint: endpointOf(1), keys: KEYS } }]);
    });
    expect(put).toHaveBeenCalled(); // the worker's wording, while it receives pushes

    await runSignOutSteps(1000);
    expect(browser.held()).toBeNull();
    expect(drop).toHaveBeenCalledWith('tt-push-texts');
    expect(sent.at(-1)).toEqual({ method: 'DELETE', body: { endpoint: endpointOf(1) } });

    unmount();
    await runSignOutSteps(1000);
    expect(sent).toHaveLength(2); // signed out: the step is gone with the shell
  });

  it('reminds the server again for a new session (a password change), not for a refresh', async () => {
    fakeBrowser({ heldUnder: PUBLIC_KEY });
    pushServer();
    const bearers: (string | null)[] = [];
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ ...tokenFor(), access_token: jwt('session-1') }),
      ),
      http.post('*/api/v1/push/subscriptions', ({ request }) => {
        bearers.push(request.headers.get('Authorization'));
        return HttpResponse.json({ available: true, public_key: PUBLIC_KEY, devices: 1 });
      }),
    );
    await card();
    await waitFor(() => {
      expect(bearers).toEqual([`Bearer ${jwt('session-1')}`]);
    });

    // The same user both times: the server ended the old session, and its browsers with it.
    const signedIn = (token: string) => {
      act(() => {
        useSession.getState().setSession({ ...tokenFor(), access_token: token });
      });
    };
    signedIn(jwt('session-1', 1)); // a refresh keeps the session
    signedIn(jwt('session-2', 2)); // a password change issues a new one
    await waitFor(() => {
      expect(bearers).toHaveLength(2);
    });
    expect(bearers[1]).toBe(`Bearer ${jwt('session-2', 2)}`);
  });

  it('starts no test while turning off, and still moves focus once off', async () => {
    fakeBrowser({ heldUnder: PUBLIC_KEY });
    const sent = pushServer();
    const deleting = gate();
    const tests = vi.fn();
    server.use(
      http.delete('*/api/v1/push/subscriptions', async () => {
        sent.push({ method: 'DELETE', body: null });
        await deleting.held;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('*/api/v1/push/test', () => {
        tests();
        return HttpResponse.json({ sent: 1 });
      }),
    );
    const { user, section } = await card();
    const turnOff = section.getByRole('button', { name: 'Turn off' });
    await user.click(turnOff);
    await waitFor(() => {
      expect(sent.at(-1)?.method).toBe('DELETE');
    });

    const sendTest = section.getByRole('button', { name: 'Send a test' });
    expect(sendTest).toHaveAttribute('aria-disabled', 'true');
    await user.click(sendTest);
    expect(turnOff).toHaveAttribute('aria-disabled', 'true'); // still turning off: not reset
    await user.click(turnOff);
    expect(sent.filter(({ method }) => method === 'DELETE')).toHaveLength(1);

    deleting.release();
    await waitFor(() => {
      expect(section.getByRole('button', { name: 'Turn on' })).toHaveFocus();
    });
    expect(tests).not.toHaveBeenCalled();
  });

  it('still says how a test went when turned off before it answered', async () => {
    fakeBrowser({ heldUnder: PUBLIC_KEY });
    pushServer();
    const answering = gate();
    server.use(
      http.post('*/api/v1/push/test', async () => {
        await answering.held;
        return HttpResponse.json({ sent: 1 });
      }),
    );
    const { user, section } = await card();
    await user.click(section.getByRole('button', { name: 'Send a test' }));
    await user.click(section.getByRole('button', { name: 'Turn off' }));
    await waitFor(() => {
      expect(section.getByRole('button', { name: 'Turn on' })).toHaveFocus();
    });

    answering.release();
    expect(await screen.findByText('Sent to 1 device.')).toBeInTheDocument();
  });

  it('says how on a browser without push (an iPhone outside the Home Screen)', async () => {
    pushServer();
    expect((await card()).section.getByText(/add the app to the Home Screen/)).toBeVisible();
  });

  it('shows nothing where the server can’t push', async () => {
    fakeBrowser();
    renderApp('/notifications');
    await screen.findByRole('heading', { level: 1, name: 'Notifications' });
    expect(screen.queryByRole('heading', { name: 'Reminders on this device' })).toBeNull();
  });
});
