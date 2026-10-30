import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgentView, RunInput } from '@/core/agents/queries';
import { ReaderUnavailableError, readOnDevice, shrink } from '@/core/scan/photo-reader';
import { useScanOnDevice } from '@/core/scan/use-photo-scan';
import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server, testRun } from '@/test/msw';
import { renderApp } from '@/test/render';

// The camera and the on-device reader need a real browser: their seams are faked here (the
// image preparation has its own tests, and `npm run receipt-samples ocr` measures the reader).
vi.mock('@/core/scan/photo-reader', () => ({
  PHOTO_TYPE: 'image/jpeg',
  shrink: vi.fn(),
  readOnDevice: vi.fn(),
  ReaderUnavailableError: class ReaderUnavailableError extends Error {},
}));

const NOW = new Date('2026-10-29T06:00:00Z');
const PHOTO = new File(['RAW-PHOTO-BYTES'], 'IMG_0001.jpg', { type: 'image/jpeg' });
const SHRUNK = 'SHRUNK-JPEG-BYTES';
const READ_TEXT = 'SRI MURUGAN STORES\nTomato 1kg 2 40.00 80.00\nGrand Total 335.00';
const SHOP = 'Sri Murugan Stores';
const LINES = [
  { title: 'Tomato 1kg', amount: 80, category_id: 'groceries' },
  { title: 'Toor Dal 1kg', amount: 145, category_id: 'groceries' },
  { title: 'Soap', amount: 110, category_id: 'personal_care' },
].map((line) => ({ kind: 'expense', merchant: SHOP, date: '2026-10-12', uncertain: [], ...line }));
const DRAFTS = [{ tool: 'expenses_draft', arguments: { drafts: LINES } }];

let asked: RunInput[];
let photos: { type: string | null; body: string; query: string }[];

const agentsPage = (mode: AgentView['mode']) => ({
  items: [
    {
      name: 'assistant',
      description: 'The in-app assistant.',
      mode,
      reason: mode === 'agent' ? null : 'consent',
      fallback: true,
      quota_remaining: 30,
      skills: [
        {
          name: 'scan-receipt',
          description: 'Read a receipt.',
          mode: 'agent',
          has_static: true,
          photo_mode: mode, // where a photo would be read: by AI, or here
        },
      ],
    },
  ],
  total: 1,
  page: 1,
  page_size: 20,
  pages: 1,
});

/** The assistant's state for this account: AI reads photos (agent) or not (static). */
function aiIs(mode: AgentView['mode']) {
  server.use(http.get('*/api/v1/agents', () => HttpResponse.json(agentsPage(mode))));
}

/** Text runs answer with the rules' drafts; photo runs with what `photoAnswer` says. */
function answer(photoAnswer: Parameters<typeof testRun>[0] | Response = {}) {
  server.use(
    http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
      asked.push((await request.json()) as RunInput);
      return HttpResponse.json(
        testRun({
          skill: 'scan-receipt',
          proposals: [],
          client_actions: DRAFTS,
          message_code: 'scan-receipt.ready',
          message_params: { count: 3, total: 335 },
        }),
        { status: 201 },
      );
    }),
    http.post('*/api/v1/agents/:name/photo-runs', async ({ request }) => {
      const url = new URL(request.url);
      photos.push({
        type: request.headers.get('Content-Type'),
        body: await request.text(),
        query: url.search,
      });
      if (photoAnswer instanceof Response) return photoAnswer;
      return HttpResponse.json(
        testRun({
          skill: 'scan-receipt',
          mode: 'agent',
          reason: null,
          proposals: [],
          client_actions: DRAFTS,
          message: 'I read 3 items from Sri Murugan Stores, 335 in all.',
          message_code: null,
          ...photoAnswer,
        }),
        { status: 201 },
      );
    }),
  );
}

const TO_AI = 'The photo goes to the free AI service to be read';
const HERE = 'The photo is read on this device and never leaves it';

/** The Expenses page, once it knows where a photo would be read (it scans nothing before). */
async function open() {
  const view = renderApp('/m/expenses');
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  await screen.findByText(new RegExp(`${TO_AI}|${HERE}`));
  return view;
}

function pick(photo: File = PHOTO) {
  fireEvent.change(screen.getByLabelText('Receipt photo'), { target: { files: [photo] } });
}

const tray = () => within(screen.getByRole('region', { name: 'Check before saving' }));
/** Waits for the card, then for this on it. */
const onCard = async (text: string) =>
  within(await screen.findByRole('region', { name: 'Check before saving' })).findByText(text);

