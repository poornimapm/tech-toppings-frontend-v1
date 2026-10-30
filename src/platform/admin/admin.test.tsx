import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, describe, expect, it } from 'vitest';

import type { components } from '@/core/api/schema';
import { errorEnvelope, server, testUser, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

type Schemas = components['schemas'];

beforeAll(async () => {
  await Promise.all([
    import('@/platform/admin/admin-layout'),
    import('@/platform/admin/usage-page'),
    import('@/platform/admin/users-page'),
    import('@/platform/admin/user-page'),
    import('@/platform/admin/allowlist-page'),
    import('@/platform/admin/modules-page'),
    import('@/platform/admin/audit-page'),
  ]);
}, 120_000);

const bob: Schemas['AdminUserDetail'] = {
  id: 'user-2',
  email: 'bob@example.com',
  name: 'Bob',
  role: 'user',
  created_at: '2026-10-02T10:00:00Z',
  last_login_at: null,
  disabled: false,
  must_change_password: false,
  two_factor: true,
  locked: false,
  providers: [],
  modules: [],
  live_sessions: 2,
};

const page = <T,>(items: T[]) => ({
  items,
  page: 1,
  page_size: 50,
  total: items.length,
  has_next: false,
});

function asAdmin() {
  server.use(
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ role: 'admin' }))),
    http.get('*/api/v1/admin/analytics/usage', () =>
      HttpResponse.json({
        start: '2026-09-17',
        end: '2026-10-16',
        total_users: 12,
        active_users: 7,
        signups: [{ date: '2026-10-15', count: 2 }],
        ai: {
          runs: 40,
          by_ai: 30,
          by_rules: 10,
          fell_back: 4,
          fallback_rate_pct: 11.8,
          calls_by_provider: { gemini: 31 },
        },
        errors: [{ code: 'AUTH_INVALID_CREDENTIALS', count: 5 }],
      } satisfies Schemas['UsageOut']),
    ),
    http.get('*/api/v1/admin/analytics/db', () =>
      HttpResponse.json({
        database: 'tt',
        data_mb: 3,
        storage_mb: 4,
        index_mb: 1,
        quota_mb: 512,
        used_pct: 1,
        collections: [{ name: 'expenses', count: 900, size_mb: 2, storage_mb: 3, index_mb: 0.5 }],
      } satisfies Schemas['DbOut']),
    ),
    http.get('*/api/v1/admin/users', () => HttpResponse.json(page([bob]))),
    http.get('*/api/v1/admin/users/:id', () => HttpResponse.json(bob)),
  );
}

