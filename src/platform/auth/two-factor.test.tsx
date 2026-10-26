import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { components } from '@/core/api/schema';
import { useSession } from '@/core/auth/session-store';
import { fakeGoogle } from '@/test/google';
import { authConfig, errorEnvelope, server, signedOut, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

type Schemas = components['schemas'];

const PASSWORD = 'Correct-Horse-42';
const CODES = ['abcde-fghjk', 'mnpqr-stuvw'];
const NEW_CODES = ['qrstu-vwxyz', 'hjkmn-pqrst'];

afterEach(() => {
  delete window.google;
});

beforeAll(async () => {
  await Promise.all([
    import('@/platform/auth/login-page'),
    import('@/platform/auth/security-page'),
  ]);
}, 120_000);

const challenge = { two_factor_required: true, challenge_token: 'challenge-1', expires_in: 300 };

/** A fake two-step state behind /v1/auth/totp, as the server keeps it. */
function twoFactorServer(enabled = false) {
  const state = { enabled, codesLeft: enabled ? 10 : 0, sent: [] as unknown[] };
  server.use(
    http.get('*/api/v1/auth/totp', () =>
      HttpResponse.json({
        available: true,
        enabled: state.enabled,
        enabled_at: state.enabled ? '2026-10-10T09:00:00Z' : null,
        recovery_codes_left: state.codesLeft,
      }),
    ),
    http.post('*/api/v1/auth/totp/setup', () =>
      HttpResponse.json({
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        otpauth_uri: 'otpauth://totp/Tech-Toppings:asha%40example.com?secret=JBSWY3DPEHPK3PXP',
      }),
    ),
    http.post('*/api/v1/auth/totp/enable', async ({ request }) => {
      const body = (await request.json()) as { code: string };
      state.sent.push(body);
      if (body.code !== '123456') {
        return HttpResponse.json(errorEnvelope('AUTH_TWO_FACTOR_CODE_INVALID', 'x'), {
          status: 422,
        });
      }
      Object.assign(state, { enabled: true, codesLeft: CODES.length });
      return HttpResponse.json({ recovery_codes: CODES });
    }),
    http.post('*/api/v1/auth/totp/disable', async ({ request }) => {
      state.sent.push(await request.json());
      Object.assign(state, { enabled: false, codesLeft: 0 });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/v1/auth/totp/recovery-codes', () =>
      HttpResponse.json({ recovery_codes: NEW_CODES }),
    ),
  );
  return state;
}

/** The security page's two-step card. */
async function twoFactorCard() {
  const heading = await screen.findByRole('heading', { name: 'Two-step sign-in' });
  return within(heading.closest('section') ?? document.body);
}

/** Signed in with an account that has no password (made through Google). */
function googleOnly(user: Partial<Schemas['UserOut']> = {}) {
  server.use(
    http.get('*/api/v1/auth/config', () =>
      HttpResponse.json({ ...authConfig, google_client_id: 'client-1' }),
    ),
    http.post('*/api/v1/auth/refresh', () =>
      HttpResponse.json(tokenFor({ has_password: false, auth_providers: ['google'], ...user })),
    ),
  );
}

type User = ReturnType<typeof renderApp>['user'];

/** The password step answers with a code challenge, and keeps what each try sent. */
function loginServer() {
  const sent: unknown[] = [];
  server.use(
    http.post('*/api/v1/auth/login', async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json(challenge);
    }),
  );
  return sent;
}

async function signInWithPassword(user: User) {
  await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
  await user.type(screen.getByLabelText('Password'), PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

/** Back on the first step, the fields still hold what was typed: one press tries again. */
async function expectSignInAgain(user: User, logins: unknown[]) {
  expect(screen.getByLabelText('Email')).toHaveValue('asha@example.com');
  expect(screen.getByLabelText('Password')).toHaveValue(PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByLabelText('Code')).toBeInTheDocument();
  expect(logins).toHaveLength(2);
  expect(logins[1]).toMatchObject({ email: 'asha@example.com', password: PASSWORD });
}

describe('signing in with two-step on', () => {
  it('asks for a code after the password, then signs in', async () => {
    signedOut();
    let sent: unknown = null;
    server.use(
      http.post('*/api/v1/auth/login', () => HttpResponse.json(challenge)),
      http.post('*/api/v1/auth/login/totp', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(tokenFor({ two_factor: true }));
      }),
    );
    const { user, router } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Two-step sign-in' })).toBeInTheDocument();
    expect(useSession.getState().status).toBe('anonymous'); // no session before the code
    await user.type(screen.getByLabelText('Code'), ' 123456 ');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByRole('heading', { level: 1, name: /, Asha$/ })).toBeInTheDocument();
    expect(sent).toEqual({ challenge_token: 'challenge-1', code: '123456' });
    expect(router.state.location.pathname).toBe('/');
  });

  it('asks for a code after Google too, and takes a recovery code', async () => {
    signedOut();
    let sent: unknown = null;
    server.use(
      http.get('*/api/v1/auth/config', () =>
        HttpResponse.json({ ...authConfig, google_client_id: 'client-1' }),
      ),
      http.post('*/api/v1/auth/google', () => HttpResponse.json(challenge)),
      http.post('*/api/v1/auth/login/totp', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(tokenFor({ two_factor: true }));
      }),
    );
    const google = fakeGoogle();
    const { user } = renderApp('/login');

    await google.signIn('google-id-token');
    const code = await screen.findByLabelText('Code');
    expect(code).toHaveFocus();
    expect(useSession.getState().status).toBe('anonymous');
    await user.type(code, CODES[0] ?? '');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByRole('heading', { level: 1, name: /, Asha$/ })).toBeInTheDocument();
    expect(sent).toEqual({ challenge_token: 'challenge-1', code: CODES[0] });
  });

  it('keeps the code step on a wrong code, and starts over when the sign-in ran out', async () => {
    signedOut();
    const logins = loginServer();
    const replies = [
      HttpResponse.json(errorEnvelope('AUTH_TWO_FACTOR_CODE_INVALID', 'x'), { status: 422 }),
      HttpResponse.json(errorEnvelope('AUTH_TWO_FACTOR_CHALLENGE_INVALID', 'x'), { status: 401 }),
    ];
    server.use(http.post('*/api/v1/auth/login/totp', () => replies.shift()));
    const { user } = renderApp('/login');
    await signInWithPassword(user);

    await user.type(await screen.findByLabelText('Code'), '000000');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(
      await screen.findByText('That code is wrong or was already used. Try the newest code.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(
      screen.getByText('That sign-in took too long. Please sign in again.'),
    ).toBeInTheDocument();
    await expectSignInAgain(user, logins);
  });

  it('goes back from the code step with the email and password still filled in', async () => {
    signedOut();
    const logins = loginServer();
    const { user } = renderApp('/login');
    await signInWithPassword(user);

    await user.click(await screen.findByRole('button', { name: 'Back to sign in' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    await expectSignInAgain(user, logins);
  });
});

describe('the security page', () => {
  it('sets two-step sign-in up with the password and a code, and shows the codes once', async () => {
    const state = twoFactorServer();
    const { user } = renderApp('/account/security');
    const card = await twoFactorCard();

    await user.click(await card.findByRole('button', { name: 'Set up two-step sign-in' }));
    expect(await card.findByText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();
    expect(card.getByRole('link', { name: 'Open in authenticator app' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^otpauth:\/\/totp\//),
    );
    expect(card.getByLabelText('Password')).toHaveFocus();

    await user.type(card.getByLabelText('Code'), '111111');
    expect(card.getByRole('button', { name: 'Turn on' })).toBeDisabled(); // the password first
    await user.type(card.getByLabelText('Password'), PASSWORD);
    await user.click(card.getByRole('button', { name: 'Turn on' }));
    expect(
      await card.findByText('That code is wrong or was already used. Try the newest code.'),
    ).toBeInTheDocument();

    await user.clear(card.getByLabelText('Code'));
    await user.type(card.getByLabelText('Code'), '123456');
    await user.click(card.getByRole('button', { name: 'Turn on' }));
    const codes = await card.findByRole('list', { name: 'Recovery codes' });
    expect(
      within(codes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(CODES);
    expect(useSession.getState().user?.two_factor).toBe(true);
    expect(state.sent.at(-1)).toEqual({
      code: '123456',
      password: PASSWORD,
      google_id_token: null,
    });

    await user.click(card.getByRole('button', { name: "I've saved them" }));
    expect(await card.findByText('On since Oct 10, 2026.')).toBeInTheDocument();
    expect(card.getByRole('alert')).toHaveTextContent('2 recovery codes left.'); // running low
    expect(state.enabled).toBe(true);
  });

  it('starts a new setup without the last attempt’s error', async () => {
    twoFactorServer();
    const { user } = renderApp('/account/security');
    const card = await twoFactorCard();

    await user.click(await card.findByRole('button', { name: 'Set up two-step sign-in' }));
    await user.type(await card.findByLabelText('Password'), PASSWORD);
    await user.type(card.getByLabelText('Code'), '111111');
    await user.click(card.getByRole('button', { name: 'Turn on' }));
    await card.findByText('That code is wrong or was already used. Try the newest code.');

    await user.click(card.getByRole('button', { name: 'Cancel' }));
    await user.click(await card.findByRole('button', { name: 'Set up two-step sign-in' }));
    await card.findByLabelText('Code');
    expect(card.queryByText(/That code is wrong/)).toBeNull();
  });

  it('keeps the recovery codes on screen when the status can’t be refreshed', async () => {
    twoFactorServer();
    const { user } = renderApp('/account/security');
    const card = await twoFactorCard();
    await user.click(await card.findByRole('button', { name: 'Set up two-step sign-in' }));
    let refused = 0;
    server.use(
      http.get('*/api/v1/auth/totp', () => {
        refused += 1;
        return HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'x'), { status: 500 });
      }),
    );

    await user.type(await card.findByLabelText('Password'), PASSWORD);
    await user.type(card.getByLabelText('Code'), '123456');
    await user.click(card.getByRole('button', { name: 'Turn on' }));

    await waitFor(() => {
      expect(refused).toBeGreaterThan(0);
    });
    expect(await card.findByRole('list', { name: 'Recovery codes' })).toBeInTheDocument();
  });

  it('turns it off with the password and a code', async () => {
    const state = twoFactorServer(true);
    const { user } = renderApp('/account/security');

    await user.click(await screen.findByRole('button', { name: 'Turn off' }));
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.type(screen.getByLabelText('Code'), '654321');
    await user.click(screen.getByRole('button', { name: 'Turn off' }));

    expect(await screen.findByText('Two-step sign-in is off.')).toBeInTheDocument();
    expect(state.sent).toEqual([{ code: '654321', password: PASSWORD, google_id_token: null }]);
    expect(
      await screen.findByRole('button', { name: 'Set up two-step sign-in' }),
    ).toBeInTheDocument();
  });

  it('confirms with Google again for an account without a password', async () => {
    googleOnly({ two_factor: true });
    const state = twoFactorServer(true);
    const google = fakeGoogle();
    const { user } = renderApp('/account/security');
    const card = await twoFactorCard();

    await user.click(await card.findByRole('button', { name: 'Turn off' }));
    expect(card.queryByLabelText('Password')).toBeNull();
    expect(card.getByText("Sign in with Google again to confirm it's you.")).toBeInTheDocument();
    await user.type(card.getByLabelText('Code'), '654321');
    expect(card.getByRole('button', { name: 'Turn off' })).toBeDisabled();

    await google.signIn('fresh-google-token');
    expect(await card.findByText('Confirmed with Google.')).toBeInTheDocument();
    await user.click(card.getByRole('button', { name: 'Turn off' }));

    expect(await screen.findByText('Two-step sign-in is off.')).toBeInTheDocument();
    expect(state.sent).toEqual([
      { code: '654321', password: null, google_id_token: 'fresh-google-token' },
    ]);
  });

  it('gives new recovery codes for a code', async () => {
    twoFactorServer(true);
    const { user } = renderApp('/account/security');
    const card = await twoFactorCard();

    await user.click(await card.findByRole('button', { name: 'New recovery codes' }));
    expect(card.getByLabelText('Code')).toHaveFocus();
    await user.type(card.getByLabelText('Code'), '654321');
    await user.click(card.getByRole('button', { name: 'New recovery codes' }));

    const codes = await card.findByRole('list', { name: 'Recovery codes' });
    expect(
      within(codes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(NEW_CODES);
  });

  it('says so when the server cannot keep secrets', async () => {
    server.use(
      http.get('*/api/v1/auth/totp', () =>
        HttpResponse.json({
          available: false,
          enabled: false,
          enabled_at: null,
          recovery_codes_left: 0,
        }),
      ),
    );
    renderApp('/account/security');

    expect(
      await screen.findByText("Two-step sign-in isn't available on this server yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up two-step sign-in' })).toBeNull();
  });
});
