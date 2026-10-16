import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import type { components } from '@/core/api/schema';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

type SearchOut = components['schemas']['SearchOut'];

const GOA: SearchOut = {
  query: 'goa',
  groups: [
    {
      owner: 'expenses',
      hits: [
        { kind: 'saved_filter', id: 'v-goa', title: 'Goa trip', path: '?view=v-goa' },
        {
          kind: 'loan_lent',
          id: 'iou-ravi',
          title: 'Ravi',
          path: 'plan?show=loans&focus=iou-ravi',
          amount_minor: 50000,
          currency: 'INR',
          date: '2026-10-20',
        },
        {
          kind: 'entry_expense',
          id: 'e-hotel',
          title: 'Hotel',
          path: 'entries/e-hotel',
          amount_minor: 600000,
          currency: 'INR',
          date: '2026-10-03',
        },
      ],
    },
  ],
};
let asked: string[];

async function search(text: string) {
  const view = renderApp('/');
  await screen.findByRole('heading', { level: 1 });
  await view.user.keyboard('{Control>}k{/Control}');
  const dialog = within(await screen.findByRole('dialog', { name: 'Command palette' }));
  await view.user.type(dialog.getByRole('combobox'), text);
  return { ...view, dialog };
}

beforeAll(async () => {
  await Promise.all([
    import('@/platform/welcome/welcome-page'),
    import('@/platform/palette/command-palette'),
    import('@/modules/expenses/entries-page'),
    import('@/modules/expenses/entry-page'),
  ]);
}, 120_000);

beforeEach(() => {
  asked = [];
  server.use(
    http.get('*/api/v1/search', ({ request }) => {
      const q = new URL(request.url).searchParams.get('q') ?? '';
      asked.push(q);
      return HttpResponse.json(q.toLowerCase() === 'goa' ? GOA : { query: q, groups: [] });
    }),
  );
});

describe('search in the command palette', () => {
  it('lists what each module found, under its name, once typing pauses', async () => {
    const { dialog } = await search('goa');

    const found = within(await dialog.findByRole('group', { name: 'Expenses' }));
    expect(found.getByRole('option', { name: /Goa trip/ })).toHaveTextContent('Goa tripSaved view');
    expect(found.getByRole('option', { name: /Ravi/ })).toHaveTextContent(
      'RaviOwed to you · ₹500 · Oct 20, 2026',
    );
    expect(found.getByRole('option', { name: /Hotel/ })).toHaveTextContent(
      'HotelSpent · ₹6,000 · Oct 3, 2026',
    );
    expect(asked).toEqual(['goa']); // not once per key
  });

  it('opens what is chosen in its module', async () => {
    const { user, router, dialog } = await search('goa');
    await user.click(await dialog.findByRole('option', { name: /Hotel/ }));
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).toBeNull();
    // The page is loaded first: the router moves once it is there.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/m/expenses/entries/e-hotel');
    });
  });

  it('leads a saved view to the list, which opens it', async () => {
    const { user, router, dialog } = await search('goa');
    await user.click(await dialog.findByRole('option', { name: /Goa trip/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/m/expenses');
    });
    // The list then opens the view by its id (saved-views.test.tsx).
    expect(router.state.location.search).toBe('?view=v-goa');
  });

  it('shows nothing found when nothing matches', async () => {
    const { dialog } = await search('zz');
    expect(await dialog.findByRole('option', { name: 'Ask the assistant: “zz”' })).toBeVisible();
    expect(dialog.queryByRole('group', { name: 'Expenses' })).toBeNull();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    const { dialog } = await search('goa');
    await dialog.findByRole('group', { name: 'Expenses' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