beforeAll(async () => {
  await import('@/modules/expenses/entries-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  asked = [];
  photos = [];
  server.use(...fakeExpenses([]).handlers);
  vi.mocked(shrink).mockResolvedValue(new Blob([SHRUNK], { type: 'image/jpeg' }));
  vi.mocked(readOnDevice).mockImplementation((_photo, _language, onProgress) => {
    onProgress(0.5);
    return Promise.resolve(READ_TEXT);
  });
});

afterEach(() => {
  vi.useRealTimers();
  useScanOnDevice.setState({ on: false });
});

describe('without AI', () => {
  it('reads the photo on this device and puts its lines on the card, as one receipt', async () => {
    aiIs('static');
    answer();
    const { user } = await open();
    expect(screen.getByText(HERE, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Read photos on this device only' })).toBeNull();

    pick();

    expect(await onCard('Tomato 1kg')).toBeInTheDocument();
    expect(vi.mocked(readOnDevice)).toHaveBeenCalledWith(PHOTO, 'en', expect.any(Function));
    expect(photos).toEqual([]); // the photo itself never left
    expect(asked).toEqual([
      { input: READ_TEXT, skill: 'scan-receipt', locale: 'en', context: { input_type: 'ocr' } },
    ]);
    expect(
      await screen.findByText('Read 3 lines from the receipt, ₹335 in all.', { exact: false }),
    ).toBeInTheDocument();
    expect(tray().getByText('Receipt from Sri Murugan Stores: 3 lines, ₹335')).toBeInTheDocument();

    await user.click(tray().getByRole('button', { name: 'Combine into one' }));

    // One entry for the whole receipt, named for the shop, with the total.
    expect(await tray().findByText(SHOP)).toBeInTheDocument();
    expect(tray().queryByText('Tomato 1kg')).toBeNull();
    expect(tray().getByText('₹335')).toBeInTheDocument();
    expect(tray().getByText('Check: Category')).toBeInTheDocument(); // two categories were used
    expect(tray().queryByRole('button', { name: 'Combine into one' })).toBeNull();
    // Said, and the focus is on it: the button that had it is gone.
    expect(await screen.findByText(`Combined into one entry: ${SHOP}`)).toBeInTheDocument();
    expect(document.activeElement).toHaveAccessibleName(`Save ${SHOP}`);
  });

  it('keeps what any line was unsure of when combining, and a missing shop', async () => {
    aiIs('static');
    const unsure = LINES.map((line, index) => ({
      ...line,
      merchant: index === 1 ? SHOP : null, // the shop is on the second line only
      uncertain: index === 0 ? ['date'] : [],
    }));
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          testRun({
            skill: 'scan-receipt',
            proposals: [],
            client_actions: [{ tool: 'expenses_draft', arguments: { drafts: unsure } }],
          }),
          { status: 201 },
        ),
      ),
    );
    const { user } = await open();

    pick();
    await onCard('Tomato 1kg');
    await user.click(tray().getByRole('button', { name: 'Combine into one' }));

    expect(await tray().findByText(SHOP)).toBeInTheDocument();
    const check = tray().getByText(/^Check:/).textContent;
    expect(check).toContain('Date'); // from the first line
    expect(check).toContain('Category'); // two categories in one
  });

  it('says when the reader on this device could not start', async () => {
    aiIs('static');
    answer();
    vi.mocked(readOnDevice).mockRejectedValue(new ReaderUnavailableError('timeout'));
    await open();

    pick();

    expect(
      await screen.findByText("The reader on this device couldn't start.", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan a receipt' })).toBeEnabled();
  });

  it('says so when no text could be read, and sends nothing', async () => {
    aiIs('static');
    answer();
    vi.mocked(readOnDevice).mockResolvedValue('');
    await open();

    pick();

    expect(
      await screen.findByText("I couldn't read a receipt in that photo.", { exact: false }),
    ).toBeInTheDocument();
    expect(asked).toEqual([]);
  });

  it('says when the photo cannot be opened at all', async () => {
    aiIs('static');
    answer();
    vi.mocked(readOnDevice).mockRejectedValue(new DOMException('bad image', 'InvalidStateError'));
    await open();

    pick();

    expect(
      await screen.findByText("That photo couldn't be opened.", { exact: false }),
    ).toBeInTheDocument();
  });
});

describe('with AI on', () => {
  it('sends the shrunk photo, never the original, and shows what AI read', async () => {
    aiIs('agent');
    answer();
    await open();
    expect(screen.getByText(TO_AI, { exact: false })).toBeInTheDocument();

    pick();

    expect(await onCard('Toor Dal 1kg')).toBeInTheDocument();
    expect(photos).toEqual([
      { type: 'image/jpeg', body: SHRUNK, query: '?skill=scan-receipt&locale=en' },
    ]);
    expect(vi.mocked(shrink)).toHaveBeenCalledWith(PHOTO);
    expect(vi.mocked(readOnDevice)).not.toHaveBeenCalled();
    expect(
      screen.getByText('I read 3 items from Sri Murugan Stores, 335 in all.'),
    ).toBeInTheDocument();
  });

  it('reads the photo here when AI stopped before drafting anything', async () => {
    aiIs('agent');
    answer({ status: 'incomplete', reason: 'quota', client_actions: [], message: null });
    await open();

    pick();

    expect(await onCard('Soap')).toBeInTheDocument();
    expect(vi.mocked(readOnDevice)).toHaveBeenCalledOnce();
  });

  it('scans nothing until it knows where the photo would go', async () => {
    let known: (value?: unknown) => void = () => undefined;
    const answered = new Promise((resolve) => (known = resolve));
    server.use(
      http.get('*/api/v1/agents', async () => {
        await answered;
        return HttpResponse.json(agentsPage('agent'));
      }),
    );
    answer();
    renderApp('/m/expenses');
    await screen.findByText('Checking how the photo can be read…');

    expect(screen.getByRole('button', { name: 'Scan a receipt' })).toBeDisabled();
    expect(screen.queryByText(/never leaves it/)).toBeNull(); // no promise it may not keep
    known();

    expect(await screen.findByText(TO_AI, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan a receipt' })).toBeEnabled();
  });

  it('reads the photo here when AI could not take it after all', async () => {
    aiIs('agent');
    // The server had no provider that reads images: its rules can only read text.
    answer({
      mode: 'static',
      reason: 'no_provider',
      client_actions: [],
      message: null,
      message_code: 'scan-receipt.on_device',
    });
    await open();

    pick();

    expect(await onCard('Soap')).toBeInTheDocument();
    expect(photos).toHaveLength(1);
    expect(vi.mocked(readOnDevice)).toHaveBeenCalledOnce();
    expect(asked).toHaveLength(1);
  });

  it('keeps photos to this device when asked, and remembers it', async () => {
    aiIs('agent');
    answer();
    const { user } = await open();

    await user.click(
      await screen.findByRole('checkbox', { name: 'Read photos on this device only' }),
    );
    pick();

    expect(await onCard('Soap')).toBeInTheDocument();
    expect(photos).toEqual([]);
    expect(asked).toHaveLength(1);
    expect(localStorage.getItem('tt-scan-on-device')).toContain('"on":true');
  });

  it('says why the server refused the photo', async () => {
    aiIs('agent');
    answer(HttpResponse.json(errorEnvelope('AGENT_PHOTO_TOO_LARGE', 'too large'), { status: 413 }));
    await open();

    pick();

    expect(await screen.findByText('That photo is too large to send.')).toBeInTheDocument();
    expect(asked).toEqual([]);
  });
});

it('keeps no trace of the photo on this device', async () => {
  aiIs('agent');
  answer();
  await open();

  pick();
  await onCard('Soap');

  // The drafts are kept (to survive a reload); the photo, in any form, is not.
  await waitFor(() => {
    expect(Object.keys(localStorage).some((key) => key.includes('drafts'))).toBe(true);
  });
  const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key) ?? '');
  expect(stored.join('\n')).not.toMatch(/RAW-PHOTO-BYTES|SHRUNK-JPEG-BYTES|IMG_0001|data:image/);
  expect(Object.keys(sessionStorage)).toEqual([]);
});

it('offers no Combine while a receipt is being saved', async () => {
  aiIs('static');
  answer();
  let saved: (value?: unknown) => void = () => undefined;
  const slow = new Promise((resolve) => (saved = resolve));
  server.use(
    http.post('*/api/v1/expenses/entries', async () => {
      await slow;
      return new HttpResponse(null, { status: 503 });
    }),
  );
  const { user } = await open();

  pick();
  await onCard('Tomato 1kg');
  // Soap's category isn't one the fake API knows: two lines are ready to save.
  await user.click(await tray().findByRole('button', { name: 'Save all (2)' }));

  expect(tray().getByRole('button', { name: 'Combine into one' })).toBeDisabled();
  saved();
  await waitFor(() => {
    expect(tray().getByRole('button', { name: 'Combine into one' })).toBeEnabled();
  });
});
