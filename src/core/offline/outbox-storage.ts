/** Something done offline, waiting on this device to be sent (ADR-0010). */
export interface OutboxItem {
  /** Also the Idempotency-Key it is sent with: sent twice, it is still saved once. */
  id: string;
  /** Which module's sender takes it, e.g. `expenses.entry`. */
  kind: string;
  /** The account that made it: it is sent only while that account is signed in. */
  owner: string;
  /** What the user knows it by while it waits (an entry's title, the words said). */
  label: string;
  payload: unknown;
  queuedAt: string;
  /** The error code the server refused it with: kept for the user to see, then send again or
   *  discard. */
  failure?: string;
}

export interface OutboxStorage {
  all: () => Promise<OutboxItem[]>;
  put: (item: OutboxItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const DB = 'tt-offline';
const STORE = 'outbox';

function answer<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'));
    };
  });
}

/** A write is kept only once its transaction commits: a full disk aborts it after the request
 *  itself succeeded. */
function committed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB write failed'));
    };
  });
}

function open(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB could not be opened'));
    };
  });
}

/** The outbox in IndexedDB: it survives closing the app, and holds more than localStorage. */
export function indexedDbStorage(factory: IDBFactory): OutboxStorage {
  // Opened on first use; opened again after a failure, or once the browser closed the
  // connection (Safari does, in the background).
  let opened: Promise<IDBDatabase> | null = null;
  const forget = () => {
    opened = null;
  };
  const database = () =>
    (opened ??= open(factory).then(
      (db) => {
        db.onclose = forget;
        return db;
      },
      (error: unknown) => {
        forget();
        throw error;
      },
    ));
  const write = async (change: (store: IDBObjectStore) => unknown) => {
    const transaction = (await database()).transaction(STORE, 'readwrite');
    const done = committed(transaction);
    change(transaction.objectStore(STORE));
    await done;
  };
  return {
    all: async () =>
      answer(
        (await database()).transaction(STORE, 'readonly').objectStore(STORE).getAll() as IDBRequest<
          OutboxItem[]
        >,
      ),
    put: (item) => write((store) => store.put(item)),
    remove: (id) => write((store) => store.delete(id)),
  };
}

/** Where IndexedDB is missing or won't open: kept only while the page is open. */
export function memoryStorage(): OutboxStorage {
  const items = new Map<string, OutboxItem>();
  return {
    all: () => Promise.resolve([...items.values()]),
    put: (item) => {
      items.set(item.id, item);
      return Promise.resolve();
    },
    remove: (id) => {
      items.delete(id);
      return Promise.resolve();
    },
  };
}

/**
 * This device's outbox: IndexedDB where it opens, else memory (IndexedDB missing, or refused by
 * some private modes and damaged profiles). Chosen once per page, on first use: switching later
 * would leave what waits in the other one, unseen.
 */
export function deviceStorage(
  factory: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB,
): OutboxStorage {
  let chosen: Promise<OutboxStorage> | null = null;
  const choose = async (): Promise<OutboxStorage> => {
    if (!factory) return memoryStorage();
    const disk = indexedDbStorage(factory);
    return disk.all().then(
      () => disk,
      () => memoryStorage(),
    );
  };
  const storage = () => (chosen ??= choose());
  return {
    all: async () => (await storage()).all(),
    put: async (item) => (await storage()).put(item),
    remove: async (id) => (await storage()).remove(id),
  };
}
