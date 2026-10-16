import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import type { components } from '@/core/api/schema';
import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server } from '@/test/msw';
import { renderApp } from '@/test/render';

type Schemas = components['schemas'];
type Body = Schemas['ImportIn'];

const CSV = 'Date,Narration,Withdrawal Amt.,Deposit Amt.\n01/10/2026,Swiggy,"1,250.50",\n';
const GUESS: Schemas['ColumnMapping'] = {
  header_row: 0,
  columns: { date: 0, title: 1, debit: 2, credit: 3 },
  date_format: '%d/%m/%Y',
  signs: 'expense',
};
const entry = (changes: Partial<Schemas['ImportEntry']>): Schemas['ImportEntry'] => ({
  date: '2026-10-01',
  time: null,
  kind: 'expense',
  title: 'Swiggy',
  amount_minor: 125050,
  currency: 'INR',
  category_id: 'groceries',
  category_guessed: true,
  quantity: null,
  unit: null,
  merchant: null,
  payment_mode: null,
  for_whom: null,
  tags: [],
  note: null,
  ...changes,
});
let sent: { file: string; mapping: Body['mapping'] }[];
let commits: Omit<Schemas['CommitIn'], 'file'>[];
/** The import's batches: two rows, then one. */
const BATCHES: Record<number, Schemas['CommitOut']> = {
  0: { added: 2, already: 0, done: 2, total: 3, next_offset: 2 },
  2: { added: 1, already: 0, done: 3, total: 3, next_offset: null },
};

function answer(mapping: Schemas['ColumnMapping']): Schemas['PreviewOut'] {
  const problem: Schemas['ImportRow'] = {
    line: 4,
    entry: null,
    problems: ['missing_amount'],
    duplicate: false,
  };
  return {
    fingerprint: 'f'.repeat(64),
    columns: ['Date', 'Narration', 'Withdrawal Amt.', 'Deposit Amt.'],
    mapping,
    date_formats: [
      { format: '%d/%m/%Y', example: '31/10/2026' },
      { format: '%m/%d/%Y', example: '10/31/2026' },
    ],
    rows: [
      { line: 2, entry: entry({}), problems: [], duplicate: false },
      {
        line: 3,
        entry: entry({
          title: 'Salary',
          kind: 'income',
          amount_minor: 5000000,
          category_id: 'salary',
          category_guessed: false,
        }),
        problems: [],
        duplicate: true,
      },
      problem,
    ],
    problems: [problem],
    unknown_categories: ['Food & drinks'],
    total: 3,
    ready: 1,
    duplicates: 1,
    with_problems: 1,
  };
}

async function upload() {
  const view = renderApp('/m/expenses/import');
  await screen.findByRole('heading', { level: 1, name: 'Import entries' });
  const file = new File([CSV], 'statement.csv', { type: 'text/csv' });
  await view.user.upload(screen.getByLabelText(/Choose a CSV file/), file);
  await screen.findByRole('heading', { name: 'What it would add' });
  return view;
}

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/import-page'),
    import('@/modules/expenses/entries-page'),
  ]);
}, 120_000);

beforeEach(() => {
  sent = [];
  commits = [];
  server.use(
    ...fakeExpenses().handlers,
    http.post('*/api/v1/expenses/import/preview', async ({ request }) => {
      const body = (await request.json()) as Body;
      sent.push({ file: atob(body.file), mapping: body.mapping });
      return HttpResponse.json(answer(body.mapping ?? GUESS));
    }),
    http.post('*/api/v1/expenses/import/commit', async ({ request }) => {
      const body = (await request.json()) as Schemas['CommitIn'];
      const { mapping, include_duplicates, offset } = body;
      commits.push({ mapping, include_duplicates, offset });
      return HttpResponse.json(BATCHES[offset]);
    }),
  );
});

