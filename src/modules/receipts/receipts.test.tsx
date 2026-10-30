import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MODULE_ACTION, type RunInput } from '@/core/agents/queries';
import { readOnDevice } from '@/core/scan/photo-reader';
import type { Receipt, ReceiptInput } from '@/modules/receipts/api';
import {
  errorEnvelope,
  moduleView,
  resetModuleState,
  server,
  testModules,
  testRun,
} from '@/test/msw';
import { renderApp } from '@/test/render';

// The camera and the on-device reader need a real browser: their seam is faked here (the
// shared scan has its own tests, through Expenses' receipts).
vi.mock('@/core/scan/photo-reader', () => ({
  PHOTO_TYPE: 'image/jpeg',
  shrink: vi.fn(),
  readOnDevice: vi.fn(),
  ReaderUnavailableError: class ReaderUnavailableError extends Error {},
}));

const NOW = new Date('2026-10-30T06:00:00Z');
const TODAY = '2026-10-30';
const AT = '2026-10-08T10:00:00Z';
const PAGE_SIZE = 20;
const OPTIONS = {
  remind_days_before: 30,
  max_remind_days: 365,
  max_months: 120,
  quick_months: [6, 12, 24, 36, 60],
};
const BILL_TEXT = 'VIJAY SALES\nSamsung 253L Refrigerator 28,490.00\nGrand Total 30,140.00';
const BILL = {
  text: 'Samsung 253L Refrigerator',
  shop: 'Vijay Sales',
  bought_on: '2026-03-14',
  amount: 30140,
  bill_number: 'VS/26/04217',
  serial_number: 'RT28-0042',
  warranty_months: 12,
  uncertain: ['text'],
};

let receipts: Receipt[];
let sent: ReceiptInput[];
let asked: RunInput[];
let made: number;

