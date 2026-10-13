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
  await page.route('**/api/v1/notifications?*', (route) => {
    const unreadOnly = new URL(route.request().url()).searchParams.get('unread') === 'true';
    const items = notifications.filter((item) => !unreadOnly || !item.read);
    return route.fulfill({
      json: { items, page: 1, page_size: 50, total: items.length, has_next: false },
    });
  });
  await page.route('**/api/v1/dashboard?*', (route) => route.fulfill({ json: dashboard }));
}

const notifications = [
  {
    id: 'n-1',
    type: 'module.launched',
    params: { module: 'expenses' },
    read: false,
    at: '2026-10-08T10:00:00Z',
  },
];
const dashboard = {
  start: '2026-09-09',
  end: '2026-10-08',
  widgets: [
    {
      key: 'activity_actions',
      owner: 'activity',
      kind: 'kpi',
      data: { kind: 'kpi', value: 12, previous: 8, format: 'number' },
    },
    {
      key: 'agents_requests',
      owner: 'agents',
      kind: 'series',
      data: {
        kind: 'series',
        format: 'number',
        points: [
          { day: '2026-10-06', value: 2 },
          { day: '2026-10-07', value: 0 },
          { day: '2026-10-08', value: 5 },
        ],
      },
    },
  ],
};

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

/** Today in the test user's time zone, as the API writes days. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: user.timezone }).format(new Date());

function listOf(items: unknown[]) {
  return { items, page: 1, page_size: 50, total: items.length, has_next: false };
}

interface StubEntry {
  id: string;
  kind: string;
  title: string;
  amount_minor: number;
  deleted: boolean;
  revision_no: number;
  [field: string]: unknown;
}

/** A small in-memory expenses API. Returns the Idempotency-Keys it was sent. */
async function stubExpenses(page: Page): Promise<string[]> {
  const entries: StubEntry[] = [];
  const keys: string[] = [];
  const category = (id: string, kind: string, icon: string) => ({
    id,
    kind,
    key: id,
    name: null,
    icon,
    accent: 'emerald',
    system: true,
    archived: false,
  });
  const idOf = (url: string) => /entries\/([^/?]+)/.exec(url)?.[1];
  const revision = (entry: StubEntry, action: string) => ({
    revision_no: entry.revision_no,
    action,
    changed_at: new Date().toISOString(),
    source: 'manual',
    changes: [],
    snapshot: {},
  });
  const history = new Map<string, unknown[]>();

  await page.route('**/api/v1/expenses/categories', (route) =>
    route.fulfill({
      json: listOf([category('groceries', 'expense', '🛒'), category('salary', 'income', '💼')]),
    }),
  );
  await page.route('**/api/v1/expenses/entries**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const entry = entries.find((item) => item.id === idOf(url.pathname));
    const live = entries.filter((item) => !item.deleted);

    if (url.pathname.endsWith('/summary')) {
      const spent = live.reduce((sum, item) => sum + item.amount_minor, 0);
      const totals = [
        { currency: 'INR', expense_minor: spent, income_minor: 0, count: live.length },
      ];
      return route.fulfill({ json: { totals: live.length ? totals : [] } });
    }
    if (url.pathname.endsWith('/facets')) {
      return route.fulfill({ json: { tags: [], for_whom: [], merchants: [] } });
    }
    if (url.pathname.endsWith('/revisions')) {
      return route.fulfill({ json: listOf(history.get(entry?.id ?? '') ?? []) });
    }
    if (url.pathname.endsWith('/entries') && request.method() === 'GET') {
      return route.fulfill({ json: listOf(live) });
    }
    if (url.pathname.endsWith('/entries')) {
      keys.push(request.headers()['idempotency-key'] ?? '');
      const created: StubEntry = {
        ...(request.postDataJSON() as StubEntry),
        id: `e-${entries.length + 1}`,
        currency: 'INR',
        source: 'manual',
        revision_no: 1,
        deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      entries.push(created);
      history.set(created.id, [revision(created, 'create')]);
      return route.fulfill({ status: 201, json: created });
    }
    if (!entry) return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'x' } });
    if (request.method() === 'GET') return route.fulfill({ json: entry });
    // DELETE, or POST .../undelete: flip it and add to the history.
    entry.deleted = request.method() === 'DELETE';
    entry.revision_no += 1;
    history.get(entry.id)?.unshift(revision(entry, entry.deleted ? 'delete' : 'undelete'));
    return entry.deleted ? route.fulfill({ status: 204 }) : route.fulfill({ json: entry });
  });
  return keys;
}

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

