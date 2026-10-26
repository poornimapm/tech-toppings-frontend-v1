import { http, HttpResponse } from 'msw/http';
import { describe, expect, it, vi } from 'vitest';

import { forgetAccount } from '@/core/auth/device-cleanup';
import { isForgotten } from '@/core/offline/outbox';
import type { OutboxItem } from '@/core/offline/outbox-storage';
import { sendCapture } from '@/modules/expenses/outbox';
import type { CaptureLater } from '@/modules/expenses/outbox-kinds';
import { server, testRun } from '@/test/msw';

const SAID: CaptureLater = {
  input: 'tea 15, lent ravi 200',
  inputType: 'text',
  locale: 'en',
  day: '2026-10-07',
};
const ITEM: OutboxItem = {
  id: '5c6f0d7e-8f0a-4b8e-9d55-0d1f6b8b8b8b',
  kind: 'expenses.capture',
  owner: 'asha',
  label: SAID.input,
  payload: SAID,
  queuedAt: '2026-10-07T10:00:00Z',
};

/** The owner's drafts as this device keeps them. */
const kept = (list: string): unknown =>
  (JSON.parse(localStorage.getItem(`tt-kept-${list}`) ?? '{}') as Record<string, unknown>)[
    ITEM.owner
  ];

/** Every list this device keeps (`tt-kept-*`), by account. */
const keptLists = (): Record<string, unknown>[] =>
  Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index) ?? '')
    .filter((key) => key.startsWith('tt-kept-'))
    .map((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>);

/** The assistant finds nothing in the words. */
function readsNothing() {
  server.use(
    http.post('*/api/v1/agents/:name/runs', () =>
      HttpResponse.json(testRun({ proposals: [], client_actions: [] }), { status: 201 }),
    ),
  );
}

describe('words said offline, read once back online', () => {
  it('give the same drafts however often they are read: never added twice', async () => {
    let runs = 0;
    server.use(
      http.post('*/api/v1/agents/:name/runs', () => {
        runs += 1;
        return HttpResponse.json(
          testRun({
            skill: 'track-expenses',
            proposals: [],
            client_actions: [
              { tool: 'expenses_draft', arguments: { drafts: [{ title: 'Tea', amount: 15 }] } },
              {
                tool: 'expenses_iou_draft',
                arguments: { drafts: [{ direction: 'lent', counterparty: 'Ravi', amount: 200 }] },
              },
            ],
          }),
          { status: 201 },
        );
      }),
    );

    await sendCapture(ITEM);
    await sendCapture(ITEM); // e.g. sent again after its reply was lost

    expect(runs).toBe(2);
    expect(kept('expenses-drafts')).toMatchObject([{ key: `${ITEM.id}.e0`, title: 'Tea' }]);
    expect(kept('expenses-loan-drafts')).toMatchObject([
      { key: `${ITEM.id}.l0`, counterparty: 'Ravi' },
    ]);
  });

  it('keep the words themselves as a draft when nothing could be read from them', async () => {
    readsNothing();

    await sendCapture(ITEM);
    await sendCapture(ITEM);

    expect(kept('expenses-drafts')).toMatchObject([{ key: ITEM.id, title: SAID.input }]);
  });

  it('stay waiting when their drafts could not be stored: a reload would lose them', async () => {
    readsNothing();
    const full = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    await expect(sendCapture(ITEM)).rejects.toThrow(); // the outbox keeps it, to try again
    full.mockRestore();
    expect(kept('expenses-drafts')).toBeUndefined();

    await sendCapture(ITEM); // tried again with room to store them
    expect(kept('expenses-drafts')).toMatchObject([{ key: ITEM.id, title: SAID.input }]);
  });

  it('keep nothing for an account deleted while they were read', async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', async () => {
        await forgetAccount(ITEM.owner, 1000); // deleted here while the assistant reads
        return HttpResponse.json(testRun({ proposals: [], client_actions: [] }), { status: 201 });
      }),
    );

    await sendCapture(ITEM);

    expect(kept('expenses-drafts')).toBeUndefined();
  });

  it('keep nothing for an account another tab deleted while they were read here', async () => {
    const otherTab = new BroadcastChannel('tt-device');
    server.use(
      http.post('*/api/v1/agents/:name/runs', async () => {
        otherTab.postMessage({ forget: ITEM.owner }); // deleted there while the assistant reads
        await vi.waitFor(() => {
          expect(isForgotten(ITEM.owner)).toBe(true); // this tab heard of it
        });
        return HttpResponse.json(testRun({ proposals: [], client_actions: [] }), { status: 201 });
      }),
    );

    await sendCapture(ITEM);

    expect(keptLists().filter((list) => ITEM.owner in list)).toEqual([]);
    otherTab.close();
  });
});
