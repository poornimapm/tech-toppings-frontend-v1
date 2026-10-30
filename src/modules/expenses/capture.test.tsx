import { onlineManager } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MODULE_ACTION, type RunInput } from '@/core/agents/queries';
import { draftsFrom, useReadBack } from '@/modules/expenses/capture';
import type { DuplicateCandidate } from '@/modules/expenses/duplicates';
import { entryOf, fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server, testRun, testUser } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z'); // 8 October in Kolkata
const VEGETABLES = {
  kind: 'expense',
  title: 'Vegetables',
  amount: 250.5,
  category_id: 'groceries',
  date: '2026-10-07',
  merchant: 'Big Bazaar',
  for_whom: null,
  uncertain: [],
};
const SOMETHING = {
  ...VEGETABLES,
  title: null,
  amount: null,
  merchant: null,
  uncertain: ['amount'],
};

let fake: ReturnType<typeof fakeExpenses>;
let asked: RunInput[];

/** The assistant answers with these drafts (as either the AI or the rule parser would). */
function answerWith(drafts: unknown[], changes: Parameters<typeof testRun>[0] = {}) {
  server.use(
    http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
      asked.push((await request.json()) as RunInput);
      const client_actions = drafts.length
        ? [{ tool: 'expenses_draft', arguments: { drafts } }]
        : [];
      return HttpResponse.json(
        testRun({ skill: 'track-expenses', proposals: [], client_actions, ...changes }),
        { status: 201 },
      );
    }),
  );
}

async function open() {
  const view = renderApp('/m/expenses');
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  return view;
}

async function say(user: Awaited<ReturnType<typeof open>>['user'], text: string) {
  await user.type(screen.getByRole('textbox', { name: 'Say or type what you spent' }), text);
  await user.click(screen.getByRole('button', { name: 'Read it' }));
}

function tray() {
  return within(screen.getByRole('region', { name: 'Check before saving' }));
}

/** The new entries the page sent (not the checks for duplicates). */
function saves() {
  return fake.requests.filter(
    (request) => request.method === 'POST' && request.path === '/entries',
  );
}

/** The titles the page checked for duplicates, in the order asked. */
function checked() {
  return fake.requests
    .filter((request) => request.path === '/entries/duplicates/check')
    .flatMap((request) => (request.body as { candidates: DuplicateCandidate[] }).candidates)
    .map((candidate) => candidate.title);
}

