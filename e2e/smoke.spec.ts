import { expect, test, type Page } from '@playwright/test';

// Smoke tests run the production build with the backend stubbed per test (page.route).

const user = {
  id: 'user-1',
  email: 'asha@example.com',
  name: 'Asha',
  role: 'user',
  locale: 'en',
  theme: 'system',
  ui_mode: 'standard',
  base_currency: 'INR',
  timezone: 'Asia/Kolkata',
  ai_consent: false,
  must_change_password: false,
  has_password: true,
  auth_providers: [],
  created_at: '2026-10-01T10:00:00Z',
};
const token = { access_token: 'e2e-access', token_type: 'bearer', expires_in: 900, user };
function moduleView(key: string, position: number, changes: Record<string, unknown> = {}) {
  return {
    key,
    slug: key.replaceAll('_', '-'),
    version: '0.1.0',
    status: 'coming_soon',
    global_enabled: true,
    enabled: true,
    available: false,
    pinned: false,
    position,
    notify_requested: false,
    has_settings: false,
    stat: null,
    ...changes,
  };
}
const modules = [
  moduleView('expenses', 0, {
    status: 'live',
    available: true,
    stat: { value: 4320, format: 'currency', currency: 'INR', label: 'month_total' },
  }),
  moduleView('medicine', 1),
  moduleView('receipts', 2),
  moduleView('journal', 3),
];

const config = {
  registration_mode: 'open',
  google_client_id: null,
  password_policy: { min_length: 10, max_length: 128, min_classes: 2 },
  csrf_header: 'X-TT-CSRF',
};

async function stubApi(
  page: Page,
  {
    signedIn = true,
    readiness = 'ready',
  }: { signedIn?: boolean; readiness?: 'ready' | 'down' } = {},
) {
  await page.route('**/api/healthz', (route) =>
    route.fulfill({ json: { status: 'ok', name: 'Tech-Toppings API', version: '0.1.0' } }),
  );
  await page.route('**/api/readyz', (route) =>
    readiness === 'ready'
      ? route.fulfill({ json: { status: 'ready', checks: { mongo: 'ok' } } })
      : route.fulfill({
          status: 503,
          json: {
            code: 'SERVICE_NOT_READY',
            message: 'Service is not ready yet.',
            details: { checks: { mongo: 'unavailable' } },
            request_id: 'e2e-0001',
          },
        }),
  );
  await page.route('**/api/v1/auth/config', (route) => route.fulfill({ json: config }));
  await page.route('**/api/v1/auth/refresh', (route) =>
    signedIn
      ? route.fulfill({ json: token })
      : route.fulfill({
          status: 401,
          json: { code: 'AUTH_REFRESH_INVALID', message: 'ended', details: null, request_id: 'r' },
        }),
  );
  await page.route('**/api/v1/auth/login', (route) => route.fulfill({ json: token }));
  await page.route('**/api/v1/me', (route) => route.fulfill({ json: user }));
  await page.route('**/api/v1/modules?*', (route) =>
    route.fulfill({
      json: { items: modules, page: 1, page_size: 100, total: modules.length, has_next: false },
    }),
  );
  await page.route('**/api/v1/agents', (route) =>
    route.fulfill({
      json: { items: [assistant], page: 1, page_size: 20, total: 1, has_next: false },
    }),
  );
}

const assistant = {
  name: 'assistant',
  description: 'The in-app assistant.',
  mode: 'static',
  reason: 'consent',
  fallback: true,
  quota_remaining: 30,
  skills: [
    { name: 'manage-modules', description: 'Manage modules.', mode: 'agent', has_static: true },
  ],
};
const proposal = {
  id: 'proposal-1',
  tool: 'modules_set_preferences',
  arguments: { key: 'journal', pinned: true },
  summary: null,
  summary_code: 'manage-modules.change.pin',
  summary_params: { name: 'Journal' },
  status: 'pending',
  expires_at: '2026-10-09T10:30:00Z',
  result: null,
  error_code: null,
};

