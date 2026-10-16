import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, describe, expect, it } from 'vitest';

import { server, testRun } from '@/test/msw';
import { renderApp } from '@/test/render';

beforeAll(async () => {
  await Promise.all([
    import('@/platform/welcome/welcome-page'),
    import('@/platform/palette/command-palette'),
  ]);
}, 120_000);

async function askAbout(question: string, run: Parameters<typeof testRun>[0]) {
  server.use(
    http.post('*/api/v1/agents/:name/runs', () =>
      HttpResponse.json(testRun({ proposals: [], ...run }), { status: 201 }),
    ),
  );
  const view = renderApp('/');
  await screen.findByRole('heading', { level: 1 });
  await view.user.keyboard('{Control>}k{/Control}');
  const dialog = within(await screen.findByRole('dialog', { name: 'Command palette' }));
  await view.user.type(dialog.getByRole('combobox'), question);
  await view.user.click(
    await dialog.findByRole('option', { name: `Ask the assistant: “${question}”` }),
  );
  return dialog;
}

describe('questions about expenses, answered without AI', () => {
  it('says the figure with money and days in the user’s language', async () => {
    const dialog = await askAbout('how much did I spend last month', {
      skill: 'ask-expenses',
      message_code: 'ask-expenses.total.expense',
      message_params: {
        currency: 'INR',
        from_on: '2026-09-01',
        to_on: '2026-09-30',
        amount_minor: 180000,
        count: 3,
      },
    });
    expect(
      await dialog.findByText('You spent ₹1,800 from September 1 to September 30.'),
    ).toBeInTheDocument();
  });

  it('names where most of it went', async () => {
    const dialog = await askAbout('where did I spend the most last month', {
      skill: 'ask-expenses',
      message_code: 'ask-expenses.top.2',
      message_params: {
        currency: 'INR',
        from_on: '2026-09-01',
        to_on: '2026-09-30',
        first_name: 'Big Bazaar',
        first_minor: 150000,
        second_name: 'Metro',
        second_minor: 30000,
      },
    });
    expect(
      await dialog.findByText(
        'From September 1 to September 30, most went to Big Bazaar (₹1,500), then Metro (₹300).',
      ),
    ).toBeInTheDocument();
  });
});
