import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MODULE_ACTION, type RunInput } from '@/core/agents/queries';
import { matchesFrom } from '@/modules/expenses/matches';
import { seriesOf } from '@/modules/expenses/price-series';
import { entryOf, fakeExpenses, productOf, purchaseOf } from '@/modules/expenses/testing/fake-api';
import { server, testRun } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z');
const TOMATO = productOf();
const THAKKALI = productOf({
  id: 'p-thakkali',
  name: 'Thakkali',
  aliases: ['thakkali'],
  purchases: [
    purchaseOf({
      entry_id: 'e-thakkali',
      date: '2026-09-30',
      amount_minor: 3800,
      unit_price_minor: 3800,
    }),
  ],
});
const MILK = productOf({
  id: 'p-milk',
  name: 'Milk',
  aliases: ['milk'],
  dimension: 'volume',
  price_unit: 'l',
  purchases: [
    purchaseOf({
      entry_id: 'e-milk-1',
      date: '2026-10-02',
      merchant: 'Aavin',
      unit: 'l',
      amount_minor: 3000,
      unit_price_minor: 3000,
    }),
    purchaseOf({
      entry_id: 'e-milk-2',
      date: '2026-10-06',
      merchant: 'Aavin',
      unit: 'l',
      amount_minor: 2700,
      unit_price_minor: 2700,
    }),
  ],
});

let fake: ReturnType<typeof fakeExpenses>;
let asked: RunInput[];

function answerWith(matches: unknown[]) {
  server.use(
    http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
      asked.push((await request.json()) as RunInput);
      const client_actions = matches.length
        ? [{ tool: 'expenses_product_matches', arguments: { matches } }]
        : [];
      return HttpResponse.json(testRun({ skill: 'tidy-products', proposals: [], client_actions }), {
        status: 201,
      });
    }),
  );
}

async function openPrices() {
  const view = renderApp('/m/expenses/prices');
  await screen.findByRole('heading', { level: 1, name: 'Prices' });
  return view;
}

async function openProduct(id = TOMATO.id, name = TOMATO.name) {
  const view = renderApp(`/m/expenses/prices/${id}`);
  await screen.findByRole('heading', { level: 1, name });
  return view;
}

const sent = (method: string) => fake.requests.filter((request) => request.method === method);

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/prices-page'),
    import('@/modules/expenses/product-page'),
    import('@/modules/expenses/entry-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses(undefined, [TOMATO, THAKKALI, MILK]);
  asked = [];
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('prices', () => {
  it('lists what is bought with its price per unit, how it moved and where it is cheapest', async () => {
    const { container } = await openPrices();

    const tomato = (await screen.findByRole('link', { name: 'Tomato' })).closest('li');
    const milk = screen.getByRole('link', { name: 'Milk' }).closest('li');
    expect(tomato).toHaveTextContent('₹35/kg');
    expect(tomato).toHaveTextContent('Down 30%');
    expect(tomato).toHaveTextContent('3 purchases');
    expect(tomato).toHaveTextContent('Cheapest at A');
    expect(milk).toHaveTextContent('₹27/litre');
    expect(milk).toHaveTextContent('Last bought Oct 6 at Aavin');
    expect(screen.getByRole('link', { name: 'Prices', current: 'page' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('says how to start when nothing is priced yet', async () => {
    server.use(...fakeExpenses(undefined, []).handlers);
    await openPrices();

    expect(await screen.findByText('No prices yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Find matches' })).toBeNull();
  });

  it('suggests one thing under two names, and combines only when told to', async () => {
    answerWith([{ product_id: TOMATO.id, products: [THAKKALI.id], titles: ['Tomatoes'] }]);
    const { user } = await openPrices();

    await user.click(await screen.findByRole('button', { name: 'Find matches' }));

    const panel = within(
      await screen.findByRole('region', { name: 'These look like the same thing' }),
    );
    expect(panel.getByText('Thakkali')).toBeInTheDocument();
    expect(panel.getByText('“Tomatoes”')).toBeInTheDocument();
    expect(asked).toEqual([
      { input: 'Find products that are the same thing', skill: 'tidy-products', locale: 'en' },
    ]);
    expect(sent('POST')).toEqual([]);

    await user.click(panel.getByRole('button', { name: 'Combine into Tomato' }));

    expect(await screen.findByText('Combined into Tomato')).toBeInTheDocument();
    // Names first, then the merge (which adds the other product's names on the server).
    expect(
      fake.requests
        .filter((request) => request.method !== 'GET')
        .map((r) => [r.method, r.path, r.body]),
    ).toEqual([
      ['PATCH', '/products/p-tomato', { aliases: ['tomato', 'Tomatoes'] }],
      ['POST', '/products/p-tomato/merge', { product_id: 'p-thakkali' }],
    ]);
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'These look like the same thing' })).toBeNull();
    });
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Thakkali' })).toBeNull();
    });
  });

  it('remembers when two things are not the same, and says when nothing matches', async () => {
    answerWith([{ product_id: TOMATO.id, products: [THAKKALI.id] }]);
    const { user } = await openPrices();
    await user.click(await screen.findByRole('button', { name: 'Find matches' }));
    const panel = within(
      await screen.findByRole('region', { name: 'These look like the same thing' }),
    );

    await user.click(panel.getByRole('button', { name: 'Not the same' }));

    expect(await screen.findByText('Got it: they stay apart')).toBeInTheDocument();
    expect(sent('POST').map((request) => [request.path, request.body])).toEqual([
      ['/products/p-tomato/apart', { product_id: 'p-thakkali' }],
    ]);

    answerWith([]);
    await user.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(
      await screen.findByText('Nothing looks like the same thing under another name.'),
    ).toBeInTheDocument();
  });
});

