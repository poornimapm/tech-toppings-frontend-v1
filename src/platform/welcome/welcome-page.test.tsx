import { screen, waitFor, within } from '@testing-library/react';
import { Box } from 'lucide-react';
import { http, HttpResponse } from 'msw/http';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/core/i18n';
import { buildRegistry, moduleRegistry, type ModuleRegistry } from '@/core/modules/registry';
import { ModuleRegistryContext } from '@/core/modules/registry';
import { defineModule } from '@/core/modules/types';
import { WelcomePage } from '@/platform/welcome/welcome-page';
import {
  errorEnvelope,
  moduleState,
  resetModuleState,
  server,
  testModules,
  tokenFor,
} from '@/test/msw';
import { renderWithProviders } from '@/test/render';

// 08:30 in Kolkata (the test user's time zone).
const MORNING = new Date('2026-10-09T03:00:00Z');

function renderWelcome(registry: ModuleRegistry = moduleRegistry, path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <ModuleRegistryContext value={registry}>
            <WelcomePage />
          </ModuleRegistryContext>
        ),
      },
      { path: '/m/demo-notes', element: <p>Demo notes page</p> },
    ],
    { initialEntries: [path] },
  );
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
}

/** The tile (article) for a module, by its visible name. */
async function tile(name: string) {
  const heading = await screen.findByRole('heading', { level: 3, name });
  const article = heading.closest('article');
  if (!article) throw new Error(`no tile for ${name}`);
  return article;
}