beforeAll(async () => {
  await import('@/modules/expenses/entries-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses([]);
  asked = [];
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
  useReadBack.setState({ on: false });
});

/** The device loses its network: the browser says so, and the query client hears it. */
function goOffline() {
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
  return online;
}

describe('with no network', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('keeps an entry on the device and sends it once back, under the same key', async () => {
    answerWith([VEGETABLES]);
    server.use(http.post('*/api/v1/expenses/entries', () => HttpResponse.error(), { once: true }));
    const { user } = await open();
    await say(user, '250.50 for vegetables at big bazaar yesterday');
    const draft = await tray().findByText('Vegetables');

    const online = goOffline();
    await user.click(tray().getByRole('button', { name: 'Save Vegetables' }));
    expect(
      await screen.findByText(
        "“Vegetables” is kept on this device and sent when you're back online.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(draft).not.toBeInTheDocument();
    });
    expect(screen.getByText('1 thing you added offline is waiting to be sent.')).toBeVisible();
    expect(saves()).toHaveLength(0);

    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(await screen.findByText('Sent 1 thing you added offline.')).toBeInTheDocument();
    const [sent] = saves();
    expect(sent?.key).toMatch(/^[0-9a-f-]{36}$/); // the draft's own key: never saved twice
    expect(sent?.body).toMatchObject({ title: 'Vegetables', amount_minor: 25050 });
    expect(screen.queryByText(/waiting to be sent/)).toBeNull();
  });

  it('keeps what was said, and reads it into drafts once back online', async () => {
    server.use(http.post('*/api/v1/agents/:name/runs', () => HttpResponse.error(), { once: true }));
    const { user } = await open();
    const online = goOffline();

    await say(user, '250.50 for vegetables at big bazaar yesterday');
    expect(
      await screen.findByText(/Kept on this device: it's read when you're back/),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Say or type what you spent' })).toHaveValue('');

    answerWith([VEGETABLES]);
    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await screen.findByRole('region', { name: 'Check before saving' });
    expect(tray().getByText('Vegetables')).toBeInTheDocument();
    expect(asked).toEqual([
      {
        input: '250.50 for vegetables at big bazaar yesterday',
        skill: 'track-expenses',
        locale: 'en',
        context: { input_type: 'text' },
      },
    ]);
    expect(saves()).toHaveLength(0); // still only a draft, to check
  });

  it('keeps the words as a draft when nothing could be read from them', async () => {
    server.use(http.post('*/api/v1/agents/:name/runs', () => HttpResponse.error(), { once: true }));
    const { user } = await open();
    const online = goOffline();
    await say(user, 'something at the market');
    await screen.findByText(/Kept on this device/);

    answerWith([]);
    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await screen.findByRole('region', { name: 'Check before saving' });
    expect(tray().getByText('something at the market')).toBeInTheDocument();
  });
});

describe('capturing an entry', () => {
  it('turns what was typed into a draft, and saves it only when told to', async () => {
    answerWith([VEGETABLES]);
    const { user } = await open();

    await say(user, '250.50 for vegetables at big bazaar yesterday');

    const draft = await tray().findByText('Vegetables');
    expect(tray().getByText('Groceries · Oct 7, 2026 · Big Bazaar')).toBeInTheDocument();
    expect(tray().getByText('₹250.50')).toBeInTheDocument();
    expect(asked).toEqual([
      {
        input: '250.50 for vegetables at big bazaar yesterday',
        skill: 'track-expenses',
        locale: 'en',
        context: { input_type: 'text' },
      },
    ]);
    expect(saves()).toHaveLength(0);
    expect(screen.getByRole('textbox', { name: 'Say or type what you spent' })).toHaveValue('');

    await user.click(tray().getByRole('button', { name: 'Save Vegetables' }));

    expect(await screen.findByText('Added Vegetables')).toBeInTheDocument();
    await waitFor(() => {
      expect(draft).not.toBeInTheDocument();
    });
    const [saved] = saves();
    expect(saved?.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved?.body).toMatchObject({
      kind: 'expense',
      title: 'Vegetables',
      amount_minor: 25050,
      category_id: 'groceries',
      date: '2026-10-07',
      merchant: 'Big Bazaar',
    });
    expect(await screen.findByRole('link', { name: 'Vegetables' })).toBeInTheDocument();
  });

  it('keeps how much was bought, and saves it with its unit', async () => {
    answerWith([{ ...VEGETABLES, title: 'Tomatoes', amount: 80, quantity: 2, unit: 'kg' }]);
    const { user } = await open();

    await say(user, '2 kg tomatoes 80');

    expect(
      await tray().findByText('2 kg · Groceries · Oct 7, 2026 · Big Bazaar'),
    ).toBeInTheDocument();
    await user.click(tray().getByRole('button', { name: 'Save Tomatoes' }));
    expect(await screen.findByText('Added Tomatoes')).toBeInTheDocument();
    expect(saves()[0]?.body).toMatchObject({
      title: 'Tomatoes',
      amount_minor: 8000,
      quantity: 2,
      unit: 'kg',
    });
  });

  it('asks for what is missing instead of guessing it', async () => {
    answerWith([SOMETHING]);
    const { user } = await open();
    await say(user, 'bought something');

    expect(await tray().findByText('What was it?')).toBeInTheDocument();
    expect(tray().getByText('How much?')).toBeInTheDocument();
    expect(tray().getByText('Check: Amount')).toBeInTheDocument();
    expect(tray().queryByRole('button', { name: /^Save/ })).toBeNull();

    await user.click(tray().getByRole('button', { name: 'Edit What was it?' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add an entry' }));
    expect(form.getByRole('radio', { name: 'Groceries' })).toBeChecked();
    await user.type(form.getByRole('textbox', { name: 'Amount (INR)' }), '80');
    await user.type(form.getByRole('textbox', { name: 'What was it?' }), 'Tomatoes');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added Tomatoes')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Check before saving' })).toBeNull();
    });
    expect(fake.state.entries.map((entry) => entry.title)).toEqual(['Tomatoes']);
  });

  it('saves several at once, reads them back aloud when asked, and lets one be dismissed', async () => {
    const spoken: string[] = [];
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        constructor(readonly text: string) {}
      },
    );
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [{ lang: 'en-IN' }],
      cancel: vi.fn(),
      speak: (utterance: { text: string }) => spoken.push(utterance.text),
    });
    answerWith([
      { ...VEGETABLES, title: 'Coffee', amount: 25 },
      { ...VEGETABLES, title: 'Tea', amount: 15 },
      { ...VEGETABLES, title: 'Typo', amount: 1 },
    ]);
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Read saved entries aloud' }));
    await say(user, 'coffee 25 and tea 15');

    await user.click(await tray().findByRole('button', { name: 'Dismiss Typo' }));
    await user.click(tray().getByRole('button', { name: 'Save all (2)' }));

    await waitFor(() => {
      expect(fake.state.entries.map((entry) => entry.title)).toEqual(['Coffee', 'Tea']);
    });
    expect(spoken).toEqual(['Added Coffee, ₹25', 'Added Tea, ₹15']);
    vi.unstubAllGlobals();
  });

  it(
    'flags a draft that looks saved already: Save all skips it, and it can be saved anyway',
    { timeout: 40_000 },
    async () => {
      fake = fakeExpenses([entryOf()]); // Rice, ₹125 on 8 October
      server.use(...fake.handlers);
      answerWith([
        { ...VEGETABLES, title: 'rice', amount: 125, date: '2026-10-08' },
        { ...VEGETABLES, title: 'Coffee', amount: 25 },
        { ...VEGETABLES, title: 'Tea', amount: 15 },
      ]);
      const { user } = await open();
      await say(user, 'rice 125, coffee 25 and tea 15');

      const note = await tray().findByText(
        'You may have saved this already: Rice · ₹125 · Oct 8, 2026 · Big Bazaar',
      );
      expect(note.closest('[role="status"]')).not.toBeNull();
      expect(tray().queryByRole('button', { name: 'Save rice' })).toBeNull();
      expect(await axe(document.body)).toHaveNoViolations();
      await waitFor(() => {
        expect(checked().sort()).toEqual(['Coffee', 'Tea', 'rice']);
      });

      await user.click(tray().getByRole('button', { name: 'Save all (2)' }));
      await waitFor(() => {
        expect(fake.state.entries.map((entry) => entry.title)).toEqual(['Rice', 'Coffee', 'Tea']);
      });
      expect(tray().getByText('rice')).toBeInTheDocument(); // still waiting to be checked
      // Only what is still on the card is checked again; a draft being saved would find itself.
      await waitFor(() => {
        expect(checked().sort()).toEqual(['Coffee', 'Tea', 'rice', 'rice']);
      });

      await user.click(tray().getByRole('button', { name: 'Save anyway: rice' }));
      expect(await screen.findByText('Added rice')).toBeInTheDocument();
      expect(saves().map((request) => (request.body as { title: string }).title)).toEqual([
        'Coffee',
        'Tea',
        'rice',
      ]);
      expect(checked()).toHaveLength(4);
    },
  );

  it('saves as usual when the check for duplicates fails', { timeout: 40_000 }, async () => {
    fake = fakeExpenses([entryOf()]); // Rice, ₹125 on 8 October
    let failed = 0;
    server.use(
      http.post('*/api/v1/expenses/entries/duplicates/check', () => {
        failed += 1;
        return HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 });
      }),
      ...fake.handlers,
    );
    const warn = vi.spyOn(console, 'warn');
    const coffee = { ...VEGETABLES, title: 'Coffee', amount: 25 };
    answerWith([{ ...VEGETABLES, title: 'rice', amount: 125, date: '2026-10-08' }, coffee, coffee]);
    const { user } = await open();
    await say(user, 'rice 125, coffee 25 and coffee 25');

    await waitFor(() => {
      expect(failed).toBe(2); // the two coffees alike are one question
    });
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate Queries'));
    // It is only advice: a check that fails says nothing, and holds nothing back.
    expect(tray().queryByText(/You may have saved this already/)).toBeNull();
    expect(screen.queryByText('The server ran into an error.')).toBeNull();
    await user.click(tray().getByRole('button', { name: 'Save all (3)' }));

    await waitFor(() => {
      expect(fake.state.entries.map((entry) => entry.title)).toEqual([
        'Rice',
        'rice',
        'Coffee',
        'Coffee',
      ]);
    });
    warn.mockRestore();
  });

  it('keeps reading while a draft is still saving, without bringing the saved one back', async () => {
    let finish: () => void = () => undefined;
    const slowSave = new Promise<void>((resolve) => {
      finish = resolve;
    });
    server.use(
      // Holds the save, then answers nothing so the fake API's own handler saves it.
      http.post('*/api/v1/expenses/entries', async () => {
        await slowSave;
      }),
    );
    answerWith([{ ...VEGETABLES, title: 'Tea', amount: 15 }]);
    const { user } = await open();
    await say(user, 'tea 15');
    await user.click(await tray().findByRole('button', { name: 'Save Tea' }));

    answerWith([{ ...VEGETABLES, title: 'Coffee', amount: 25 }]);
    await say(user, 'coffee 25'); // read while Tea is still saving
    await tray().findByText('Coffee');
    finish();

    expect(await screen.findByText('Added Tea')).toBeInTheDocument();
    await waitFor(() => {
      expect(tray().queryByText('Tea')).toBeNull();
    });
    expect(tray().getByText('Coffee')).toBeInTheDocument();
  });

  it('listens where the browser can, and says the words were spoken', async () => {
    const recognition = {
      lang: '',
      interimResults: false,
      continuous: false,
      onresult: null as ((event: unknown) => void) | null,
      onerror: null,
      onend: null as (() => void) | null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    vi.stubGlobal(
      'webkitSpeechRecognition',
      vi.fn(function Recognition() {
        return recognition;
      }),
    );
    answerWith([VEGETABLES]);
    const { user } = await open();

    await user.click(screen.getByRole('button', { name: 'Speak' }));
    expect(screen.getByText('Listening…')).toBeInTheDocument();
    act(() => {
      recognition.onresult?.({ results: [[{ transcript: 'vegetables 250' }]] });
      recognition.onend?.();
    });
    expect(screen.getByRole('textbox', { name: 'Say or type what you spent' })).toHaveValue(
      'vegetables 250',
    );
    await user.click(screen.getByRole('button', { name: 'Read it' }));

    await tray().findByText('Vegetables');
    expect(asked[0]?.context).toEqual({ input_type: 'speech' });
    vi.unstubAllGlobals();
  });

  it('has no microphone where the browser cannot listen', async () => {
    await open();

    expect(screen.queryByRole('button', { name: 'Speak' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Read it' })).toBeDisabled(); // nothing typed yet
  });

  it('says so when nothing was understood, or passes on the question the AI asked', async () => {
    answerWith([]);
    const { user } = await open();
    await say(user, 'hello');
    expect(
      await screen.findByText("I couldn't find an entry in that. Try “250 for vegetables”."),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Say or type what you spent' })).toHaveValue(
      'hello',
    );

    answerWith([], { mode: 'agent', message: 'How much was it?' });
    await user.click(screen.getByRole('button', { name: 'Read it' }));
    expect(await screen.findByText('How much was it?')).toBeInTheDocument();
  });

  it('explains when the assistant cannot run, and offers to turn AI on', async () => {
    let consented = false;
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          consented
            ? testRun({
                mode: 'agent',
                proposals: [],
                client_actions: [{ tool: 'expenses_draft', arguments: { drafts: [VEGETABLES] } }],
              })
            : testRun({
                status: 'unavailable',
                mode: null,
                reason: 'consent',
                proposals: [],
                message_code: null,
              }),
          { status: 201 },
        ),
      ),
      http.patch('*/api/v1/me', () => {
        consented = true;
        return HttpResponse.json({ ...testUser, ai_consent: true });
      }),
    );
    const { user } = await open();
    await say(user, 'vegetables 250');

    expect(await screen.findByText(/AI is off for your account\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Turn on the AI assistant' }));

    // Read again once AI is on (and the page has heard so): the card then appears.
    await screen.findByRole('region', { name: 'Check before saving' });
    expect(await tray().findByText('Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Read in AI.')).toBeInTheDocument();
  });

  it('takes drafts the general assistant prepared', async () => {
    const { router } = await open();

    await act(() =>
      router.navigate('/m/expenses', {
        state: {
          [MODULE_ACTION]: { tool: 'expenses_draft', arguments: { drafts: [VEGETABLES] } },
        },
      }),
    );

    expect(await tray().findByText('Vegetables')).toBeInTheDocument();
    // Taken once: the history entry forgets it, so a reload or Back doesn't add it again.
    await waitFor(() => {
      expect(router.state.location.state).toBeNull();
    });
    expect(router.state.location.pathname).toBe('/m/expenses');
    expect(tray().getAllByText('Vegetables')).toHaveLength(1);
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    answerWith([VEGETABLES, SOMETHING]);
    const { user } = await open();
    await say(user, 'vegetables 250.50 and something');
    await tray().findByText('Vegetables');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('drafts from an assistant', () => {
  it('trusts nothing about their shape', () => {
    const action = {
      tool: 'expenses_draft',
      arguments: {
        drafts: [
          { title: 42, amount: -5, kind: 'transfer', date: 'tomorrow', uncertain: 'all' },
          'not a draft',
          {
            kind: 'income',
            title: 'Salary',
            amount: 65000,
            date: '2026-10-01',
            uncertain: ['date', 7],
          },
        ],
      },
    };

    const drafts = draftsFrom(action, '2026-10-08');

    expect(drafts).toMatchObject([
      {
        kind: 'expense',
        title: '',
        amount: '',
        category_id: '',
        date: '2026-10-08',
        merchant: '',
        for_whom: '',
        uncertain: [],
      },
      {
        kind: 'income',
        title: 'Salary',
        amount: '65000',
        category_id: '',
        date: '2026-10-01',
        merchant: '',
        for_whom: '',
        uncertain: ['date'],
      },
    ]);
    expect(new Set(drafts.map((draft) => draft.key)).size).toBe(2);
    expect(draftsFrom({ tool: 'expenses_open', arguments: {} }, '2026-10-08')).toEqual([]);
    expect(draftsFrom(undefined, '2026-10-08')).toEqual([]);
  });
});