describe('matches prepared by the assistant', () => {
  it('arrive with the page when the command palette opens it', async () => {
    const { router } = await openPrices();
    const action = {
      tool: 'expenses_product_matches',
      arguments: { matches: [{ product_id: TOMATO.id, products: [THAKKALI.id] }] },
    };

    await act(() => router.navigate('/m/expenses/prices', { state: { [MODULE_ACTION]: action } }));

    const panel = within(
      await screen.findByRole('region', { name: 'These look like the same thing' }),
    );
    expect(panel.getByText('Thakkali')).toBeInTheDocument();
  });

  it('are taken only in the shape expected', () => {
    const action = {
      tool: 'expenses_product_matches',
      arguments: {
        matches: [
          { product_id: 'p-1', products: ['p-2', 3], titles: 'not a list' },
          { product_id: 'p-3' }, // nothing to combine
          'not a match',
          { products: ['p-4'] }, // no product to keep
        ],
      },
    };

    expect(matchesFrom(action)).toMatchObject([
      { product_id: 'p-1', products: ['p-2'], titles: [] },
    ]);
    expect(matchesFrom({ tool: 'expenses_draft', arguments: { matches: [] } })).toEqual([]);
  });
});

describe('a product', () => {
  it('shows what it cost each time, where, and the figures drawn from that', async () => {
    const { container, user } = await openProduct();

    const stats = within(screen.getByRole('region', { name: 'Prices' }));
    expect(stats.getByText('Last price').nextElementSibling).toHaveTextContent('₹35/kg');
    expect(stats.getByText('Down 30%')).toBeInTheDocument();
    expect(stats.getByText('Lowest').nextElementSibling).toHaveTextContent('₹35/kg');
    expect(stats.getByText('Highest').nextElementSibling).toHaveTextContent('₹50/kg');
    expect(stats.getByText('Cheapest at A: ₹40/kg on average')).toBeInTheDocument();

    const purchases = within(screen.getByRole('table'));
    const rows = purchases.getAllByRole('row').slice(1);
    const cells = rows.map((row) => within(row).getAllByRole('cell'));
    // Date, where, how much, paid, per unit (on phones how much and paid sit under the place).
    expect(cells.map(([day, place]) => [day?.textContent, place?.firstChild?.textContent])).toEqual(
      [
        ['Oct 7, 2026', 'Not noted'],
        ['Oct 4, 2026', 'B'],
        ['Oct 1, 2026', 'A'],
      ],
    );
    expect(cells.map((row) => row.slice(2).map((cell) => cell.textContent))).toEqual([
      ['2 kg', '₹70', '₹35'],
      ['500 g', '₹25', '₹50'],
      ['1 kg', '₹40', '₹40'],
    ]);
    expect(cells[0]?.[1]).toHaveTextContent('2 kg · ₹70');
    expect(purchases.getByRole('link', { name: 'Oct 4, 2026' })).toHaveAttribute(
      'href',
      '/m/expenses/entries/e-tomato-2',
    );

    // The chart reads out each purchase; a line per place, named in the legend.
    const chart = screen.getByRole('slider', { name: 'Explore the price of Tomato' });
    expect(chart).toHaveAttribute('aria-valuetext', '₹35/kg, Oct 7, Not noted');
    chart.focus();
    await user.keyboard('{Home}');
    expect(chart).toHaveAttribute('aria-valuetext', '₹40/kg, Oct 1, A');
    await user.keyboard('{ArrowRight}');
    expect(chart).toHaveAttribute('aria-valuetext', '₹50/kg, Oct 4, B');
    fireEvent.keyDown(chart, { key: 'Escape' });
    expect(chart).toHaveAttribute('aria-valuetext', '₹35/kg, Oct 7, Not noted');
    const legend = within(screen.getByRole('region', { name: 'Price per kg' })).getAllByRole(
      'listitem',
    );
    expect(legend.map((item) => item.textContent)).toEqual(['A(1)', 'B(1)', 'Not noted(1)']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sets a price alert, learns another name and changes its price unit', async () => {
    const { user } = await openProduct();
    const settings = within(screen.getByRole('region', { name: 'Settings' }));

    await user.type(
      settings.getByRole('textbox', { name: 'Tell me when it costs more than (INR per kg)' }),
      '45',
    );
    await user.click(settings.getByRole('button', { name: 'Set alert' }));
    expect(await screen.findByText('Price alert set for Tomato')).toBeInTheDocument();
    expect(
      await settings.findByText("You'll be told when it costs more than ₹45/kg."),
    ).toBeInTheDocument();

    await user.type(settings.getByRole('textbox', { name: 'Add a name' }), 'தக்காளி');
    await user.click(settings.getByRole('button', { name: 'Add' }));
    expect(await settings.findByRole('button', { name: 'Remove தக்காளி' })).toBeInTheDocument();

    await user.selectOptions(settings.getByRole('combobox', { name: 'Show prices per' }), 'g');

    await waitFor(() => {
      expect(sent('PATCH').map((request) => request.body)).toEqual([
        { alert_above_minor: 4500 },
        { aliases: ['tomato', 'தக்காளி'] },
        { price_unit: 'g' },
      ]);
    });
  });

  it('combines another product into it, or stops being followed', async () => {
    const { user } = await openProduct();
    const settings = within(screen.getByRole('region', { name: 'Settings' }));

    await user.selectOptions(
      await settings.findByRole('combobox', { name: 'Product' }),
      'Thakkali',
    );
    await user.click(settings.getByRole('button', { name: 'Combine' }));
    expect(await screen.findByText('Thakkali is now part of Tomato')).toBeInTheDocument();

    await user.click(settings.getByRole('button', { name: 'Stop following' }));
    expect(
      settings.getByText('Stop following Tomato? Its entries stay as they are.'),
    ).toBeInTheDocument();
    await user.click(
      within(settings.getByRole('alert')).getByRole('button', { name: 'Stop following' }),
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Prices' })).toBeInTheDocument();
    expect(sent('DELETE').map((request) => request.path)).toEqual(['/products/p-tomato']);
  });

  it('draws a line per place, folding the least visited into one', () => {
    const places = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((merchant, index) =>
      Array.from({ length: 6 - index }, (_, n) =>
        purchaseOf({ entry_id: `${merchant}${String(n)}`, merchant }),
      ),
    );

    const series = seriesOf(places);

    expect(series.map((line) => [line.name, line.other, line.points.length])).toEqual([
      ['A', false, 6],
      ['B', false, 5],
      ['C', false, 4],
      ['D', false, 3],
      [null, true, 3], // E and F
    ]);
  });
});

describe('an entry of something bought', () => {
  it('says what it came to per unit and leads to its price history', async () => {
    fake.state.entries.push(
      entryOf({ id: 'e-t', title: 'Tomato', quantity: 2, unit: 'kg', amount_minor: 7000 }),
    );
    renderApp('/m/expenses/entries/e-t');
    await screen.findByRole('heading', { level: 1, name: 'Tomato' });

    expect(await screen.findByText('Bought 2 kg · ₹35/kg')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Tomato price history' })).toHaveAttribute(
      'href',
      '/m/expenses/prices/p-tomato',
    );
  });

  it('starts following the price of something new', async () => {
    const { user } = renderApp('/m/expenses/entries/e-rice');
    await screen.findByRole('heading', { level: 1, name: 'Rice' });

    await user.click(await screen.findByRole('button', { name: 'Follow its price' }));

    expect(await screen.findByText('Following the price of Rice')).toBeInTheDocument();
    // The entry and its new product share a title: the product page is the one with prices.
    expect(await screen.findByRole('link', { name: 'All prices' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Rice' })).toBeInTheDocument();
    expect(sent('POST').map((request) => request.body)).toEqual([{ title: 'Rice' }]);
  });
});
