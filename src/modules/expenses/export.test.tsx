import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server } from '@/test/msw';
import { renderApp } from '@/test/render';

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
const CSV = '﻿date,title\r\n2026-10-08,Rice\r\n';
let asked: URLSearchParams[];
let saved: { name: string; file: Blob }[];

async function open(path: string) {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  return view;
}

beforeAll(async () => {
  await import('@/modules/expenses/entries-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  asked = [];
  saved = [];
  // The browser's download: the file handed to a link, and the name the link gives it.
  let file = new Blob();
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    file = blob as Blob;
    return 'blob:export';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push({ name: this.download, file });
  });
  server.use(
    ...fakeExpenses().handlers,
    http.get('*/api/v1/expenses/export.csv', ({ request }) => {
      const query = new URL(request.url).searchParams;
      asked.push(query);
      return new HttpResponse(CSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="expenses-${query.get('from') ?? 'all'}-to-${query.get('to') ?? 'now'}.csv"`,
        },
      });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('export', () => {
  it('downloads what the list shows, under the name the server gives it', async () => {
    const { user } = await open('/m/expenses?show=expense&category=c-pets');
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(
      await screen.findByText(
        'Downloaded expenses-2026-10-01-to-2026-10-08.csv: what the list shows.',
      ),
    ).toBeInTheDocument();
    expect(Object.fromEntries(asked[0] ?? [])).toEqual({
      from: '2026-10-01',
      to: '2026-10-08',
      kind: 'expense',
      category_id: 'c-pets',
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]?.name).toBe('expenses-2026-10-01-to-2026-10-08.csv');
    // The file as sent, byte-order mark and all (text() would drop the mark).
    const bytes = new Uint8Array((await saved[0]?.file.arrayBuffer()) ?? new ArrayBuffer(0));
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)).toBe(CSV);
  });

  it('says why when the file would be too long', async () => {
    server.use(
      http.get('*/api/v1/expenses/export.csv', () =>
        HttpResponse.json(errorEnvelope('EXPENSE_EXPORT_TOO_LARGE', 'Too long', { max: 50000 }), {
          status: 422,
        }),
      ),
    );
    const { user } = await open('/m/expenses?period=allTime');
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(
      await screen.findByText(
        "That's more entries than one file can take. Choose a shorter period.",
      ),
    ).toBeInTheDocument();
    expect(saved).toEqual([]);
  });
});