test('home page greets the user, lists modules and shows live system status', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');

  await expect(page).toHaveTitle('Tech-Toppings');
  await expect(page.getByRole('heading', { level: 1, name: /, Asha$/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Expenses' })).toBeVisible();
  await expect(page.getByText('₹4,320').first()).toBeVisible();
  const status = page.getByRole('region', { name: 'System status' });
  await expect(status.getByText('Online')).toBeVisible();
  await expect(status.getByText('Ready')).toBeVisible();
});

test('a module is favourited and an upcoming one can notify me', async ({ page }) => {
  await stubApi(page);
  await page.route('**/api/v1/modules/journal/preferences', async (route) =>
    route.fulfill({ json: { ...modules[3], ...(route.request().postDataJSON() as object) } }),
  );
  await page.route('**/api/v1/modules/receipts/interest', (route) =>
    route.fulfill({ json: { ...modules[2], notify_requested: true } }),
  );
  await page.goto('/');

  await page.getByRole('button', { name: 'Add Journal to favourites' }).click();
  const favourites = page.getByRole('region', { name: 'Favourites' });
  await expect(favourites.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.getByText('Journal added to favourites')).toBeVisible();

  await page.keyboard.press('/');
  await page.keyboard.type('bills');
  await page.getByRole('button', { name: 'Receipts & warranty', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Receipts & warranty' });
  await dialog.getByRole('switch', { name: 'Notify me when it launches' }).click();
  await expect(
    page.getByText("We'll let you know when Receipts & warranty launches."),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a signed-out visitor signs in and lands where they were going', async ({ page }) => {
  await stubApi(page, { signedIn: false });
  await page.goto('/account/security');

  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fsecurity$/);
  await page.getByLabel('Email').fill('asha@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Correct-Horse-42');
  await page.route('**/api/v1/me/sessions*', (route) =>
    route.fulfill({
      json: { items: [], page: 1, page_size: 50, total: 0, has_next: false },
    }),
  );
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Signed in as Asha' })).toBeVisible();
});

test('database outage is explained, not hidden', async ({ page }) => {
  await stubApi(page, { readiness: 'down' });
  await page.goto('/');

  const status = page.getByRole('region', { name: 'System status' });
  await expect(status.getByText('Not ready')).toBeVisible();
});

test('language and theme can be changed from the keyboard', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');

  await page.getByRole('combobox', { name: 'Language' }).selectOption('hi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/, Asha$/);
  await expect(page.getByRole('heading', { level: 3, name: 'खर्च' })).toBeVisible();

  await page.getByRole('button', { name: /थीम/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('unknown routes show the not-found page', async ({ page }) => {
  await stubApi(page);
  await page.goto('/definitely/not/here');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('the command palette navigates and asks the assistant', async ({ page }) => {
  await stubApi(page);
  await page.route('**/api/v1/agents/assistant/runs', (route) =>
    route.fulfill({
      status: 201,
      json: {
        id: 'run-1',
        agent: 'assistant',
        skill: 'manage-modules',
        status: 'completed',
        mode: 'static',
        reason: 'consent',
        message: null,
        message_code: 'manage-modules.ready.pin',
        message_params: { name: 'Journal' },
        proposals: [proposal],
        client_actions: [],
        created_at: '2026-10-09T10:00:00Z',
      },
    }),
  );
  await page.route('**/api/v1/agents/proposals/proposal-1/confirm', (route) =>
    route.fulfill({ json: { ...proposal, status: 'confirmed' } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await palette.getByRole('combobox').fill('pin journal');
  await palette.getByRole('option', { name: 'Ask the assistant: “pin journal”' }).click();

  await expect(palette.getByText('Confirm to add Journal to your favourites.')).toBeVisible();
  await palette.getByRole('button', { name: 'Confirm' }).click();
  await expect(palette.getByText('Done')).toBeVisible();

  await palette.getByRole('button', { name: 'Back to commands' }).click();
  await palette.getByRole('combobox').fill('security');
  await palette.getByRole('option', { name: 'Security', exact: true }).click();
  await expect(page).toHaveURL(/\/account\/security$/);
});
