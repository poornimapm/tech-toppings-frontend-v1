import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { useSession } from '@/core/auth/session-store';
import { fakeGoogle } from '@/test/google';
import { authConfig, errorEnvelope, server, testUser, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

const PASSWORD = 'Correct-Horse-42';

afterEach(() => {
  delete window.google;
});

beforeAll(async () => {
  await import('@/platform/auth/security-page');
}, 120_000);

async function openDelete() {
  const rendered = renderApp('/account/security');
  await rendered.user.click(await screen.findByRole('button', { name: 'Delete account' }));
  return { ...rendered, dialog: within(await screen.findByRole('dialog')) };
}

describe('your data', () => {
  it('downloads everything as one file, under the name the server gives', async () => {
    server.use(
      http.get('*/api/v1/me/export', () =>
        HttpResponse.json(
          { format: 1, account: { email: testUser.email }, collections: {} },
          { headers: { 'Content-Disposition': 'attachment; filename="my-data-2026-10-16.json"' } },
        ),
      ),
    );
    const saved: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(this.download);
    });
    const { user } = renderApp('/account/security');

    await user.click(await screen.findByRole('button', { name: 'Export my data' }));

    await vi.waitFor(() => {
      expect(saved).toEqual(['my-data-2026-10-16.json']);
    });
  });
});

describe('deleting the account', () => {
  it('waits for the email typed out, then deletes and signs out', async () => {
    let sent: unknown = null;
    server.use(
      http.delete('*/api/v1/me', async ({ request }) => {
        sent = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, dialog, router } = await openDelete();
    const submit = dialog.getByRole('button', { name: 'Delete for good' });

    await user.type(
      dialog.getByLabelText(`Type your email (${testUser.email}) to confirm`),
      'asha@',
    );
    expect(submit).toBeDisabled();
    await user.type(dialog.getByLabelText(/Type your email/), 'Example.com');
    await user.type(dialog.getByLabelText('Password'), PASSWORD);
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(await screen.findByText('Your account was deleted.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(useSession.getState().status).toBe('anonymous');
    expect(sent).toEqual({
      confirm_email: 'asha@Example.com',
      password: PASSWORD,
      google_id_token: null,
      code: null,
    });
  });

  it('asks for a code when two-step sign-in is on, and explains a refusal', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ two_factor: true }))),
      http.delete('*/api/v1/me', () =>
        HttpResponse.json(errorEnvelope('ACCOUNT_LAST_ADMIN', 'x'), { status: 409 }),
      ),
    );
    const { user, dialog } = await openDelete();

    await user.type(dialog.getByLabelText(/Type your email/), testUser.email);
    await user.type(dialog.getByLabelText('Password'), PASSWORD);
    const submit = dialog.getByRole('button', { name: 'Delete for good' });
    expect(submit).toBeDisabled(); // an empty code would only count toward the lockout
    await user.type(dialog.getByLabelText('Code'), '123456');
    await user.click(submit);

    expect(
      await dialog.findByText("You're the only admin. Make someone else an admin first."),
    ).toBeInTheDocument();
    expect(useSession.getState().status).toBe('authenticated');
  });

  it('starts empty each time it opens', async () => {
    const { user, dialog } = await openDelete();
    await user.type(dialog.getByLabelText('Password'), PASSWORD);
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(within(await screen.findByRole('dialog')).getByLabelText('Password')).toHaveValue('');
  });

  it('asks a Google-only account to sign in with Google again, and again if refused', async () => {
    server.use(
      http.get('*/api/v1/auth/config', () =>
        HttpResponse.json({ ...authConfig, google_client_id: 'client-1' }),
      ),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(tokenFor({ has_password: false, auth_providers: ['google'] })),
      ),
    );
    const sent: unknown[] = [];
    const replies = [
      HttpResponse.json(errorEnvelope('AUTH_GOOGLE_REAUTH_REQUIRED', 'x'), { status: 422 }),
      new HttpResponse(null, { status: 204 }),
    ];
    server.use(
      http.delete('*/api/v1/me', async ({ request }) => {
        sent.push(await request.json());
        return replies.shift();
      }),
    );
    const google = fakeGoogle();
    const { user, dialog } = await openDelete();

    await user.type(dialog.getByLabelText(/Type your email/), testUser.email);
    expect(dialog.queryByLabelText('Password')).toBeNull();
    await google.signIn('old-token');
    await user.click(await dialog.findByRole('button', { name: 'Delete for good' }));
    expect(
      await dialog.findByText(
        "That Google sign-in is too old or isn't for this account. Sign in with Google again.",
      ),
    ).toBeInTheDocument();
    expect(dialog.getByText("Sign in with Google again to confirm it's you.")).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Delete for good' })).toBeDisabled();

    await google.signIn('fresh-token');
    await user.click(await dialog.findByRole('button', { name: 'Delete for good' }));
    expect(await screen.findByText('Your account was deleted.')).toBeInTheDocument();
    expect(sent).toEqual([
      { confirm_email: testUser.email, password: null, google_id_token: 'old-token', code: null },
      { confirm_email: testUser.email, password: null, google_id_token: 'fresh-token', code: null },
    ]);
  });
});
