import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { iouDraftsFrom } from '@/modules/expenses/iou-capture';
import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { iouOf } from '@/modules/expenses/testing/fake-ious';
import { server, testRun } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z'); // 8 October in Kolkata
const LENT = {
  action: 'new',
  direction: 'lent',
  counterparty: 'Ravi',
  amount: 500,
  date: null,
  due_on: null,
  note: null,
  iou_id: null,
  uncertain: ['counterparty'],
};
const PAID_BACK = { ...LENT, action: 'repay', amount: 200, uncertain: [] };

let fake: ReturnType<typeof fakeExpenses>;

/** The assistant answers with these loans (as either the AI or the rule parser would). */
function answerWith(loans: unknown[]) {
  server.use(
    http.post('*/api/v1/agents/:name/runs', () =>
      HttpResponse.json(
        testRun({
          skill: 'track-expenses',
          message_code: 'track-expenses.ready.iou',
          message_params: {},
          proposals: [],
          client_actions: [{ tool: 'expenses_iou_draft', arguments: { drafts: loans } }],
        }),
        { status: 201 },
      ),
    ),
  );
}

/** Opens Expenses, says the text, and waits for the confirm card. */
async function say(text: string) {
  const view = renderApp('/m/expenses');
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  await view.user.type(screen.getByRole('textbox', { name: 'Say or type what you spent' }), text);
  await view.user.click(screen.getByRole('button', { name: 'Read it' }));
  const card = within(await screen.findByRole('region', { name: 'Check before saving' }));
  return { ...view, card };
}

function cardGone() {
  return waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Check before saving' })).toBeNull();
  });
}

