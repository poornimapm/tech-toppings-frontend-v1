import { describe, expect, it } from 'vitest';

import { deviceStorage, indexedDbStorage, type OutboxItem } from '@/core/offline/outbox-storage';

const ITEM: OutboxItem = {
  id: 'one',
  kind: 'm.x',
  owner: 'asha',
  label: 'Tea',
  payload: {},
  queuedAt: '2026-10-08T06:00:00Z',
};

const later = (step: () => void) => setTimeout(step, 0);

interface FakeRequest {
  result?: unknown;
  error: DOMException | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onupgradeneeded?: (() => void) | null;
}

function answering(result: () => unknown): FakeRequest {
  const request: FakeRequest = { error: null, onsuccess: null, onerror: null };
  later(() => {
    request.result = result();
    request.onsuccess?.();
  });
  return request;
}

/**
 * Just enough of IndexedDB to see when a write counts: its request answers first, and the
 * transaction commits a moment later, or aborts (as a full disk does, after the request).
 */
function fakeIndexedDb({ failedOpens = 0, abortWrites = false } = {}) {
  const rows = new Map<string, OutboxItem>();
  const connections: { onclose: (() => void) | null }[] = [];
  const transaction = (_store: string, mode: IDBTransactionMode) => {
    const staged: (() => void)[] = [];
    const tx = {
      error: null as DOMException | null,
      oncomplete: null as (() => void) | null,
      onabort: null as (() => void) | null,
      onerror: null as (() => void) | null,
      objectStore: () => ({
        getAll: () => answering(() => [...rows.values()]),
        put: (item: OutboxItem) => {
          staged.push(() => rows.set(item.id, item));
          return answering(() => item.id);
        },
        delete: (id: string) => {
          staged.push(() => rows.delete(id));
          return answering(() => undefined);
        },
      }),
    };
    later(() => {
      later(() => {
        if (abortWrites && mode === 'readwrite') {
          tx.error = new DOMException('The disk is full', 'QuotaExceededError');
          tx.onabort?.();
          return;
        }
        staged.forEach((step) => {
          step();
        });
        tx.oncomplete?.();
      });
    });
    return tx;
  };
  let failing = failedOpens;
  const factory = {
    opens: 0,
    open: () => {
      factory.opens += 1;
      const request: FakeRequest = { error: null, onsuccess: null, onerror: null };
      later(() => {
        if (failing > 0) {
          failing -= 1;
          request.error = new DOMException('Internal error opening backing store', 'UnknownError');
          request.onerror?.();
          return;
        }
        const connection = { onclose: null, transaction, createObjectStore: () => undefined };
        connections.push(connection);
        request.result = connection;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
  return { factory, idb: factory as unknown as IDBFactory, rows, connections };
}

describe('the outbox in IndexedDB', () => {
  it('keeps an item once its write commits, and forgets it the same way', async () => {
    const { idb, rows } = fakeIndexedDb();
    const storage = indexedDbStorage(idb);

    await storage.put(ITEM);
    expect(rows.get('one')).toEqual(ITEM);
    expect(await storage.all()).toEqual([ITEM]);

    await storage.remove('one');
    expect(await storage.all()).toEqual([]);
  });

  it('does not report as kept a write the disk aborted', async () => {
    const { idb, rows } = fakeIndexedDb({ abortWrites: true });

    await expect(indexedDbStorage(idb).put(ITEM)).rejects.toThrow('The disk is full');
    expect(rows.size).toBe(0);
  });

  it('opens again after a failed open, or a connection the browser closed', async () => {
    const { factory, idb, connections } = fakeIndexedDb({ failedOpens: 1 });
    const storage = indexedDbStorage(idb);

    await expect(storage.all()).rejects.toThrow('backing store');
    expect(await storage.all()).toEqual([]);
    expect(factory.opens).toBe(2);

    connections[0]?.onclose?.();
    await storage.put(ITEM);
    expect(factory.opens).toBe(3);
  });
});

describe('the outbox on this device', () => {
  it('uses IndexedDB where it opens', async () => {
    const { idb, rows } = fakeIndexedDb();
    await deviceStorage(idb).put(ITEM);
    expect(rows.get('one')).toEqual(ITEM);
  });

  it('keeps items in memory where IndexedDB won’t open, or is missing', async () => {
    const { factory, idb } = fakeIndexedDb({ failedOpens: Infinity });
    for (const storage of [deviceStorage(idb), deviceStorage(undefined)]) {
      await storage.put(ITEM);
      expect(await storage.all()).toEqual([ITEM]);
      await storage.remove('one');
      expect(await storage.all()).toEqual([]);
    }
    expect(factory.opens).toBe(1); // chosen once: what waits stays in one place
  });
});
