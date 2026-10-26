import { act, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { setWideScreen } from '@/test/media';
import { resetNotificationState, signedOut } from '@/test/msw';
import { renderApp } from '@/test/render';

function destinations(nav: HTMLElement) {
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.getAttribute('href'));
}

beforeAll(async () => {
  await Promise.all([
    import('@/platform/welcome/welcome-page'),
    import('@/platform/dashboard/dashboard-page'),
    import('@/platform/auth/login-page'),
  ]);
}, 120_000);

describe('main navigation', () => {
  it('is a bottom bar with Home on phones, and counts unread notifications', async () => {
    const { user, router } = renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });

    expect(destinations(nav)).toEqual(['/', '/dashboard', '/notifications']);
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    const bell = await within(nav).findByRole('link', { name: 'Notifications (1 unread)' });

    await user.click(within(nav).getByRole('link', { name: 'Dashboard' }));
    // The router moves first; the links follow on the next render.
    await waitFor(() => {
      expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(bell).not.toHaveAttribute('aria-current');
  });

  it('highlights the current page only, with decoration hidden from assistive tech', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    const highlight = (name: string) =>
      within(nav).getByRole('link', { name }).querySelector('.bg-primary\\/10');

    expect(highlight('Home')).toHaveAttribute('aria-hidden', 'true');
    expect(highlight('Dashboard')).toBeNull();
    expect(nav.querySelectorAll('.bg-primary\\/10')).toHaveLength(1);
  });

  it('moves into the header on wider screens, where the logo leads home', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(nav.closest('header')).toBeNull();

    act(() => {
      setWideScreen(true);
    });

    // The bar may still be there for a moment: wait for the nav to have moved.
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Main' }).closest('header')).not.toBeNull();
    });
    const headerNav = screen.getByRole('navigation', { name: 'Main' });
    expect(destinations(headerNav)).toEqual(['/dashboard', '/notifications']);
  });

  it('caps the badge at a glanceable size', async () => {
    resetNotificationState(
      Array.from({ length: 12 }, (_, index) => ({
        id: `n-${index}`,
        type: 'module.launched',
        params: { module: 'medicine' },
        read: false,
        at: '2026-10-08T10:00:00Z',
      })),
    );
    renderApp('/');

    const busy = await screen.findByRole('link', { name: 'Notifications (12 unread)' });
    expect(within(busy).getByText('9+')).toBeInTheDocument();
  });

  it('shows no badge when everything is read', async () => {
    resetNotificationState([]);
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });

    const bell = await screen.findByRole('link', { name: 'Notifications' });
    expect(bell).toHaveTextContent(/^Notifications$/);
  });

  it('is not shown to signed-out visitors', async () => {
    signedOut();
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  });
});