describe('import', () => {
  it('reads the file chosen with a guessed mapping, and shows what it would add', async () => {
    await upload();

    expect(sent).toEqual([{ file: CSV, mapping: undefined }]);
    expect(screen.getByRole('combobox', { name: 'Date' })).toHaveValue('0');
    expect(screen.getByRole('combobox', { name: 'Money out (debit)' })).toHaveValue('2');
    expect(screen.getByRole('combobox', { name: 'Amount' })).toHaveValue('');
    expect(screen.getByText('To add').nextElementSibling).toHaveTextContent('1');
    expect(
      screen.getByText('With a problem', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('1');

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2Oct 1, 2026Swiggy−₹1,250.50Groceries (guessed)Ready');
    expect(rows[2]).toHaveTextContent('Salary+₹50,000Salary');
    expect(rows[2]).toHaveTextContent('Saved already');
    expect(rows[3]).toHaveTextContent('no amount');
    expect(screen.getByText('Row 4: no amount')).toBeInTheDocument();
    expect(
      screen.getByText('Not your categories, so filed under Other: Food & drinks.'),
    ).toBeInTheDocument();
  });

  it('reads the file again as the mapping changes', async () => {
    const { user } = await upload();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Dates are written like' }),
      '10/31/2026',
    );
    await waitFor(() => {
      expect(sent).toHaveLength(2);
    });
    expect(sent[1]).toEqual({ file: CSV, mapping: { ...GUESS, date_format: '%m/%d/%Y' } });

    // Without a date column it can't make entries: it says so, and asks nothing.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Date' }), 'Not in the file');
    expect(
      screen.getByText('Say which columns hold the date, what it was and the amount.'),
    ).toBeInTheDocument();
    expect(sent).toHaveLength(2);
  });

  it('says why a file can not be read', async () => {
    server.use(
      http.post('*/api/v1/expenses/import/preview', () =>
        HttpResponse.json(
          errorEnvelope('EXPENSE_IMPORT_TOO_LARGE', 'Too long', { max_rows: 5000 }),
          {
            status: 422,
          },
        ),
      ),
    );
    const view = renderApp('/m/expenses/import');
    await screen.findByRole('heading', { level: 1, name: 'Import entries' });
    await view.user.upload(
      screen.getByLabelText(/Choose a CSV file/),
      new File([CSV], 'big.csv', { type: 'text/csv' }),
    );
    expect(
      await screen.findByText('That file is longer than one import can take. Split it by period.'),
    ).toBeInTheDocument();
  });

  it('imports the ready rows batch by batch, then says what it added', async () => {
    const { user } = await upload();
    await user.click(screen.getByRole('button', { name: 'Import 1 entry' }));

    expect(await screen.findByText(/Added 3 entries\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See your entries' })).toHaveAttribute(
      'href',
      '/m/expenses?period=allTime',
    );
    expect(commits).toEqual([
      { mapping: GUESS, include_duplicates: false, offset: 0 },
      { mapping: GUESS, include_duplicates: false, offset: 2 },
    ]);
  });

  it('also imports the rows saved already when asked', async () => {
    const { user } = await upload();
    await user.click(
      screen.getByRole('switch', { name: 'Also import the 1 row that looks saved already' }),
    );
    await user.click(screen.getByRole('button', { name: 'Import 2 entries' }));
    await screen.findByText(/Added 3 entries\./);
    expect(commits[0]?.include_duplicates).toBe(true);
  });

  it('carries on from where a failed run stopped', async () => {
    server.use(
      http.post(
        '*/api/v1/expenses/import/commit',
        async ({ request }) => {
          const { offset } = (await request.json()) as Schemas['CommitIn'];
          if (offset === 2) {
            return HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 });
          }
          return HttpResponse.json(BATCHES[0]);
        },
        { once: false },
      ),
    );
    const { user } = await upload();
    await user.click(screen.getByRole('button', { name: 'Import 1 entry' }));
    expect(await screen.findByText(/carrying on adds the rest/)).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Importing' })).toHaveAttribute('aria-valuenow', '2');

    server.use(
      http.post('*/api/v1/expenses/import/commit', async ({ request }) => {
        const body = (await request.json()) as Schemas['CommitIn'];
        const { mapping, include_duplicates, offset } = body;
        commits.push({ mapping, include_duplicates, offset });
        return HttpResponse.json(BATCHES[offset]);
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Carry on importing' }));
    expect(await screen.findByText(/Added 3 entries\./)).toBeInTheDocument();
    expect(commits.map((commit) => commit.offset)).toEqual([2]); // not from the start
  });

  it('is reached from the list', async () => {
    renderApp('/m/expenses');
    await screen.findByRole('heading', { level: 1, name: 'Expenses' });
    expect(screen.getByRole('link', { name: 'Import CSV' })).toHaveAttribute(
      'href',
      '/m/expenses/import',
    );
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    await upload();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