function section(name: string) {
  return screen.getByRole('region', { name });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: MORNING });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('welcome page', () => {
  it('greets the user for the time of day in their time zone', async () => {
    renderWelcome();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Good morning, Asha' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Friday, October 9')).toBeInTheDocument();
    expect(await screen.findByText('7 modules · 1 favourite')).toBeInTheDocument();
  });

  it('shows every module in the state it is in', async () => {
    renderWelcome();

    const expenses = await tile('Expenses');
    expect(within(expenses).getByText('₹4,320', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(expenses).getByText('this month')).toBeInTheDocument();
    expect(within(await tile('Medicine')).getByText('Beta')).toBeInTheDocument();
    expect(within(await tile('Receipts & warranty')).getByText('Coming soon')).toBeInTheDocument();
    const locked = await tile('Government documents');
    expect(within(locked).getByText('Turned off')).toBeInTheDocument();
    expect(within(locked).getByText('Turned off by your administrator')).toBeInTheDocument();
    expect(within(section('Favourites')).getByText('Study helper')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Meal planner' })).toBeNull();
    expect(screen.getByText('Hidden modules (1)')).toBeInTheDocument();
  });

  it('shows placeholders while loading and a retry when loading fails', async () => {
    let fail = true;
    server.use(
      http.get('*/api/v1/modules', () =>
        fail
          ? HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 })
          : HttpResponse.json({
              items: testModules,
              page: 1,
              page_size: 100,
              total: testModules.length,
              has_next: false,
            }),
      ),
    );
    const { user } = renderWelcome();

    expect(await screen.findByText("We couldn't load your modules.")).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await tile('Expenses')).toBeInTheDocument();
  });

  it('searches names and keywords, with a friendly empty state', async () => {
    const { user } = renderWelcome();
    await tile('Expenses');

    await user.type(screen.getByRole('searchbox', { name: 'Search modules' }), 'bills');

    expect(await tile('Receipts & warranty')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Expenses' })).toBeNull();

    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(await screen.findByText('Nothing matches “billszzz”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all modules' }));
    expect(await tile('Expenses')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('focuses search with the / shortcut and clears it with Escape', async () => {
    const { user } = renderWelcome();
    await tile('Expenses');

    await user.keyboard('/');
    const search = screen.getByRole('searchbox', { name: 'Search modules' });
    expect(search).toHaveFocus();
    await user.keyboard('journal');
    expect(search).toHaveValue('journal');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
  });

  it('filters with counted chips and keeps the filter in the address', async () => {
    const { user, router } = renderWelcome();
    await tile('Expenses');

    const filters = screen.getByRole('group', { name: 'Show' });
    await user.click(within(filters).getByRole('button', { name: /Ready to use/ }));

    expect(within(filters).getByRole('button', { name: 'Ready to use (2)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(router.state.location.search).toBe('?show=available');
    expect(screen.queryByRole('heading', { level: 3, name: 'Journal' })).toBeNull();
    expect(await tile('Medicine')).toBeInTheDocument();
  });

  it('opens with the filter from the address', async () => {
    renderWelcome(moduleRegistry, '/?show=favourites');

    expect(await tile('Study helper')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Expenses' })).toBeNull();
  });

  it('pins a module into favourites, with undo', async () => {
    const { user } = renderWelcome();

    await user.click(
      within(await tile('Journal')).getByRole('button', { name: 'Add Journal to favourites' }),
    );

    expect(await screen.findByText('Journal added to favourites')).toBeInTheDocument();
    expect(within(section('Favourites')).getByText('Journal')).toBeInTheDocument();
    expect(moduleState.find((view) => view.key === 'journal')?.pinned).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(moduleState.find((view) => view.key === 'journal')?.pinned).toBe(false);
    });
    expect(within(section('All modules')).getByText('Journal')).toBeInTheDocument();
  });

  it('rolls back and says so when a change cannot be saved', async () => {
    server.use(
      http.patch('*/api/v1/modules/:key/preferences', () =>
        HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
      ),
    );
    const { user } = renderWelcome();

    await user.click(
      within(await tile('Habit tracker')).getByRole('button', {
        name: 'Add Habit tracker to favourites',
      }),
    );

    expect(
      await screen.findByText("Couldn't save that change. Please try again."),
    ).toBeInTheDocument();
    expect(
      within(await tile('Habit tracker')).getByRole('button', {
        name: 'Add Habit tracker to favourites',
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('asks to be notified about an upcoming module from its details', async () => {
    const { user } = renderWelcome();

    await user.click(
      within(await tile('Receipts & warranty')).getByRole('button', {
        name: 'Receipts & warranty',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Receipts & warranty' });
    const notify = within(dialog).getByRole('switch', { name: 'Notify me when it launches' });
    await user.click(notify);

    expect(
      await screen.findByText("We'll let you know when Receipts & warranty launches."),
    ).toBeInTheDocument();
    expect(notify).toHaveAttribute('aria-checked', 'true');
    expect(moduleState.find((view) => view.key === 'receipts')?.notify_requested).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(within(await tile('Receipts & warranty')).getByText("We'll notify you")).toBeVisible();
  });

  it('opens module details from a link and closes back to the page', async () => {
    const { user, router } = renderWelcome(moduleRegistry, '/?module=receipts');

    expect(await screen.findByRole('dialog', { name: 'Receipts & warranty' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(router.state.location.search).toBe('');
  });

  it('arranges and hides modules in customize mode', async () => {
    const { user } = renderWelcome();
    await tile('Expenses');

    await user.click(screen.getByRole('button', { name: 'Customize' }));
    expect(screen.getByRole('button', { name: 'Move Expenses earlier' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Move Expenses later' }));

    await waitFor(() => {
      expect(moduleState.find((view) => view.key === 'expenses')?.position).toBe(1);
    });
    expect(moduleState.find((view) => view.key === 'medicine')?.position).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Hide Medicine' }));
    expect(await screen.findByText('Medicine is hidden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show Medicine' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Hidden modules (2)')).toBeInTheDocument();
  });

  it('brings a hidden module back', async () => {
    const { user } = renderWelcome();
    await tile('Expenses');

    await user.click(screen.getByText('Hidden modules (1)'));
    await user.click(screen.getByRole('button', { name: 'Show Meal planner' }));

    expect(await tile('Meal planner')).toBeInTheDocument();
    expect(await screen.findByText('Meal planner is back on your page')).toBeInTheDocument();
  });

  it('speaks the user’s language', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ locale: 'ta' }))),
    );
    await i18n.changeLanguage('ta');
    renderWelcome();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'காலை வணக்கம், Asha' }),
    ).toBeInTheDocument();
    expect(await tile('செலவுகள்')).toBeInTheDocument();
  });

  it('shows a newly added module folder with no other change', async () => {
    const demo = defineModule({
      key: 'demo_notes',
      icon: Box,
      accent: 'teal',
      strings: { en: { name: 'Demo notes', tagline: 'Jot it down', description: 'Demo.' } },
      routes: [{ index: true, element: <p>Demo notes page</p> }],
    });
    const registry = buildRegistry({
      ...Object.fromEntries(
        moduleRegistry
          .all()
          .map((definition) => [
            `/src/modules/${definition.key.replaceAll('_', '-')}/manifest.ts`,
            { default: definition },
          ]),
      ),
      '/src/modules/demo-notes/manifest.ts': { default: demo },
    });
    resetModuleState([
      ...testModules,
      {
        ...testModules[0],
        key: 'demo_notes',
        slug: 'demo-notes',
        position: 8,
        stat: null,
      } as (typeof testModules)[number],
    ]);
    const { user, router } = renderWelcome(registry);

    const link = within(await tile('Demo notes')).getByRole('link', { name: 'Demo notes' });
    await user.click(link);

    expect(router.state.location.pathname).toBe('/m/demo-notes');
    expect(await screen.findByText('Demo notes page')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations, with or without the dialog', async () => {
    const { container, user } = renderWelcome();
    await tile('Expenses');

    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(await tile('Journal')).getByRole('button', { name: 'Journal' }));
    await screen.findByRole('dialog');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
