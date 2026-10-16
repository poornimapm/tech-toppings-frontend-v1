import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { components } from '@/core/api/schema';
import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

type Report = components['schemas']['MonthlyReportOut'];

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
let asked: string[];

function reportOf(month: string, spent = 180000): Report {
  const span = { start: `${month}-01`, end: `${month}-30` };
  const totals = { spent_minor: spent, received_minor: 5000000, net_minor: 5000000 - spent };
  return {
    month,
    summary: {
      ...span,
      ...totals,
      count: spent ? 4 : 0,
      currency: 'INR',
      days: 30,
      avg_daily_spent_minor: 6000,
      savings_rate_pct: 96.4,
      previous: { start: '2026-08-01', end: '2026-08-30' },
      previous_totals: { spent_minor: 100000, received_minor: 0, net_minor: -100000, count: 1 },
      spent_change_pct: 80,
      received_change_pct: null,
    },
    categories: [
      {
        category_id: 'groceries',
        amount_minor: 150000,
        count: 2,
        share_pct: 83.3,
        previous_minor: 100000,
        change_pct: 50,
      },
      {
        category_id: 'transport',
        amount_minor: 30000,
        count: 1,
        share_pct: 16.7,
        previous_minor: 0,
        change_pct: null,
      },
    ],
    income: [{ category_id: 'salary', amount_minor: 5000000, count: 1, share_pct: 100 }],
    merchants: [{ merchant: 'Metro', amount_minor: 30000, count: 1, share_pct: 16.7 }],
    people: [{ name: 'Amma', amount_minor: 50000, count: 1, share_pct: 27.8 }],
    days: [],
    largest: [],
  };
}

async function open(path = '/m/expenses/report') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1 });
  return view;
}

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/report-page'),
    import('@/modules/expenses/overview-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  asked = [];
  server.use(
    ...fakeExpenses().handlers,
    http.get('*/api/v1/expenses/reports/monthly', ({ request }) => {
      const month = new URL(request.url).searchParams.get('month') ?? '';
      asked.push(month);
      return HttpResponse.json(reportOf(month, month === '2026-08' ? 0 : 180000));
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('monthly report', () => {
  it('shows this month against the one before, ready to print', async () => {
    await open();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Report for October 2026');
    expect(await screen.findByText('Spent', { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByText('Spent', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '₹1,800',
    );
    expect(screen.getByText('96.4% of what came in')).toBeInTheDocument();
    expect(asked).toEqual(['2026-10']);

    const where = within(screen.getByRole('region', { name: 'Where it went' }));
    await where.findByText('Groceries'); // once categories are in
    const [, groceries, transport] = where.getAllByRole('row');
    expect(groceries).toHaveTextContent('Groceries₹1,50083.3%₹1,000Up 50%');
    expect(transport).toHaveTextContent('Transport₹30016.7%₹0');
    expect(screen.getByText('Metro')).toBeInTheDocument();
    expect(screen.getByText('Amma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month after' })).toBeDisabled();
  });

  it('goes back a month, and says when a month has nothing', async () => {
    const { user, router } = await open();
    await screen.findByText('Spent', { selector: 'dt' });
    await user.click(screen.getByRole('button', { name: 'Month before' }));
    await waitFor(() => {
      expect(router.state.location.search).toBe('?month=2026-09');
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Report for September 2026' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Month before' }));
    expect(await screen.findByText('Nothing in August 2026')).toBeInTheDocument();
    expect(asked).toEqual(['2026-10', '2026-09', '2026-08']);
  });

  it('prints, and downloads the figures as CSV', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      names.push(this.download);
    });
    server.use(
      http.get(
        '*/api/v1/expenses/reports/monthly.csv',
        () =>
          new HttpResponse('﻿section,name\r\n', {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="expenses-report-2026-10.csv"',
            },
          }),
      ),
    );
    const { user } = await open();
    await screen.findByText('Spent', { selector: 'dt' });
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(await screen.findByText('Downloaded expenses-report-2026-10.csv.')).toBeInTheDocument();
    expect(names).toEqual(['expenses-report-2026-10.csv']);
  });

  it('is reached from the overview', async () => {
    renderApp('/m/expenses/overview');
    expect(await screen.findByRole('link', { name: 'Monthly report' })).toHaveAttribute(
      'href',
      '/m/expenses/report',
    );
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    await open();
    await screen.findByText('Spent', { selector: 'dt' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
