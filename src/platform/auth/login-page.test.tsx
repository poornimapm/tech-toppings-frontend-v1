import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, describe, expect, it } from 'vitest';

import { server, signedOut, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

beforeAll(async () => {
  await Promise.all([
    import('@/platform/auth/login-page'),
    import('@/platform/welcome/welcome-page'),
  ]);
}, 120_000);

describe('sign-in form', () => {
  it('takes the first field at fault to the user, then re-checks as they type', async () => {
    signedOut();
    const { user } = renderApp('/login');
    const email = await screen.findByLabelText('Email');
    const password = screen.getByLabelText('Password');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(email).toHaveFocus();
    expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    expect(password).toHaveAccessibleDescription('This field is required.');

    await user.type(email, 'asha@example.com');
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(password).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(password).toHaveFocus();
  });

  it('shows no problems before the first try', async () => {
    signedOut();
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'not an email');

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter a valid email address.')).toBeNull();
  });

  it('sends what the form holds once, with the button off meanwhile', async () => {
    signedOut();
    let release: () => void = () => undefined;
    const sent: unknown[] = [];
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        sent.push(await request.json());
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json(tokenFor());
      }),
    );
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Correct-Horse-42');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ email: 'asha@example.com', password: 'Correct-Horse-42' });
    release();
    expect(await screen.findByRole('heading', { level: 1, name: /, Asha$/ })).toBeInTheDocument();
  });
});