test('the dashboard reads out its chart from the keyboard and changes period', async ({ page }) => {
  await stubApi(page);
  await page.goto('/dashboard');

  const actions = page.getByRole('region', { name: 'Actions taken' });
  await expect(actions.getByText('+50% vs the 30 days before')).toBeVisible();
  const chart = page.getByRole('slider', { name: /^Assistant requests/ });
  await expect(chart).toHaveAttribute('aria-valuetext', 'Oct 8: 5');
  await chart.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(chart).toHaveAttribute('aria-valuetext', 'Oct 7: 0');

  await page.getByRole('button', { name: 'Last 7 days' }).click();
  await expect(page).toHaveURL(/\/dashboard\?range=7$/);
  await expect(actions.getByText('+50% vs the 7 days before')).toBeVisible();
});

test('unread notifications show in the navigation and can be cleared', async ({ page }) => {
  await stubApi(page);
  let read = false;
  await page.route('**/api/v1/notifications?*', (route) => {
    const unreadOnly = new URL(route.request().url()).searchParams.get('unread') === 'true';
    const items = notifications
      .map((item) => ({ ...item, read }))
      .filter((item) => !unreadOnly || !item.read);
    return route.fulfill({
      json: { items, page: 1, page_size: 50, total: items.length, has_next: false },
    });
  });
  await page.route('**/api/v1/notifications/read-all', (route) => {
    read = true;
    return route.fulfill({ status: 204 });
  });
  await page.goto('/');

  await page.getByRole('link', { name: 'Notifications, 1 unread' }).click();
  await expect(page.getByText('Expenses is here. Give it a try!')).toBeVisible();
  await page.getByRole('button', { name: 'Mark all as read' }).click();

  await expect(page.getByText("You're all caught up")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Notifications', exact: true })).toBeVisible();
});

/** True when the page is no wider than the screen, so nothing scrolls sideways. */
const fitsWidth = (page: Page) =>
  page.evaluate<boolean>('document.documentElement.scrollWidth <= window.innerWidth');

test('an expense is added, opened, deleted and brought back', async ({ page }) => {
  await stubApi(page);
  const keys = await stubExpenses(page);
  await page.goto('/m/expenses');
  await expect(page.getByRole('heading', { level: 1, name: 'Expenses' })).toBeVisible();
  await expect(page.getByText('Nothing here yet')).toBeVisible();

  await page.getByRole('button', { name: 'Add entry' }).click();
  const form = page.getByRole('dialog', { name: 'Add an entry' });
  await form.getByLabel('Amount (INR)').fill('250.50');
  await form.getByLabel('What was it?').fill('Vegetables');
  await form.getByText('Groceries').click();
  await form.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Added Vegetables')).toBeVisible();
  const day = page.getByRole('region', { name: 'Today' });
  await expect(day.getByText('−₹250.50')).toBeVisible();
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);

  await day.getByRole('link', { name: 'Vegetables' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vegetables' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'History' }).getByText('Added')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/m\/expenses$/);
  await expect(page.getByText('Nothing here yet')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('link', { name: 'Vegetables' })).toBeVisible();
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the main navigation is a bottom bar and nothing overflows sideways', async ({ page }) => {
    await stubApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link')).toHaveCount(3);
    const box = await nav.boundingBox();
    expect(box && box.y + box.height).toBe(812); // sits on the bottom edge
    expect(await fitsWidth(page)).toBe(true);

    await nav.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    expect(await fitsWidth(page)).toBe(true);
  });

  test('adding an expense is within reach of the thumb', async ({ page }) => {
    await stubApi(page);
    await stubExpenses(page);
    await page.goto('/m/expenses');

    const add = await page.getByRole('button', { name: 'Add entry' }).boundingBox();
    const nav = await page.getByRole('navigation', { name: 'Main' }).boundingBox();
    expect(add && nav && add.y + add.height <= nav.y).toBe(true); // floats above the bar
    expect(add && add.x + add.width).toBeGreaterThan(300); // at the right edge
    expect(await fitsWidth(page)).toBe(true);
  });
});
