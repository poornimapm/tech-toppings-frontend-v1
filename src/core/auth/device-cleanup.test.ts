import { describe, expect, it, vi } from 'vitest';

import {
  beforeSignOut,
  forgetAccount,
  onForgetAccount,
  runSignOutSteps,
} from '@/core/auth/device-cleanup';

describe('device cleanup', () => {
  it('runs every sign-out step, even when one throws or fails', async () => {
    const done = vi.fn();
    const steps = [
      beforeSignOut(() => {
        throw new Error('broken');
      }),
      beforeSignOut(() => Promise.reject(new Error('offline'))),
      beforeSignOut(() => Promise.resolve(done())),
    ];

    await runSignOutSteps(1000);

    expect(done).toHaveBeenCalledOnce();
    steps.forEach((remove) => {
      remove();
    });
  });

  it('waits no longer than it is allowed to for a step that hangs', async () => {
    vi.useFakeTimers();
    const remove = beforeSignOut(() => new Promise(() => undefined));

    const run = runSignOutSteps(500);
    await vi.advanceTimersByTimeAsync(500);
    await run;

    remove();
    vi.useRealTimers();
  });

  it("forgets one account's things, and a removed step no longer runs", async () => {
    const forgot = vi.fn<(owner: string) => undefined>();
    const remove = onForgetAccount(forgot);

    await forgetAccount('user-1', 1000);
    remove();
    await forgetAccount('user-2', 1000);

    expect(forgot.mock.calls).toEqual([['user-1']]);
  });

  it('forgets an account another tab forgot, tells the other tabs of its own, and echoes none', async () => {
    const forgot = vi.fn<(owner: string) => undefined>();
    const remove = onForgetAccount(forgot);
    const otherTab = new BroadcastChannel('tt-device');
    const heard: unknown[] = [];
    otherTab.addEventListener('message', (event: MessageEvent<unknown>) => {
      heard.push(event.data);
    });

    otherTab.postMessage({ forget: 'user-3' });
    otherTab.postMessage('not a forget');
    await vi.waitFor(() => {
      expect(forgot).toHaveBeenCalledWith('user-3');
    });
    await forgetAccount('user-4', 1000);
    await vi.waitFor(() => {
      expect(heard).toContainEqual({ forget: 'user-4' });
    });

    expect(heard).toEqual([{ forget: 'user-4' }]); // what it heard went no further
    expect(forgot.mock.calls).toEqual([['user-3'], ['user-4']]);
    otherTab.close();
    remove();
  });

  it('forgets in this tab alone where browsers can’t reach the others', async () => {
    vi.resetModules();
    vi.stubGlobal('BroadcastChannel', undefined);
    const cleanup = await import('@/core/auth/device-cleanup');
    const forgot = vi.fn<(owner: string) => undefined>();
    cleanup.onForgetAccount(forgot); // looks for the channel once, here
    vi.unstubAllGlobals();

    await cleanup.forgetAccount('user-5', 1000);

    expect(forgot).toHaveBeenCalledWith('user-5');
  });
});
