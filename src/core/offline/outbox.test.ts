import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, networkError } from '@/core/api/api-error';
import { forgetAccount } from '@/core/auth/device-cleanup';
import { useSession } from '@/core/auth/session-store';
import { keptLists } from '@/core/offline/kept-lists';
import {
  discard,
  enqueue,
  flush,
  isForgotten,
  isOffline,
  retry,
  setOutboxStorage,
  useOutbox,
  type OutboxSender,
} from '@/core/offline/outbox';
import { memoryStorage, type OutboxItem } from '@/core/offline/outbox-storage';
import { testUser } from '@/test/msw';

const refused = (code: string, status = 422) => new ApiError(status, code, 'no');

/** A sender that answers each call from a script of outcomes (undefined = sent). */
function scripted(...outcomes: (Error | undefined)[]) {
  const sent: string[] = [];
  const send = vi.fn<OutboxSender>((item: OutboxItem) => {
    const outcome = outcomes.shift();
    if (outcome) return Promise.reject(outcome);
    sent.push(item.id);
    return Promise.resolve();
  });
  return {
    send,
    sent,
    lookup: (kind: string) => Promise.resolve(kind === 'm.x' ? send : undefined),
  };
}

async function queue(id: string, owner = 'asha', kind = 'm.x') {
  await enqueue({ id, kind, owner, label: id, payload: { id } });
  await new Promise((resolve) => setTimeout(resolve, 2)); // distinct queued-at times
}

const ids = () => useOutbox.getState().items.map((item) => item.id);

beforeEach(() => {
  setOutboxStorage(memoryStorage());
  useSession.setState({ status: 'authenticated', user: { ...testUser, id: 'asha' } });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'locks');
});

