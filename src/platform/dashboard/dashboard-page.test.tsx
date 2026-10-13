import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Box } from 'lucide-react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { KpiData } from '@/core/dashboard/queries';
import { buildRegistry, ModuleRegistryContext } from '@/core/modules/registry';
import { defineModule } from '@/core/modules/types';
import { WidgetCard } from '@/platform/dashboard/widget-card';
import { errorEnvelope, server, testDashboard, testWidgets, tokenFor } from '@/test/msw';
import { renderApp, renderWithProviders } from '@/test/render';

const CHART = 'Assistant requests: use the arrow keys to read each day';

async function openDashboard(path = '/dashboard') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
  return view;
}

/** Record the query string of every dashboard request (own and all-users). */
function recordRequests() {
  const seen: string[] = [];
  server.use(
    http.get('*/api/v1/dashboard', ({ request }) => {
      seen.push(`mine${new URL(request.url).search}`);
      return HttpResponse.json(testDashboard());
    }),
    http.get('*/api/v1/admin/dashboard', ({ request }) => {
      seen.push(`all${new URL(request.url).search}`);
      return HttpResponse.json(testDashboard([testWidgets.actions]));
    }),
  );
  return seen;
}

beforeAll(async () => {
  await import('@/platform/dashboard/dashboard-page');
}, 120_000);

describe('dashboard', () => {
  it('shows a figure with its trend, a chart and a list', async () => {
    await openDashboard();

    const actions = await screen.findByRole('region', { name: 'Actions taken' });
    expect(within(actions).getByText('12', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(actions).getByText('+50% vs the 30 days before')).toBeInTheDocument();

    const requests = screen.getByRole('region', { name: 'Assistant requests' });
    expect(within(requests).getByText('7')).toBeInTheDocument(); // the period's total
    expect(within(requests).getByRole('slider', { name: CHART })).toHaveAttribute(
      'aria-valuetext',
      'Oct 8: 5',
    );

    const recent = screen.getByRole('region', { name: 'Recent activity' });
    expect(within(recent).getByText('Added Journal to favourites')).toBeInTheDocument();
    expect(within(recent).getByText('Rearranged your modules')).toBeInTheDocument();
    expect(within(recent).getByText('3 hours ago')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all your activity' })).toHaveAttribute(
      'href',
      '/activity',
    );
  });

  it('reads the chart day by day with the keyboard or the pointer', async () => {
    const { user } = await openDashboard();
    const chart = await screen.findByRole('slider', { name: CHART });

    chart.focus();
    await user.keyboard('{ArrowLeft}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 7: 0');
    await user.keyboard('{Home}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 6: 2');
    await user.keyboard('{ArrowLeft}'); // already at the first day
    expect(chart).toHaveAttribute('aria-valuenow', '0');
    await user.keyboard('{End}{Escape}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 8: 5');

    fireEvent.pointerMove(chart, { clientX: 0 });
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 6: 2');
    fireEvent.pointerLeave(chart);
    expect(chart).toHaveAttribute('aria-valuetext', 'Oct 8: 5');
  });

  it('offers the chart as a table', async () => {
    const { user } = await openDashboard();

    await user.click(await screen.findByText('View as table'));

    const table = screen.getByRole('table', { name: 'Assistant requests' });
    expect(within(table).getAllByRole('row')).toHaveLength(4); // heading + three days
    expect(within(table).getByRole('row', { name: 'Oct 7 0' })).toBeInTheDocument();
  });

  it("asks for the chosen period, counted in the user's time zone", async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-08T20:00:00Z') }); // 9th in Kolkata
    const seen = recordRequests();
    const { user, router } = await openDashboard();
    await screen.findByRole('region', { name: 'Actions taken' });

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));

    await waitFor(() => {
      expect(seen).toEqual([
        'mine?from=2026-09-10&to=2026-10-09',
        'mine?from=2026-10-03&to=2026-10-09',
      ]);
    });
    expect(router.state.location.search).toBe('?range=7');
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    vi.useRealTimers();
  });

  it('says so when one widget could not load, and still shows the rest', async () => {
    server.use(
      http.get('*/api/v1/dashboard', () =>
        HttpResponse.json(
          testDashboard([{ ...testWidgets.actions, data: null }, testWidgets.recent]),
        ),
      ),
    );
    await openDashboard();

    const actions = await screen.findByRole('region', { name: 'Actions taken' });
    expect(
      within(actions).getByText("Couldn't load this one. The rest is up to date."),
    ).toBeInTheDocument();
    expect(screen.getByText('Added Journal to favourites')).toBeInTheDocument();
  });

  it('lets an admin switch to totals across all users', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ role: 'admin' }))),
    );
    const seen = recordRequests();
    const { user, router } = await openDashboard();

    await user.click(await screen.findByRole('switch', { name: 'All users' }));

    await waitFor(() => {
      expect(seen.at(-1)).toMatch(/^all\?from=/);
    });
    expect(router.state.location.search).toBe('?view=all');
    expect(
      await screen.findByText(/^Totals across every user, with no individual records/),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Recent activity' })).toBeNull();
    });
  });

  it('never asks for all users on behalf of someone who is not an admin', async () => {
    const seen = recordRequests();
    await openDashboard('/dashboard?view=all');

    await screen.findByRole('region', { name: 'Actions taken' });
    expect(screen.queryByRole('switch', { name: 'All users' })).toBeNull();
    expect(seen.every((request) => request.startsWith('mine'))).toBe(true);
  });

  it('explains a failed load and retries', async () => {
    server.use(
      http.get(
        '*/api/v1/dashboard',
        () => HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
        { once: true },
      ),
    );
    const { user } = await openDashboard();

    expect(await screen.findByText("We couldn't load your dashboard.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('region', { name: 'Actions taken' })).toBeInTheDocument();
  });

  it('says when there is nothing to show yet', async () => {
    server.use(http.get('*/api/v1/dashboard', () => HttpResponse.json(testDashboard([]))));
    await openDashboard();

    expect(await screen.findByText('Nothing to show yet')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    await openDashboard();
    await screen.findByRole('region', { name: 'Recent activity' });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('a module widget', () => {
  const demo = defineModule({
    key: 'demo_notes',
    icon: Box,
    accent: 'teal',
    strings: {
      en: {
        name: 'Demo notes',
        tagline: 'Jot',
        description: 'Demo.',
        widgets: { demo_notes_spent: 'Spent on notebooks' },
      },
    },
  });
  const registry = buildRegistry({ '/src/modules/demo-notes/manifest.ts': { default: demo } });

  function renderCard(key: string, data: KpiData) {
    renderWithProviders(
      <ModuleRegistryContext value={registry}>
        <WidgetCard widget={{ key, owner: 'demo_notes', kind: 'kpi', data }} days={30} />
      </ModuleRegistryContext>,
    );
  }

  it('is titled by its module, and formats money', () => {
    renderCard('demo_notes_spent', {
      kind: 'kpi',
      value: 4320,
      previous: 0,
      format: 'currency',
      currency: 'INR',
    });

    const card = screen.getByRole('region', { name: 'Demo notes · Spent on notebooks' });
    expect(within(card).getByText('₹4,320', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(card).getByText('Nothing in the 30 days before')).toBeInTheDocument();
  });

  it('falls back to its key when the module has not named it', () => {
    renderCard('demo_notes_count', { kind: 'kpi', value: 3, format: 'number' });

    const card = screen.getByRole('region', { name: 'Demo notes · demo_notes_count' });
    expect(within(card).queryByText(/before$/)).toBeNull(); // no previous figure, no trend line
  });
});
