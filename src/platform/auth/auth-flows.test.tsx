import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { useSession } from '@/core/auth/session-store';
import { useThemeStore } from '@/core/theme/theme-store';
import { authConfig, errorEnvelope, server, signedOut, testUser, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

const PASSWORD = 'Correct-Horse-42';

afterEach(() => {
  delete window.google;
});

describe('route guards', () => {
  it('sends signed-out visitors to sign in and back to where they were going', async () => {
    signedOut();
    const { user, router } = renderApp('/account/security');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?next=%2Faccount%2Fsecurity');

    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Security' })).toBeInTheDocument();
  });

  it('sends signed-in visitors away from the sign-in page', async () => {
    const { router } = renderApp('/login');

    expect(
      await screen.findByRole('heading', { name: 'Welcome to Tech-Toppings' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('allows nothing but the password change after an admin reset', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(tokenFor({ must_change_password: true })),
      ),
    );
    const { router } = renderApp('/account/security');

    expect(
      await screen.findByRole('heading', { name: 'Choose a new password' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/change-password');
    expect(screen.getByLabelText('One-time or current password')).toBeInTheDocument();
  });

  it('keeps retrying while the backend wakes up', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(tokenFor());
      }),
    );
    renderApp('/');

    expect(await screen.findByText('Signing you in…')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Welcome to Tech-Toppings' }),
    ).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});

describe('sign in', () => {
  it('validates before calling the server', async () => {
    signedOut();
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it.each([
    [
      HttpResponse.json(errorEnvelope('AUTH_INVALID_CREDENTIALS', 'x'), { status: 401 }),
      'Email or password is incorrect.',
    ],
    [
      HttpResponse.json(errorEnvelope('AUTH_ACCOUNT_LOCKED', 'x', { retry_after_seconds: 120 }), {
        status: 429,
      }),
      'Too many attempts. Try again in 2 min.',
    ],
  ])('explains a failed sign-in', async (reply, message) => {
    signedOut();
    server.use(http.post('*/api/v1/auth/login', () => reply));
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Wrong-Pass-1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('can reveal the password', async () => {
    signedOut();
    const { user } = renderApp('/login');
    const field = await screen.findByLabelText('Password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(field).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('offers Google sign-in when configured', async () => {
    signedOut();
    let posted: unknown = null;
    server.use(
      http.get('*/api/v1/auth/config', () =>
        HttpResponse.json({ ...authConfig, google_client_id: 'client-1' }),
      ),
      http.post('*/api/v1/auth/google', async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(tokenFor());
      }),
    );
    let callback: ((response: { credential: string }) => void) | undefined;
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn((options: { callback: (r: { credential: string }) => void }) => {
            callback = options.callback;
          }),
          renderButton: vi.fn(),
        },
      },
    };
    renderApp('/login');

    await waitFor(() => {
      expect(callback).toBeDefined();
    });
    callback?.({ credential: 'google-id-token' });

    expect(
      await screen.findByRole('heading', { name: 'Welcome to Tech-Toppings' }),
    ).toBeInTheDocument();
    expect(posted).toEqual({ id_token: 'google-id-token' });
  });

  it('has no accessibility violations', async () => {
    signedOut();
    const { container } = renderApp('/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('registration', () => {
  async function fillRegistration(password: string, confirm = password) {
    signedOut();
    const view = renderApp('/register');
    await view.user.type(await screen.findByLabelText('Your name'), 'Asha');
    await view.user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await view.user.type(screen.getByLabelText('Password'), password);
    await view.user.type(screen.getByLabelText('Confirm password'), confirm);
    return view;
  }

  it('shows the password rules live and blocks a weak password', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/register', () => {
        calls += 1;
        return HttpResponse.json(tokenFor(), { status: 201 });
      }),
    );
    const { user } = await fillRegistration('weak');

    expect(screen.getByText('At least 10 characters')).toHaveClass('text-muted');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText("The password doesn't meet the requirements."),
    ).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('checks that both passwords match', async () => {
    const { user } = await fillRegistration(PASSWORD, 'Something-Else-9');

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
  });

  it('marks a taken email on the field', async () => {
    server.use(
      http.post('*/api/v1/auth/register', () =>
        HttpResponse.json(errorEnvelope('AUTH_EMAIL_TAKEN', 'x'), { status: 409 }),
      ),
    );
    const { user } = await fillRegistration(PASSWORD);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains when the email is not invited', async () => {
    server.use(
      http.post('*/api/v1/auth/register', () =>
        HttpResponse.json(errorEnvelope('AUTH_REGISTRATION_NOT_ALLOWED', 'x'), { status: 403 }),
      ),
    );
    const { user } = await fillRegistration(PASSWORD);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("This email isn't invited.");
  });

  it('creates the account and signs in', async () => {
    const { user } = await fillRegistration(PASSWORD);

    expect(screen.getByText('At least 10 characters')).toHaveClass('text-success');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome to Tech-Toppings' }),
    ).toBeInTheDocument();
  });

  it('says so when registration is closed', async () => {
    signedOut();
    server.use(
      http.get('*/api/v1/auth/config', () =>
        HttpResponse.json({ ...authConfig, registration_mode: 'closed' }),
      ),
    );
    renderApp('/register');

    expect(await screen.findByText(/Registration is closed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
  });
});

describe('changing the password', () => {
  it('flags a wrong current password and succeeds with the right one', async () => {
    let attempt = 0;
    server.use(
      http.post('*/api/v1/auth/password/change', () => {
        attempt += 1;
        return attempt === 1
          ? HttpResponse.json(errorEnvelope('AUTH_CURRENT_PASSWORD_INVALID', 'x'), { status: 422 })
          : HttpResponse.json(tokenFor());
      }),
    );
    const { user, router } = renderApp('/change-password');
    await user.type(await screen.findByLabelText('Current password'), 'Old-Password-1');
    await user.type(screen.getByLabelText('New password'), 'Brand-New-Pass-7');
    await user.type(screen.getByLabelText('Confirm password'), 'Brand-New-Pass-7');

    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });
});

describe('devices and signing out', () => {
  it('lists devices, marks this one, and signs another out', async () => {
    let revoked: string | undefined;
    server.use(
      http.delete('*/api/v1/me/sessions/:id', ({ params }) => {
        revoked = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderApp('/account/security');

    const list = await screen.findByRole('region', { name: 'Signed-in devices' });
    expect(await within(list).findByText('Chrome · Windows')).toBeInTheDocument();
    expect(within(list).getByText('This device')).toBeInTheDocument();
    expect(within(list).getByText('Chrome · Android')).toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(revoked).toBe('session-phone');
    });
  });

  it('signs out of every device after confirmation', async () => {
    const { user, router } = renderApp('/account/security');

    await user.click(await screen.findByRole('button', { name: 'Sign out of all devices' }));
    expect(screen.getByText('Sign out of every device, including this one?')).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('group')).getByRole('button', { name: 'Sign out of all devices' }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(useSession.getState().status).toBe('anonymous');
  });

  it('signs out from the header', async () => {
    const { user, router } = renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Signed in as Asha' });

    await user.click(within(nav).getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(screen.queryByRole('navigation', { name: /Signed in as/ })).not.toBeInTheDocument();
  });
});

describe('account preferences', () => {
  it('applies the saved language and theme when signing in', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(tokenFor({ locale: 'ta', theme: 'dark' })),
      ),
    );
    renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Tech-Toppings-க்கு வரவேற்கிறோம்' }),
    ).toBeInTheDocument();
    expect(useThemeStore.getState().preference).toBe('dark');
  });

  it('saves a theme change to the account', async () => {
    let saved: unknown = null;
    server.use(
      http.patch('*/api/v1/me', async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ ...testUser, theme: 'light' });
      }),
    );
    const { user } = renderApp('/');

    await user.click(
      await screen.findByRole('button', { name: 'Theme: System. Switch to Light.' }),
    );

    await waitFor(() => {
      expect(saved).toEqual({ theme: 'light' });
    });
    expect(useSession.getState().user?.theme).toBe('light');
  });
});
