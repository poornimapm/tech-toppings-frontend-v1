import { afterEach, describe, expect, it, vi } from 'vitest';

import { forgetKeptLists, keptLists } from '@/core/offline/kept-lists';

interface Note {
  key: string;
}

const lists = keptLists<Note>('test-notes');
const add = (owner: string, key: string) => {
  lists.update(owner, (items) => [...items, { key }]);
};
const stored = (key = 'tt-kept-test-notes'): unknown =>
  JSON.parse(localStorage.getItem(key) ?? '{}');

/** What another tab or window does: it writes the latest value, and this tab is told so. */
function otherTabStores(value: unknown, key = 'tt-kept-test-notes') {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent('storage', { key }));
}

afterEach(() => {
  vi.restoreAllMocks();
  lists.clear();
});

describe('lists kept on this device', () => {
  it('keeps each account’s list in localStorage', () => {
    add('asha', 'a');
    add('bob', 'b');
    expect(stored()).toEqual({ asha: [{ key: 'a' }], bob: [{ key: 'b' }] });
    expect(lists.useLists.getState().asha).toEqual([{ key: 'a' }]);
  });

  it('changes the latest stored value, so another tab’s additions are never written over', () => {
    add('asha', 'mine');
    localStorage.setItem('tt-kept-test-notes', JSON.stringify({ asha: [{ key: 'theirs' }] }));

    add('asha', 'mine too'); // this tab never saw "theirs"

    expect(stored()).toEqual({ asha: [{ key: 'theirs' }, { key: 'mine too' }] });
  });

  it('shows what another tab changed', () => {
    add('asha', 'old');
    otherTabStores({ asha: [{ key: 'old' }, { key: 'new' }] });
    expect(lists.useLists.getState().asha).toEqual([{ key: 'old' }, { key: 'new' }]);

    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null })); // everything cleared
    expect(lists.useLists.getState()).toEqual({});
  });

  it('works in this page alone where storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    add('asha', 'a');
    add('asha', 'b');
    expect(lists.useLists.getState().asha).toEqual([{ key: 'a' }, { key: 'b' }]);
  });

  it('keeps every change in this page while storage is full, and says so', () => {
    add('asha', 'stored');
    const full = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(lists.update('asha', (items) => [...items, { key: 'a' }])).toBe(false);
    add('asha', 'b'); // not made from the stored value, which never had "a"
    window.dispatchEvent(new StorageEvent('storage', { key: 'tt-kept-test-notes' }));
    const shown = [{ key: 'stored' }, { key: 'a' }, { key: 'b' }];
    expect(lists.useLists.getState().asha).toEqual(shown);
    expect(stored()).toEqual({ asha: [{ key: 'stored' }] });

    full.mockRestore(); // room again: the next change stores all of it
    expect(lists.update('asha', (items) => [...items, { key: 'c' }])).toBe(true);
    expect(stored()).toEqual({ asha: [...shown, { key: 'c' }] });
  });

  it('makes its unstored changes again over what another tab stored meanwhile', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(lists.update('asha', (items) => [...items, { key: 'mine' }])).toBe(false);

    otherTabStores({ asha: [{ key: 'theirs' }] }); // room there: it stored its own change
    expect(lists.useLists.getState().asha).toEqual([{ key: 'theirs' }, { key: 'mine' }]);

    expect(lists.update('asha', (items) => [...items, { key: 'later' }])).toBe(true);
    expect(stored()).toEqual({ asha: [{ key: 'theirs' }, { key: 'mine' }, { key: 'later' }] });
  });

  it('forgets an account held in this page only', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    add('asha', 'a');
    add('bob', 'b');

    forgetKeptLists('asha');

    expect(lists.useLists.getState()).toEqual({ bob: [{ key: 'b' }] });
  });

  it('forgets an account’s lists, including those of a feature not loaded here', () => {
    add('asha', 'a');
    add('bob', 'b');
    localStorage.setItem('tt-kept-elsewhere', JSON.stringify({ asha: [{ key: 'x' }] }));
    localStorage.setItem('tt-other', JSON.stringify({ asha: 'not a kept list' }));

    forgetKeptLists('asha');

    expect(lists.useLists.getState()).toEqual({ bob: [{ key: 'b' }] });
    expect(stored()).toEqual({ bob: [{ key: 'b' }] });
    expect(stored('tt-kept-elsewhere')).toEqual({});
    expect(stored('tt-other')).toEqual({ asha: 'not a kept list' });
  });
});
