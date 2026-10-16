import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import {
  errorEnvelope,
  notificationState,
  resetNotificationState,
  resetReminderState,
  server,
  testActivity,
} from '@/test/msw';
import { renderApp } from '@/test/render';

const MEDICINE = 'Medicine is here. Give it a try!';

async function open(path: string, heading: string) {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: heading });
  return view;
}

/** The list row holding `text`. */
async function row(text: string) {
  const item = (await screen.findByText(text)).closest('li');
  if (!item) throw new Error(`no row for ${text}`);
  return item;
}

beforeAll(async () => {
  await Promise.all([
    import('@/platform/notifications/notifications-page'),
    import('@/platform/activity/activity-page'),
    import('@/platform/welcome/welcome-page'),
  ]);
}, 120_000);

describe('notifications', () => {
  it('lists them newest first and marks which are unread', async () => {
    await open('/notifications', 'Notifications');

    const unread = await row(MEDICINE);
    expect(within(unread).getByText('Unread')).toBeInTheDocument();
    const read = await row('Expenses is here. Give it a try!');
    expect(within(read).queryByText('Unread')).toBeNull();
    expect(within(read).getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText('1 unread', { selector: 'p' })).toBeInTheDocument();
  });

  it('marks one as read', async () => {
    const { user } = await open('/notifications', 'Notifications');

    await user.click(await screen.findByRole('button', { name: `Mark as read: ${MEDICINE}` }));

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Mark as read/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).toBeNull();
  });

  it('marks everything as read at once', async () => {
    const { user } = await open('/notifications', 'Notifications');

    await user.click(await screen.findByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => {
      expect(notificationState.every((item) => item.read)).toBe(true);
    });
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
  });

  it('removes one', async () => {
    const { user } = await open('/notifications', 'Notifications');

    await user.click(await screen.findByRole('button', { name: `Remove: ${MEDICINE}` }));

    await waitFor(() => {
      expect(screen.queryByText(MEDICINE)).toBeNull();
    });
    expect(notificationState.map((item) => item.id)).toEqual(['n-2']);
  });

  it('follows a launch notice to its module, which counts as reading it', async () => {
    const { user, router } = await open('/notifications', 'Notifications');

    await user.click(await screen.findByRole('link', { name: MEDICINE }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?module=medicine');
    });
    await waitFor(() => {
      expect(notificationState.find((item) => item.id === 'n-1')?.read).toBe(true);
    });
  });

  it("words a module's notice with money in the user's language, and leads to its page", async () => {
    resetNotificationState([
      {
        id: 'n-price',
        type: 'expenses.price_alert',
        params: {
          module: 'expenses',
          product: 'Onion',
          product_id: 'p-onion',
          price_minor: 6000,
          limit_minor: 5000,
          currency: 'INR',
          unit: 'kg',
        },
        read: false,
        at: '2026-10-08T10:00:00Z',
      },
    ]);
    await open('/notifications', 'Notifications');

    const notice = await screen.findByRole('link', {
      name: 'Onion cost ₹60/kg, more than the ₹50 you set',
    });
    expect(notice).toHaveAttribute('href', '/m/expenses/prices/p-onion');
  });

  it('shows what is coming up above the notifications', async () => {
    resetReminderState([
      {
        id: 'r-1',
        type: 'notes.due',
        params: { module: 'notes', reminder_id: 'r-1', due_on: '2026-10-20' },
        due_on: '2026-10-20',
        remind_at: '2026-10-20T03:30:00Z',
        sent: false,
        snoozed_until: null,
      },
    ]);
    await open('/notifications', 'Notifications');

    const panel = await screen.findByRole('region', { name: 'Coming up' });
    expect(within(panel).getByText('notes.due')).toBeInTheDocument(); // no module words it
    expect(
      panel.compareDocumentPosition(await row(MEDICINE)) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows an unknown kind of notice by its code rather than hiding it', async () => {
    resetNotificationState([
      { id: 'n-9', type: 'budget.exceeded', params: {}, read: false, at: '2026-10-08T10:00:00Z' },
    ]);
    await open('/notifications', 'Notifications');

    expect(await screen.findByText('budget.exceeded')).toBeInTheDocument();
  });

  it('says when there are none, and explains a failed load', async () => {
    resetNotificationState([]);
    server.use(
      http.get(
        '*/api/v1/notifications',
        () => HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
        { once: true },
      ),
    );
    const { user } = await open('/notifications', 'Notifications');

    expect(await screen.findByText("We couldn't load your notifications.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No notifications')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    await open('/notifications', 'Notifications');
    await row(MEDICINE);

    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('activity', () => {
  it('lists what the user did, and loads older entries on request', async () => {
    const older = {
      id: 'a-3',
      type: 'module.hidden',
      params: { module: 'meals' },
      at: '2026-10-01T10:00:00Z',
    };
    server.use(
      http.get('*/api/v1/activity', ({ request }) => {
        const first = new URL(request.url).searchParams.get('page') === '1';
        return HttpResponse.json({
          items: first ? testActivity : [older],
          page: first ? 1 : 2,
          page_size: 2,
          total: 3,
          has_next: first,
        });
      }),
    );
    const { user } = await open('/activity', 'Activity');

    expect(await screen.findByText('Added Journal to favourites')).toBeInTheDocument();
    expect(screen.getByText('Asked to hear when Receipts & warranty launches')).toBeInTheDocument();
    expect(screen.queryByText('Hid Meal planner')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(await screen.findByText('Hid Meal planner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('says when nothing has happened yet', async () => {
    server.use(
      http.get('*/api/v1/activity', () =>
        HttpResponse.json({ items: [], page: 1, page_size: 50, total: 0, has_next: false }),
      ),
    );
    await open('/activity', 'Activity');

    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });
});
