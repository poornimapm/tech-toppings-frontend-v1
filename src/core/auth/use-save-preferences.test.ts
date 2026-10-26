import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { useSession, type AuthUser } from '@/core/auth/session-store';
import { useSavePreferences } from '@/core/auth/use-save-preferences';
import { useToasts } from '@/design-system';
import { testUser, tokenFor } from '@/test/msw';

interface Reply {
  answer: (user: Partial<AuthUser>) => void;
  fail: () => void;
}
const held: Reply[] = [];

/** PATCH /v1/me answers only when the test says so, in whatever order it likes. */
function holdReplies() {
  vi.spyOn(api, 'PATCH').mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        held.push({
          answer: (user) => {
            resolve({ data: { ...testUser, ...user }, response: new Response('{}') });
          },
          fail: () => {
            reject(new TypeError('Failed to fetch'));
          },
        });
      }) as never,
  );
  return held;
}

/** Let every reply already answered run its course. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
const uiMode = () => useSession.getState().user?.ui_mode;
const toastMessages = () => useToasts.getState().toasts.map((toast) => toast.message);
const NOT_SAVED = "Couldn't save the Simple mode change. Check your connection and try again.";

function savePreferences() {
  return renderHook(() => useSavePreferences()).result.current;
}

beforeEach(() => {
  useSession.getState().setSession(tokenFor({ ui_mode: 'standard' }));
});

afterEach(async () => {
  // Answer what a test left waiting, so the next one starts with no save on its way.
  for (const reply of held.splice(0)) reply.fail();
  await settled();
});

describe('saving preferences', () => {
  it('shows Simple mode at once and undoes it, with a note, when the save fails', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    expect(uiMode()).toBe('simple');
    replies[0]?.fail();
    await settled();

    expect(uiMode()).toBe('standard');
    expect(toastMessages()).toEqual([NOT_SAVED]);
  });

  it.each([
    ['in order', [0, 1]],
    ['out of order', [1, 0]],
  ])('goes back to the saved setting when quick changes all fail (%s)', async (_case, order) => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ ui_mode: 'standard' }); // turned straight off again
    for (const index of order) replies[index]?.fail();
    await settled();

    expect(uiMode()).toBe('standard'); // what the account has, not the first change
    expect(toastMessages()).toEqual([NOT_SAVED]);
  });

  it('goes back to what an earlier save confirmed when a later one fails', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ ui_mode: 'standard' });
    replies[0]?.answer({ ui_mode: 'simple' });
    await settled();
    replies[1]?.fail();
    await settled();

    expect(uiMode()).toBe('simple');
  });

  it('shows what an earlier save confirmed when it answers after a later one failed', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ ui_mode: 'standard' });
    replies[1]?.fail();
    await settled();
    expect(uiMode()).toBe('standard'); // what the account had, as far as anyone knew
    replies[0]?.answer({ ui_mode: 'simple' });
    await settled();

    expect(uiMode()).toBe('simple'); // what the account has now
    expect(toastMessages()).toEqual([NOT_SAVED]);
  });

  it('keeps the latest choice when replies arrive out of order', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ ui_mode: 'standard' });
    replies[1]?.answer({ ui_mode: 'standard' });
    await settled();
    replies[0]?.answer({ ui_mode: 'simple' }); // the older reply, last
    await settled();

    expect(uiMode()).toBe('standard');
  });

  it('leaves a newer choice alone when an older save fails', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ ui_mode: 'standard' });
    save({ ui_mode: 'simple' });
    replies[0]?.fail();
    await settled();

    expect(uiMode()).toBe('simple');
    expect(useToasts.getState().toasts).toEqual([]);
  });

  it('keeps a Simple mode change on its way when a later save answers first', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ ui_mode: 'simple' });
    save({ theme: 'dark' });
    replies[1]?.answer({ theme: 'dark' }); // made before the server had the Simple mode change
    await settled();

    expect(useSession.getState().user).toMatchObject({ theme: 'dark', ui_mode: 'simple' });

    replies[0]?.fail();
    await settled();
    expect(uiMode()).toBe('standard');
  });

  it('applies the account as saved', async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ theme: 'dark' });
    replies[0]?.answer({ theme: 'dark' });
    await settled();

    expect(useSession.getState().user?.theme).toBe('dark');
  });

  it("ignores a reply for an account that isn't signed in any more", async () => {
    const replies = holdReplies();
    const save = savePreferences();

    save({ theme: 'dark' });
    useSession.getState().setSession(tokenFor({ id: 'user-2', name: 'Ravi' }));
    replies[0]?.answer({ theme: 'dark' });
    await settled();

    expect(useSession.getState().user).toMatchObject({ id: 'user-2', theme: 'system' });
  });
});