function receipt(changes: Partial<Receipt>): Receipt {
  made += 1;
  return {
    id: `receipt-${String(made)}`,
    text: 'Fridge',
    shop: null,
    bought_on: '2026-10-01',
    amount_minor: null,
    currency: 'INR',
    bill_number: null,
    serial_number: null,
    warranty_ends_on: null,
    remind_days_before: 30,
    warranty: 'none',
    note: null,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

/** The module's routes, against a list kept here; the warranty filter as the server's. */
function fakeApi() {
  server.use(
    http.get('*/api/v1/receipts/options', () => HttpResponse.json(OPTIONS)),
    http.get('*/api/v1/receipts/items', ({ request }) => {
      const query = new URL(request.url).searchParams;
      const page = Number(query.get('page') ?? '1');
      const warranty = query.get('warranty');
      const words = query.get('q')?.toLowerCase();
      const shown = receipts.filter(
        (one) =>
          (!warranty || one.warranty === warranty) &&
          (!words || one.text.toLowerCase().includes(words)),
      );
      const start = (page - 1) * PAGE_SIZE;
      return HttpResponse.json({
        items: shown.slice(start, start + PAGE_SIZE),
        page,
        page_size: PAGE_SIZE,
        total: shown.length,
        has_next: start + PAGE_SIZE < shown.length,
      });
    }),
    http.get('*/api/v1/receipts/items/:id', ({ params }) => {
      const found = receipts.find((one) => one.id === params.id);
      return found
        ? HttpResponse.json(found)
        : HttpResponse.json(errorEnvelope('NOT_FOUND', 'no such receipt'), { status: 404 });
    }),
    http.post('*/api/v1/receipts/items', async ({ request }) => {
      const body = (await request.json()) as ReceiptInput;
      sent.push(body);
      const added = receipt({
        ...body,
        bought_on: body.bought_on ?? TODAY,
        remind_days_before: body.remind_days_before ?? 30,
        warranty: body.warranty_ends_on ? 'active' : 'none',
      });
      receipts = [added, ...receipts];
      return HttpResponse.json(added, { status: 201 });
    }),
    http.patch('*/api/v1/receipts/items/:id', async ({ params, request }) => {
      const body = (await request.json()) as ReceiptInput;
      sent.push(body);
      receipts = receipts.map((one) =>
        one.id === params.id ? ({ ...one, ...body } as Receipt) : one,
      );
      return HttpResponse.json(receipts.find((one) => one.id === params.id));
    }),
    http.delete('*/api/v1/receipts/items/:id', ({ params }) => {
      receipts = receipts.filter((one) => one.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
      asked.push((await request.json()) as RunInput);
      return HttpResponse.json(
        testRun({
          skill: 'scan-bill',
          proposals: [],
          client_actions: [{ tool: 'receipts_draft', arguments: { draft: BILL } }],
          message_code: 'scan-bill.ready',
          message_params: { total: 30140 },
        }),
        { status: 201 },
      );
    }),
  );
}

beforeAll(async () => {
  await import('@/modules/receipts/receipts-page');
  await import('@/modules/receipts/receipt-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  receipts = [];
  sent = [];
  asked = [];
  made = 0;
  fakeApi();
  resetModuleState([
    ...testModules.filter((view) => view.key !== 'receipts'),
    moduleView('receipts', testModules.length, { status: 'beta', available: true }),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the receipts list', () => {
  it('shows where each warranty stands, in words, and filters by it', async () => {
    receipts = [
      receipt({ text: 'Fridge', warranty: 'active', warranty_ends_on: '2027-10-01' }),
      receipt({ text: 'Phone', warranty: 'ending', warranty_ends_on: '2026-11-09' }),
      receipt({ text: 'Fan', warranty: 'ended', warranty_ends_on: '2026-01-01' }),
      receipt({ text: 'Kettle', shop: 'Croma', amount_minor: 149_500 }),
    ];
    const { user } = renderApp('/m/receipts');
    const list = await screen.findByRole('list', { name: 'Receipts & warranty' });

    expect(within(list).getByText('Warranty till Oct 1, 2027')).toBeInTheDocument();
    expect(within(list).getByText('Warranty ends Nov 9, 2026: 10 days left')).toBeInTheDocument();
    expect(within(list).getByText('Warranty ended Jan 1, 2026')).toBeInTheDocument();
    expect(within(list).getByText('Croma · Oct 1, 2026 · ₹1,495')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ending soon' }));
    expect(await screen.findByRole('link', { name: /Phone/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Fridge/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.type(screen.getByRole('searchbox', { name: 'Find a receipt' }), 'kett');
    expect(await screen.findByRole('link', { name: /Kettle/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Phone/ })).not.toBeInTheDocument();
  });

  it('says when there are none yet, and has no detectable accessibility violations', async () => {
    const { container } = renderApp('/m/receipts');

    expect(await screen.findByText(/No receipts yet/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('a receipt', () => {
  it('is kept with a warranty of one tap, its end worked out from the day bought', async () => {
    const { user } = renderApp('/m/receipts/new');

    await user.type(await screen.findByRole('textbox', { name: /What you bought/ }), 'Mixer');
    fireEvent.change(screen.getByLabelText(/Date bought/), { target: { value: '2026-01-31' } });
    await user.type(screen.getByRole('textbox', { name: /Amount paid/ }), '3499.50');
    await user.click(screen.getByRole('radio', { name: '1 year' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText("Kept “Mixer”. You'll be reminded before its warranty ends.", {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(sent).toEqual([
      {
        text: 'Mixer',
        shop: null,
        bought_on: '2026-01-31',
        amount_minor: 349_950,
        warranty_ends_on: '2027-01-31',
        remind_days_before: 30,
        bill_number: null,
        serial_number: null,
        note: null,
      },
    ]);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Receipts & warranty' }),
    ).toBeInTheDocument();
  });

  it('asks for what was bought, and a day no later than today', async () => {
    const { user } = renderApp('/m/receipts/new');

    fireEvent.change(await screen.findByLabelText(/Date bought/), {
      target: { value: '2026-11-02' },
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Say what you bought.')).toBeInTheDocument();
    expect(screen.getByText('Choose a day up to today.')).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('is filled in from a bill read on this device, asking to check what was read with doubt', async () => {
    vi.mocked(readOnDevice).mockResolvedValue(BILL_TEXT);
    const { user } = renderApp('/m/receipts/new');
    await screen.findByText(/The photo is read on this device/);

    fireEvent.change(screen.getByLabelText('Bill photo'), {
      target: { files: [new File(['RAW'], 'bill.jpg', { type: 'image/jpeg' })] },
    });

    expect(
      await screen.findByText('Filled in from the bill. Check each field, then save.'),
    ).toBeInTheDocument();
    expect(asked).toEqual([
      expect.objectContaining({
        input: BILL_TEXT,
        skill: 'scan-bill',
        context: { input_type: 'ocr' },
      }),
    ]);
    const name = screen.getByRole('textbox', { name: /What you bought/ });
    expect(name).toHaveValue('Samsung 253L Refrigerator');
    expect(name).toHaveAccessibleDescription('Read from the bill: check it.');
    expect(screen.getByRole('radio', { name: '1 year' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Bill number' })).toHaveValue('VS/26/04217');

    await user.clear(name);
    await user.type(name, 'Samsung fridge');
    expect(name).not.toHaveAccessibleDescription('Read from the bill: check it.');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Kept “Samsung fridge”/)).toBeInTheDocument();
    expect(sent[0]).toMatchObject({
      bought_on: '2026-03-14',
      warranty_ends_on: '2027-03-14',
      amount_minor: 3_014_000,
    });
  });

  it('opens filled in with a bill the assistant read, taken once', async () => {
    const { router } = renderApp('/m/receipts');
    await screen.findByRole('heading', { level: 1, name: 'Receipts & warranty' });

    await act(() =>
      router.navigate('/m/receipts/new', {
        state: {
          [MODULE_ACTION]: {
            tool: 'receipts_draft',
            arguments: { draft: { ...BILL, warranty_months: 18 } },
          },
        },
      }),
    );

    const name = await screen.findByRole('textbox', { name: /What you bought/ });
    expect(name).toHaveValue('Samsung 253L Refrigerator');
    // Not one of the quick lengths: another date, worked out from the day bought.
    expect(screen.getByRole('radio', { name: 'Another date' })).toBeChecked();
    expect(screen.getByLabelText('Warranty ends on')).toHaveValue('2027-09-14');
    // The history entry forgets it, so a reload or Back doesn't fill a form again.
    await waitFor(() => {
      expect(router.state.location.state).toBeNull();
    });
    expect(name).toHaveValue('Samsung 253L Refrigerator');
  });

  it('keeps the form and what was typed when a background refresh fails', async () => {
    receipts = [receipt({ id: 'kept', text: 'Fridge' })];
    const { user, queryClient } = renderApp('/m/receipts/kept');
    const name = await screen.findByRole('textbox', { name: /What you bought/ });
    await user.type(name, ' 2');

    server.use(
      http.get('*/api/v1/receipts/items/:id', () =>
        HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'down'), { status: 500 }),
      ),
    );
    await act(() => queryClient.invalidateQueries());

    expect(screen.queryByText("This receipt couldn't be loaded.")).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /What you bought/ })).toHaveValue('Fridge 2');
  });

  it('is changed, and deleted after asking', async () => {
    receipts = [
      receipt({
        id: 'kept',
        text: 'Fridge',
        bought_on: '2026-01-10',
        warranty_ends_on: '2028-01-10',
        warranty: 'active',
        remind_days_before: 15,
      }),
    ];
    const { user, router } = renderApp('/m/receipts/kept');
    const name = await screen.findByRole('textbox', { name: /What you bought/ });
    expect(screen.getByRole('radio', { name: '2 years' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: /Remind me/ })).toHaveValue('15');

    await user.clear(name);
    await user.type(name, 'Big fridge');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved “Big fridge”.')).toBeInTheDocument();
    expect(sent).toEqual([
      expect.objectContaining({ text: 'Big fridge', warranty_ends_on: '2028-01-10' }),
    ]);

    await user.click(await screen.findByRole('link', { name: /Big fridge/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this receipt?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Deleted “Big fridge”.')).toBeInTheDocument();
    expect(receipts).toEqual([]);
    // Back on the list: the deleted receipt's own page never shows its failed reload.
    expect(await screen.findByText(/No receipts yet/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/m/receipts');
  });
});