describe('the admin console', () => {
  it('is not offered to, nor opened for, someone who is not an admin', async () => {
    const { router } = renderApp('/admin/users');

    expect(await screen.findByRole('heading', { level: 1, name: /, Asha$/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('shows usage and how full the database is', async () => {
    asAdmin();
    renderApp('/admin');

    expect(await screen.findByText('Assistant requests')).toBeInTheDocument();
    expect(screen.getByText('11.8%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(await screen.findByText('5 MB of 512 MB used (1%)')).toBeInTheDocument();
    const errors = screen.getByRole('table', { name: 'Errors by code' });
    expect(within(errors).getByText('AUTH_INVALID_CREDENTIALS')).toBeInTheDocument();
  });

  it('resets a password and shows the one-time password once', async () => {
    asAdmin();
    let resets = 0;
    server.use(
      http.post('*/api/v1/admin/users/:id/reset-password', () => {
        resets += 1;
        return HttpResponse.json({ one_time_password: 'Abcd-Efgh-Jkmn-Pqrs' });
      }),
    );
    const { user } = renderApp('/admin/users');

    await user.click(await screen.findByRole('link', { name: /Bob/ }));
    expect(await screen.findByText('2 signed-in devices')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText("Reset Bob's password?")).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Yes, do it' }));

    expect(await screen.findByText('Abcd-Efgh-Jkmn-Pqrs')).toBeInTheDocument();
    expect(resets).toBe(1);
  });

  it('creates an owner with Labor and a one-time password shown once', async () => {
    asAdmin();
    let sent: unknown = null;
    const labor: Schemas['AdminModuleOut'] = {
      key: 'labor',
      manifest_status: 'beta',
      manifest_order: 20,
      status: 'beta',
      global_enabled: true,
      order: 20,
      overridden: [],
      audience: 'granted',
    };
    server.use(
      http.get('*/api/v1/admin/modules', () => HttpResponse.json([labor])),
      http.post('*/api/v1/admin/users', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          {
            user: {
              ...bob,
              id: 'user-9',
              name: 'Meena',
              email: 'meena@example.com',
              modules: ['labor'],
            },
            one_time_password: 'Wxyz-Abcd-Efgh-Jkmn',
          },
          { status: 201 },
        );
      }),
    );
    const { user } = renderApp('/admin/users');

    await user.click(await screen.findByRole('button', { name: 'Create an account' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'New account' }));
    await user.type(dialog.getByRole('textbox', { name: 'Email' }), 'meena@example.com');
    await user.type(dialog.getByRole('textbox', { name: 'Name' }), 'Meena');
    await user.click(await dialog.findByRole('checkbox', { name: 'Labor Management' }));
    await user.click(dialog.getByRole('button', { name: 'Create the account' }));

    expect(await screen.findByText('Wxyz-Abcd-Efgh-Jkmn')).toBeInTheDocument();
    expect(screen.getByText("Meena's account is ready.")).toBeInTheDocument();
    expect(sent).toEqual({ email: 'meena@example.com', name: 'Meena', modules: ['labor'] });
  });

  it('changes a role only once confirmed, and shows a refusal in the dialog', async () => {
    asAdmin();
    const sent: unknown[] = [];
    const replies = [
      HttpResponse.json(errorEnvelope('ADMIN_LAST_ADMIN', 'x'), { status: 409 }),
      HttpResponse.json({ ...bob, role: 'admin' }),
    ];
    server.use(
      http.patch('*/api/v1/admin/users/:id', async ({ request }) => {
        sent.push(await request.json());
        return replies.shift();
      }),
    );
    const { user } = renderApp(`/admin/users/${bob.id}`);

    await user.selectOptions(await screen.findByLabelText('Role'), 'admin');
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText("Change Bob's role to Admin?")).toBeInTheDocument();
    expect(sent).toEqual([]); // nothing until confirmed

    await user.click(dialog.getByRole('button', { name: 'Yes, do it' }));
    expect(await dialog.findByText('At least one active admin must remain.')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Yes, do it' }));

    expect(await screen.findByText('Role saved.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sent).toEqual([{ role: 'admin' }, { role: 'admin' }]);
  });

  it('disables an account once confirmed', async () => {
    asAdmin();
    let sent: unknown = null;
    server.use(
      http.patch('*/api/v1/admin/users/:id', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...bob, disabled: true });
      }),
    );
    const { user } = renderApp(`/admin/users/${bob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Disable account' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText("Disable Bob's account?")).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Yes, do it' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(sent).toEqual({ disabled: true });
  });

  it('switches a module off for everyone and resets it to how it ships', async () => {
    asAdmin();
    const sent: unknown[] = [];
    const expenses: Schemas['AdminModuleOut'] = {
      key: 'expenses',
      manifest_status: 'live',
      manifest_order: 1,
      status: 'beta',
      global_enabled: true,
      order: 1,
      overridden: ['status'],
      audience: 'everyone',
    };
    server.use(
      http.get('*/api/v1/admin/modules', () => HttpResponse.json([expenses])),
      http.patch('*/api/v1/admin/modules/:key', async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json(expenses);
      }),
    );
    const { user } = renderApp('/admin/modules');

    await user.click(await screen.findByRole('switch', { name: /on for everyone/ }));
    await waitFor(() => {
      expect(sent).toEqual([{ global_enabled: false }]);
    });
    await user.click(await screen.findByRole('button', { name: /^Reset / }));
    await waitFor(() => {
      expect(sent).toEqual([{ global_enabled: false }, { status: null }]);
    });
  });

  it('never offers actions on the admin’s own account', async () => {
    asAdmin();
    server.use(
      http.get('*/api/v1/admin/users/:id', () =>
        HttpResponse.json({ ...bob, id: testUser.id, name: 'Asha' }),
      ),
    );
    renderApp(`/admin/users/${testUser.id}`);

    expect(
      await screen.findByText('This is your own account. Change it from your Security page.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset password' })).toBeNull();
  });

  it('adds to the allowlist and explains a refusal', async () => {
    asAdmin();
    const listed: Schemas['AllowedOut'][] = [
      { email: 'set@example.com', source: 'settings', note: null, added_at: null },
    ];
    server.use(
      http.get('*/api/v1/admin/allowed-emails', () => HttpResponse.json(listed)),
      http.post('*/api/v1/admin/allowed-emails', async ({ request }) => {
        const body = (await request.json()) as { email: string; note: string | null };
        if (listed.some((item) => item.email === body.email)) {
          return HttpResponse.json(errorEnvelope('ALLOWLIST_EXISTS', 'x'), { status: 409 });
        }
        listed.push({ ...body, source: 'admin', added_at: '2026-10-16T09:00:00Z' });
        return HttpResponse.json(listed.at(-1), { status: 201 });
      }),
    );
    const { user } = renderApp('/admin/allowlist');

    await user.type(await screen.findByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    const table = screen.getByRole('table', { name: 'Allowlist' });
    expect(await within(table).findByText('new@example.com')).toBeInTheDocument();
    // Settings entries can only be changed in the settings: no Remove for them.
    expect(within(table).getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
    expect(within(table).getByRole('button', { name: 'Remove new@example.com' })).toBeVisible();

    await user.type(screen.getByLabelText('Email'), 'set@example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('That email is already on the list.')).toBeInTheDocument();
  });

  it('shows one account’s audit trail when opened from it', async () => {
    asAdmin();
    let asked: URLSearchParams | null = null;
    server.use(
      http.get('*/api/v1/admin/audit-logs', ({ request }) => {
        asked = new URL(request.url).searchParams;
        return HttpResponse.json(
          page([
            {
              id: 'a-1',
              at: '2026-10-16T09:00:00Z',
              action: 'user.role_changed',
              actor_id: testUser.id,
              actor_email: testUser.email,
              entity: 'user',
              entity_id: bob.id,
              owner_id: bob.id,
              owner_email: bob.email,
              details: { from: 'user', to: 'admin' },
              ip: '10.0.0.1',
              request_id: 'r-1',
            },
          ] satisfies Schemas['AuditOut'][]),
        );
      }),
    );
    renderApp(`/admin/audit?owner_id=${bob.id}`);

    const table = await screen.findByRole('table', { name: 'Audit log' });
    expect(within(table).getByText('user.role_changed')).toBeInTheDocument();
    expect(within(table).getByText('to: admin')).toBeInTheDocument();
    expect(screen.getByText("Showing one account's entries.")).toBeInTheDocument();
    expect((asked as URLSearchParams | null)?.get('owner_id')).toBe(bob.id);
  });
});
