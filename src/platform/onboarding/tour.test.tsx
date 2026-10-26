import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { shouldShowTour, useTour } from '@/platform/onboarding/tour-store';
import { server, testUser, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

beforeAll(async () => {
  await Promise.all([
    import('@/platform/onboarding/tour'),
    import('@/platform/welcome/welcome-page'),
    import('@/platform/palette/command-palette'),
  ]);
}, 120_000);

afterEach(() => {
  useTour.setState({ seen: [], requested: false });
});

/** Signed in with an account made just now. */
function newAccount() {
  const created = new Date().toISOString();
  server.use(
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ created_at: created }))),
  );
}

describe('the tour', () => {
  it('greets a new account step by step, then not again', async () => {
    newAccount();
    const { user, container } = renderApp('/');
    let dialog = within(await screen.findByRole('dialog', { name: 'Welcome! This is your home' }));
    expect(dialog.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(await axe(container.ownerDocument.body)).toHaveNoViolations();

    await user.click(dialog.getByRole('button', { name: 'Next' }));
    dialog = within(await screen.findByRole('dialog', { name: 'Find anything, or just ask' }));
    await user.click(dialog.getByRole('button', { name: 'Back' }));
    dialog = within(await screen.findByRole('dialog', { name: 'Welcome! This is your home' }));
    for (let step = 1; step < 5; step += 1) {
      await user.click(dialog.getByRole('button', { name: 'Next' }));
      dialog = within(await screen.findByRole('dialog'));
    }
    expect(dialog.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(dialog.queryByRole('button', { name: 'Skip' })).toBeNull();
    await user.click(dialog.getByRole('button', { name: 'Start' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useTour.getState().seen).toEqual([testUser.id]);
  });

  it('is skipped in one press, and can be asked for again from the palette', async () => {
    newAccount();
    const { user } = renderApp('/');
    const dialog = within(
      await screen.findByRole('dialog', { name: 'Welcome! This is your home' }),
    );
    await user.click(dialog.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox'), 'tour');
    await user.click(await screen.findByRole('option', { name: 'Show the tour again' }));
    expect(
      await screen.findByRole('dialog', { name: 'Welcome! This is your home' }),
    ).toBeInTheDocument();
  });

  it('leaves accounts that already know the app alone', () => {
    const old = { id: 'u', created_at: '2026-01-01T00:00:00Z' };
    const fresh = { id: 'u', created_at: '2026-10-23T09:55:00Z' };
    const now = Date.parse('2026-10-23T10:00:00Z');
    expect(shouldShowTour(old, { seen: [], requested: false }, now)).toBe(false);
    expect(shouldShowTour(fresh, { seen: [], requested: false }, now)).toBe(true);
    expect(shouldShowTour(fresh, { seen: ['u'], requested: false }, now)).toBe(false);
    expect(shouldShowTour(old, { seen: ['u'], requested: true }, now)).toBe(true);
  });
});