/** What the page sent to this path. */
const sent = (path: string) =>
  fake.requests.filter((request) => request.method === 'POST' && request.path === path);

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/entries-page'),
    import('@/platform/palette/command-palette'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses([]);
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('capturing a loan', () => {
  it('turns "lent Ravi 500" into a loan to check, and saves it only when told to', async () => {
    answerWith([LENT]);
    const { user, card } = await say('lent Ravi 500');

    expect(await card.findByText('Lent to Ravi')).toBeInTheDocument();
    expect(card.getByText('Oct 8, 2026')).toBeInTheDocument();
    expect(card.getByText('₹500')).toBeInTheDocument();
    expect(card.getByText('Check: Person')).toBeInTheDocument();
    expect(card.getByRole('list', { name: 'Loans to check' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Say or type what you spent' })).toHaveValue('');
    expect(sent('/ious')).toHaveLength(0);
    expect(await axe(document.body)).toHaveNoViolations();

    await user.click(card.getByRole('button', { name: 'Save Lent to Ravi' }));

    expect(await screen.findByText('Saved: Ravi owes you ₹500.')).toBeInTheDocument();
    const [saved] = sent('/ious');
    expect(saved?.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved?.body).toEqual({
      counterparty: 'Ravi',
      direction: 'lent',
      amount_minor: 50000,
      date: '2026-10-08',
      due_on: null,
    });
    await cardGone();
    expect(fake.state.entries).toEqual([]); // a loan is never an expense
  });

  it("puts a payment towards that person's oldest open loan, or the one chosen", async () => {
    fake.state.ious.push(
      iouOf(),
      iouOf({
        id: 'iou-ravi-2',
        date: '2026-10-05',
        amount_minor: 30000,
        outstanding_minor: 30000,
      }),
      iouOf({ id: 'iou-meena', counterparty: 'Meena', counterparty_key: 'meena' }),
      iouOf({ id: 'iou-owed', direction: 'borrowed' }), // the other way round
    );
    answerWith([PAID_BACK]);
    const { user, card } = await say('Ravi paid me back 200');

    const towards = await card.findByRole('combobox', { name: 'Towards the loan' });
    expect(
      within(towards)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Oct 1, 2026: ₹1,000 left of ₹1,000', 'Oct 5, 2026: ₹300 left of ₹300']);
    expect(towards).toHaveValue('iou-ravi'); // the oldest
    expect(await axe(document.body)).toHaveNoViolations();
    await user.selectOptions(towards, 'iou-ravi-2');
    await user.click(card.getByRole('button', { name: 'Save Ravi paid you back' }));

    expect(await screen.findByText('Saved: Ravi owes you ₹100.')).toBeInTheDocument();
    const [payment] = sent('/ious/iou-ravi-2/settlements');
    expect(payment?.body).toEqual({ amount_minor: 20000, date: '2026-10-08' });
    expect(payment?.key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('can only be dismissed when that person has no open loan to pay back', async () => {
    answerWith([{ ...PAID_BACK, counterparty: 'Priya' }]);
    const { user, card } = await say('Priya paid me back 200');

    expect(
      await card.findByText(
        'No open loan with Priya to pay back. Check the name, or dismiss this.',
      ),
    ).toBeInTheDocument();
    expect(card.queryByRole('button', { name: /^Save/ })).toBeNull();
    await user.click(card.getByRole('button', { name: 'Dismiss Priya paid you back' }));
    await cardGone();
  });

  it('says how much is left when a payment is more than that', async () => {
    fake.state.ious.push(iouOf({ settled_minor: 90000, outstanding_minor: 10000 }));
    answerWith([PAID_BACK]);
    const { user, card } = await say('Ravi paid me back 200');

    await user.click(await card.findByRole('button', { name: 'Save Ravi paid you back' }));

    expect(
      await card.findByText("That's more than is left on this loan: ₹100."),
    ).toBeInTheDocument();
    expect(card.getByText('Ravi paid you back')).toBeInTheDocument(); // still there to fix
  });

  it('lets a guess be checked and corrected before saving', async () => {
    answerWith([{ ...LENT, direction: 'gifted', counterparty: 'Lent Ravi' }]);
    const { user, card } = await say('lent ravi 500');

    expect(await card.findByText('Check: Person, Lent or borrowed')).toBeInTheDocument();
    await user.click(card.getByRole('button', { name: 'Edit Lent to Lent Ravi' }));
    const form = within(await screen.findByRole('dialog', { name: 'Check the loan' }));
    await user.click(form.getByRole('radio', { name: 'You borrowed' }));
    await user.clear(form.getByRole('textbox', { name: 'Who' }));
    await user.type(form.getByRole('textbox', { name: 'Who' }), 'Ravi');
    expect(await axe(document.body)).toHaveNoViolations();
    await user.click(form.getByRole('button', { name: 'Done' }));

    expect(await card.findByText('Borrowed from Ravi')).toBeInTheDocument();
    expect(card.queryByText(/^Check:/)).toBeNull();
    await user.click(card.getByRole('button', { name: 'Save Borrowed from Ravi' }));
    expect(await screen.findByText('Saved: you owe Ravi ₹500.')).toBeInTheDocument();
    expect(sent('/ious')[0]?.body).toMatchObject({ counterparty: 'Ravi', direction: 'borrowed' });
  });

  it('takes loans the general assistant prepared', async () => {
    answerWith([LENT]);
    const { user, router } = renderApp('/m/expenses');
    await screen.findByRole('heading', { level: 1, name: 'Expenses' });
    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox'), 'lent Ravi 500');
    await user.click(
      await screen.findByRole('option', { name: 'Ask the assistant: “lent Ravi 500”' }),
    );

    expect(
      await screen.findByText(
        "Here's what I understood, as a loan. Check it in Expenses, then save.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Expenses' }));

    const card = within(await screen.findByRole('region', { name: 'Check before saving' }));
    expect(await card.findByText('Lent to Ravi')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/m/expenses');
  });
});

describe('loans from an assistant', () => {
  it('trusts nothing about their shape', () => {
    const action = {
      tool: 'expenses_iou_draft',
      arguments: {
        drafts: [
          {
            action: 'pay',
            direction: 'gifted',
            counterparty: 7,
            amount: -5,
            date: 'tomorrow',
            iou_id: 'iou-1',
            uncertain: ['amount', 'colour', 3],
          },
          'not a loan',
          {
            action: 'repay',
            direction: 'borrowed',
            counterparty: 'Meena',
            amount: 200,
            date: '2026-10-07',
            due_on: '2026-12-01',
            iou_id: 'iou-2',
            uncertain: [],
          },
          { direction: 'lent', counterparty: 'Ravi', amount: 500, due_on: '2026-10-01' },
        ],
      },
    };

    const loans = iouDraftsFrom(action, '2026-10-08');

    expect(loans).toMatchObject([
      {
        action: 'new',
        direction: 'lent',
        counterparty: '',
        amount: '',
        date: '2026-10-08',
        due_on: '',
        iou_id: '',
        uncertain: ['amount', 'direction'],
      },
      {
        action: 'repay',
        direction: 'borrowed',
        counterparty: 'Meena',
        amount: '200',
        date: '2026-10-07',
        due_on: '', // a payment has no due date
        iou_id: 'iou-2',
        uncertain: [],
      },
      { action: 'new', counterparty: 'Ravi', amount: '500', due_on: '' }, // due before it was lent
    ]);
    expect(new Set(loans.map((loan) => loan.key)).size).toBe(3);
    const draft = { tool: 'expenses_draft', arguments: { drafts: [LENT] } };
    expect(iouDraftsFrom(draft, '2026-10-08')).toEqual([]);
    expect(iouDraftsFrom(undefined, '2026-10-08')).toEqual([]);
  });
});