describe('the outbox', () => {
  it('sends what waits, oldest first, and forgets what went', async () => {
    await queue('first');
    await queue('second');
    const { sent, lookup } = scripted();

    expect(await flush('asha', lookup)).toBe(2);
    expect(sent).toEqual(['first', 'second']);
    expect(useOutbox.getState().items).toEqual([]);
  });

  it('never sends, nor puts back, one discarded while a flush is under way', async () => {
    await queue('first');
    await queue('overtaken');
    await queue('refused');
    await queue('discarded');
    const sent: string[] = [];
    const send = vi.fn<OutboxSender>(async (item) => {
      if (item.id === 'first') await Promise.all([discard('overtaken'), discard('discarded')]);
      if (item.id === 'refused') {
        await discard('refused'); // gone while its answer was on the way
        throw refused('LABOR_MARK_CHANGED', 409);
      }
      sent.push(item.id);
    });

    await flush('asha', (kind) => Promise.resolve(kind === 'm.x' ? send : undefined));

    expect(sent).toEqual(['first']);
    expect(ids()).toEqual([]); // not put back as refused
  });

  it('stops at the first the network can’t take, keeping the rest in order', async () => {
    await queue('first');
    await queue('second');
    const { send, sent, lookup } = scripted(networkError(new TypeError('offline')));

    expect(await flush('asha', lookup)).toBe(0);
    expect(send).toHaveBeenCalledOnce();
    expect(ids()).toEqual(['first', 'second']);

    expect(await flush('asha', lookup)).toBe(2); // back online
    expect(sent).toEqual(['first', 'second']);
  });

  it.each([
    [503, 'SERVICE_NOT_READY'],
    [500, 'INTERNAL_ERROR'],
    [429, 'RATE_LIMITED'],
    [408, 'HTTP_408'],
    [401, 'AUTH_TOKEN_EXPIRED'],
    [403, 'AUTH_PASSWORD_CHANGE_REQUIRED'],
    [403, 'AUTH_ACCOUNT_DISABLED'],
    [403, 'AUTH_CSRF_FAILED'],
  ])('waits out a %i %s: about the moment or the account, not the item', async (status, code) => {
    await queue('first');
    await queue('second');
    const { send, lookup } = scripted(refused(code, status));

    expect(await flush('asha', lookup)).toBe(0);
    expect(send).toHaveBeenCalledOnce(); // the rest wait too
    expect(useOutbox.getState().items.map((item) => item.failure)).toEqual([undefined, undefined]);
  });

  it('keeps what the server refused, marked, and goes on with the rest', async () => {
    await queue('bad');
    await queue('good');
    const { sent, lookup } = scripted(refused('VALIDATION_ERROR'));

    expect(await flush('asha', lookup)).toBe(1);
    expect(sent).toEqual(['good']);
    const [kept] = useOutbox.getState().items;
    expect(kept).toMatchObject({ id: 'bad', failure: 'VALIDATION_ERROR' });

    expect(await flush('asha', lookup)).toBe(0); // not tried again: it waits for the user
    await discard('bad');
    expect(useOutbox.getState().items).toEqual([]);
  });

  it.each(['MODULE_DISABLED', 'FORBIDDEN'])(
    'keeps what a 403 %s refused, marked, and goes on: the user may have turned it off',
    async (code) => {
      await queue('off');
      await queue('other');
      const { sent, lookup } = scripted(refused(code, 403));

      expect(await flush('asha', lookup)).toBe(1);
      expect(sent).toEqual(['other']);
      expect(useOutbox.getState().items).toMatchObject([{ id: 'off', failure: code }]);
    },
  );

  it('marks what a sender fails on by itself, instead of trying it forever', async () => {
    await queue('broken');
    await queue('fine');
    const { sent, lookup } = scripted(new DOMException('full', 'QuotaExceededError'));

    expect(await flush('asha', lookup)).toBe(1);
    expect(sent).toEqual(['fine']);
    expect(useOutbox.getState().items).toMatchObject([{ id: 'broken', failure: 'UNKNOWN' }]);
  });

  it('sends a refused item again when asked to', async () => {
    await queue('bad');
    const { sent, lookup } = scripted(refused('EXPENSE_CATEGORY_INVALID'));
    await flush('asha', lookup);

    await retry('bad');
    expect(useOutbox.getState().items[0]?.failure).toBeUndefined();
    expect(await flush('asha', lookup)).toBe(1);
    expect(sent).toEqual(['bad']);
  });

  it('sends only the signed-in account’s, and keeps kinds it doesn’t know', async () => {
    await queue('mine');
    await queue('theirs', 'bob');
    await queue('unknown', 'asha', 'gone.module');
    const { sent, lookup } = scripted();

    expect(await flush('asha', lookup)).toBe(1);
    expect(sent).toEqual(['mine']);
    expect(ids().sort()).toEqual(['theirs', 'unknown']);
  });

  it('stops before the next send once its account is no longer signed in', async () => {
    await queue('first');
    await queue('second');
    const { send, lookup } = scripted();
    send.mockImplementationOnce(() => {
      useSession.setState({ user: { ...testUser, id: 'bob' } }); // signed out, bob signed in
      return Promise.resolve();
    });

    expect(await flush('asha', lookup)).toBe(1);
    expect(send).toHaveBeenCalledOnce();
    expect(ids()).toEqual(['second']);
  });

  it('stops before the next send once its caller cancels', async () => {
    await queue('first');
    await queue('second');
    const stop = new AbortController();
    const { send, lookup } = scripted();
    send.mockImplementationOnce(() => {
      stop.abort();
      return Promise.resolve();
    });

    expect(await flush('asha', lookup, stop.signal)).toBe(1);
    expect(ids()).toEqual(['second']);
  });

  it('runs one flush at a time', async () => {
    await queue('only');
    const { send, lookup } = scripted();
    const [one, two] = await Promise.all([flush('asha', lookup), flush('asha', lookup)]);
    expect([one, two]).toEqual([1, 0]); // the second waited for the first: told once
    expect(send).toHaveBeenCalledOnce();
  });

  it('leaves sending to another tab that is at it already', async () => {
    await queue('only');
    let held = true;
    const request = vi.fn(
      (_name: string, _options: LockOptions, task: (lock: Lock | null) => unknown) =>
        Promise.resolve(task(held ? null : { name: 'tt-outbox-flush', mode: 'exclusive' })),
    );
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    const { send, lookup } = scripted();

    expect(await flush('asha', lookup)).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith(
      'tt-outbox-flush',
      { ifAvailable: true },
      expect.any(Function),
    );

    held = false;
    expect(await flush('asha', lookup)).toBe(1);
  });

  it('drops what a deleted account left waiting, and its kept lists', async () => {
    const lists = keptLists<{ key: string }>('outbox-test');
    lists.update('asha', () => [{ key: 'a' }]);
    lists.update('bob', () => [{ key: 'b' }]);
    await queue('mine');
    await queue('theirs', 'bob');

    await forgetAccount('asha', 1000);

    expect(ids()).toEqual(['theirs']);
    expect(lists.useLists.getState()).toEqual({ bob: [{ key: 'b' }] });
  });

  it('lets a send under way finish before forgetting, and sends no more of a deleted account’s', async () => {
    await queue('first');
    await queue('second');
    const { send, lookup } = scripted();
    let reply: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      reply = resolve;
    });
    send.mockImplementationOnce(() => answered);
    const flushed = flush('asha', lookup);
    await vi.waitFor(() => {
      expect(send).toHaveBeenCalledOnce();
    });

    const forgetting = forgetAccount('asha', 5000);
    await vi.waitFor(() => {
      expect(isForgotten('asha')).toBe(true); // what the send would keep now is dropped
    });
    expect(ids()).toEqual(['first', 'second']); // forgotten only once the send is done
    reply();

    expect(await flushed).toBe(1);
    await forgetting;
    expect(send).toHaveBeenCalledOnce(); // "second" was never sent
    expect(ids()).toEqual([]);
  });

  it('drops what a send under way here kept late for an account another tab deleted', async () => {
    const lists = keptLists<{ key: string }>('outbox-late');
    await queue('first');
    await queue('second');
    const { send, lookup } = scripted();
    let reply: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      reply = resolve;
    });
    send.mockImplementationOnce(async () => {
      await answered;
      lists.update('asha', () => [{ key: 'late' }]); // kept after the other tab dropped its lists
    });
    const flushed = flush('asha', lookup); // this tab holds the flush
    await vi.waitFor(() => {
      expect(send).toHaveBeenCalledOnce();
    });

    const otherTab = new BroadcastChannel('tt-device');
    otherTab.postMessage({ forget: 'asha' }); // the account deleted in another tab
    await vi.waitFor(() => {
      expect(isForgotten('asha')).toBe(true);
    });
    reply();

    expect(await flushed).toBe(1);
    await vi.waitFor(() => {
      expect(ids()).toEqual([]); // "second" was never sent, and is dropped here too
    });
    expect(lists.useLists.getState()).toEqual({});
    expect(localStorage.getItem('tt-kept-outbox-late')).toBe('{}');
    expect(send).toHaveBeenCalledOnce();
    otherTab.close();
  });

  it('tells a lost connection from a refusal', () => {
    expect(isOffline(networkError(new TypeError('x')))).toBe(true);
    expect(isOffline(refused('X'))).toBe(false);
    expect(isOffline(new Error('x'))).toBe(false);
  });
});
