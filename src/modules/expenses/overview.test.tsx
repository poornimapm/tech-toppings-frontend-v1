import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { entryOf, fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { insightOf } from '@/modules/expenses/testing/fake-analytics';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z'); // 8 October in Kolkata
let fake: ReturnType<typeof fakeExpenses>;

async function open(path = '/m/expenses/overview') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Overview' });
  return view;
}

const panel = (name: string) => within(screen.getByRole('region', { name }));

/** The entries list's totals line: what the list adds up. */
async function listedSpent() {
  const spent = await screen.findByText('Spent', { selector: 'dt' });
  return spent.nextElementSibling?.textContent;
}

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/overview-page'),
    import('@/modules/expenses/entries-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the overview', () => {
  it('sums up the month in figures and words', async () => {
    await open();

    const figures = await screen.findByText('Left over');
    expect(figures.nextElementSibling).toHaveTextContent('₹49,275');
    expect(screen.getByText('Spent', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '₹725',
    );
    expect(screen.getByText('Kept', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '98.6%',
    );
    // The skill's template, with money and the category's name in the user's language.
    expect(
      await screen.findByText(
        '₹725 spent in the month, 12% more than the same days of the month before. Most of it went on Transport (₹600).',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Quick summary')).toBeInTheDocument();
    expect(await screen.findByText('Heading for ₹2,795 by October 31')).toBeInTheDocument();
    expect(
      screen.getByText('₹725 spent so far · likely between ₹2,100 and ₹3,500 · last month ₹125'),
    ).toBeInTheDocument();
  });

  // A whole dashboard to check: give axe the time it needs on a loaded machine.
  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    const { container } = await open();
    await screen.findByText('Heading for ₹2,795 by October 31');
    await screen.findByRole('link', { name: 'Oct 7: ₹600' });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('asks the AI to write the summary again', async () => {
    const { user } = await open();

    await user.click(await screen.findByRole('button', { name: 'Write again' }));

    expect(await screen.findByText('Written again, by the AI.')).toBeInTheDocument();
    expect(screen.getByText('Written by AI')).toBeInTheDocument();
  });

  it('says why there is no summary, and turns AI on from there', async () => {
    fake.state.insight = insightOf({
      status: 'unavailable',
      reason: 'consent',
      mode: null,
      message_code: null,
    });
    await open();

    expect(await screen.findByText(/AI is off for your account/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn on the AI assistant' })).toBeInTheDocument();
  });

  it('opens the entries behind a category, with the same total', async () => {
    const { user, router } = await open();
    const categories = await screen.findByRole('list', { name: 'By category' });
    const transport = await within(categories).findByRole('link', { name: /Transport/ });
    expect(transport).toHaveTextContent('₹600');

    await user.click(transport);

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        '?show=expense&from=2026-10-01&to=2026-10-08&category=transport',
      );
    });
    expect(await screen.findByRole('link', { name: 'Bus pass' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Rice' })).toBeNull();
    await waitFor(async () => {
      expect(await listedSpent()).toBe('₹600');
    });
    expect(
      screen.getByRole('button', { name: 'Oct 1 – Oct 8', pressed: true }),
    ).toBeInTheDocument();
  });

  it('opens a place, which the list shows as a filter to remove', async () => {
    const { user } = await open();
    const places = await screen.findByRole('list', { name: 'Where it went' });

    await user.click(await within(places).findByRole('link', { name: /Big Bazaar/ }));

    const pill = await screen.findByRole('button', { name: 'Remove filter: At Big Bazaar' });
    await waitFor(async () => {
      expect(await listedSpent()).toBe('₹125');
    });
    await user.click(pill);
    expect(screen.queryByRole('button', { name: /At Big Bazaar/ })).toBeNull();
  });

  it('reads out each day, and opens one with Enter', async () => {
    const { user, router } = await open();
    const chart = await screen.findByRole('slider', { name: 'Spending per day' });

    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 8: ₹125');
    chart.focus();
    await user.keyboard('{ArrowLeft}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 7: ₹600');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(router.state.location.search).toBe('?show=expense&from=2026-10-07&to=2026-10-07');
    });
    await waitFor(async () => {
      expect(await listedSpent()).toBe('₹600');
    });
  });

  it('lays the days out by week, each opening its entries', async () => {
    await open();

    const day = await panel('Day by day').findByRole('link', { name: 'Oct 7: ₹600' });

    expect(day).toHaveAttribute('href', '/m/expenses?show=expense&from=2026-10-07&to=2026-10-07');
    expect(
      panel('Day by day').getByText('Busiest day: Wednesday, ₹300 on average.'),
    ).toBeInTheDocument();
  });

  it('points out unusual spending, leading to the entry', async () => {
    fake.state.entries.push(entryOf({ id: 'e-party', title: 'Party', amount_minor: 1500000 }));
    fake.state.unusual = [
      {
        entry_id: 'e-party',
        title: 'Party',
        date: '2026-10-08',
        category_id: 'groceries',
        amount_minor: 1500000,
        usual_minor: 12500,
        times_usual: 120,
      },
    ];
    await open();

    const party = await panel('Unusual spending').findByRole('link', { name: 'Party' });

    expect(party).toHaveAttribute('href', '/m/expenses/entries/e-party');
    expect(
      panel('Unusual spending').getByText('₹15,000 on Oct 8: 120× your usual ₹125 in Groceries'),
    ).toBeInTheDocument();
  });
});
