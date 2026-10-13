import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import type { RouteObject } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { AppLayout } from '@/platform/shell/app-layout';
import { AppErrorBoundary } from '@/platform/shell/app-error-boundary';
import { RouteErrorPage } from '@/platform/shell/route-error-page';
import { errorEnvelope, server } from '@/test/msw';
import { renderApp, renderWithProviders } from '@/test/render';

// Compile the lazy Welcome page once up front, so the first test doesn't pay for it.
beforeAll(async () => {
  await import('@/platform/welcome/welcome-page');
}, 120_000);

describe('app shell', () => {
  it('renders the welcome page with live API and database status', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { level: 1, name: /, Asha$/ })).toBeInTheDocument();
    const status = screen.getByRole('region', { name: 'System status' });
    expect(await within(status).findByText('Online')).toBeInTheDocument();
    expect(within(status).getByText('Version 0.1.0')).toBeInTheDocument();
    expect(await within(status).findByText('Ready')).toBeInTheDocument();
  });

  it('shows a translated reason when the database is not ready', async () => {
    server.use(
      http.get('*/api/readyz', () =>
        HttpResponse.json(errorEnvelope('SERVICE_NOT_READY', 'not ready'), { status: 503 }),
      ),
    );
    renderApp('/');

    const status = await screen.findByRole('region', { name: 'System status' });
    expect(await within(status).findByText('Not ready')).toBeInTheDocument();
    expect(
      within(status).getByText('The server is starting up. Please try again shortly.'),
    ).toBeInTheDocument();
  });

  it('offers a skip link to the main landmark', async () => {
    renderApp('/');

    const skip = await screen.findByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/');
    await screen.findByText('Ready');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('switches language and remembers it', async () => {
    const { user } = renderApp('/');
    await screen.findByRole('heading', { level: 1 });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ta');

    expect(
      await screen.findByRole('heading', { level: 1, name: /வணக்கம், Asha$/ }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ta');
    expect(localStorage.getItem('tt-language')).toBe('ta');
  });

  it('cycles the theme with an accessible, state-describing toggle', async () => {
    const { user } = renderApp('/');
    const toggle = await screen.findByRole('button', {
      name: 'Theme: System. Switch to Light.',
    });

    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark.' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('renders a not-found page for unknown paths', async () => {
    renderApp('/no/such/page');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
  });
});

describe('error handling', () => {
  function Boom(): never {
    throw new Error('render failure');
  }

  it('shows the generic fallback when a route throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const routes: RouteObject[] = [
      {
        path: '/',
        element: <AppLayout />,
        errorElement: <RouteErrorPage />,
        children: [{ index: true, element: <Boom /> }],
      },
    ];
    renderApp('/', routes);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.queryByText('render failure')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it('shows the not-found page for router 404s', async () => {
    renderApp('/missing', [{ path: '/', element: <p>home</p>, errorElement: <RouteErrorPage /> }]);

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('catches render errors outside the router', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});
