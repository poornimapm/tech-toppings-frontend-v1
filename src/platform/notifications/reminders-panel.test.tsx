import { screen, waitFor, within } from '@testing-library/react';
import { ReceiptText } from 'lucide-react';
import { http, HttpResponse } from 'msw/http';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { components } from '@/core/api/schema';
import { useSession } from '@/core/auth/session-store';
import i18n from '@/core/i18n';
import { buildRegistry, ModuleRegistryContext } from '@/core/modules/registry';
import { defineModule } from '@/core/modules/types';
import { RemindersPanel } from '@/platform/notifications/reminders-panel';
import {
  errorEnvelope,
  reminderState,
  resetModuleState,
  resetReminderState,
  server,
  testModules,
  testUser,
  tokenFor,
} from '@/test/msw';
import { renderWithProviders } from '@/test/render';

type Reminder = components['schemas']['ReminderOut'];

/** A module that reminds of bills, worded in all three languages. */
const bills = defineModule({
  key: 'demo_bills',
  icon: ReceiptText,
  accent: 'amber',
  strings: {
    en: {
      name: 'Bills',
      tagline: 'Pay on time',
      description: 'Bills.',
      feed: { 'demo_bills.due': '{{title}} ({{amount}}) is due on {{due}}' },
    },
    ta: {
      name: 'கட்டணங்கள்',
      tagline: 'நேரத்தில் கட்டுங்கள்',
      description: 'கட்டணங்கள்.',
      feed: { 'demo_bills.due': '{{title}} ({{amount}}) {{due}} அன்று கட்ட வேண்டும்' },
    },
    hi: {
      name: 'बिल',
      tagline: 'समय पर भरें',
      description: 'बिल।',
      feed: { 'demo_bills.due': '{{title}} ({{amount}}) {{due}} तक भरना है' },
    },
  },
  routes: [{ path: 'bills', element: null }],
  links: { 'demo_bills.due': 'bills?focus={{reminder_id}}' },
});
const registry = buildRegistry({ '/src/modules/demo-bills/manifest.ts': { default: bills } });
const billsView = {
  ...testModules[0],
  key: 'demo_bills',
  slug: 'demo-bills',
  stat: null,
} as (typeof testModules)[number];

function reminder(id: string, title: string, dueOn: string, changes: Partial<Reminder> = {}) {
  return {
    id,
    type: 'demo_bills.due',
    params: {
      module: 'demo_bills',
      reminder_id: id,
      due_on: dueOn,
      title,
      amount_minor: 150000,
      currency: 'INR',
    },
    due_on: dueOn,
    remind_at: `${dueOn}T03:30:00Z`,
    sent: true,
    snoozed_until: null,
    ...changes,
  } satisfies Reminder;
}

// Today is 8 October in Kolkata: water was due two days ago and is snoozed until tomorrow;
// rent is due tomorrow and has been told.
const SNOOZED = '2026-10-09T03:30:00Z';
const WATER = reminder('r-water', 'Water', '2026-10-06', {
  remind_at: SNOOZED,
  snoozed_until: SNOOZED,
  sent: false,
});
const WATER_TEXT = 'Water (₹1,500) is due on October 6';
const RENT = reminder('r-rent', 'Rent', '2026-10-09');
const RENT_TEXT = 'Rent (₹1,500) is due on October 9';
const FAILED = "Couldn't change that reminder. Please try again.";

/** Signed in before the panel loads, as the app's routes wait for (so no reload follows). */
function signIn(locale: 'en' | 'ta' | 'hi' = 'en') {
  useSession.setState({
    status: 'authenticated',
    accessToken: 'access-0',
    user: { ...testUser, locale },
  });
  server.use(http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ locale }))));
}

function renderPanel() {
  const router = createMemoryRouter([{ path: '/', element: <RemindersPanel /> }]);
  return renderWithProviders(
    <ModuleRegistryContext value={registry}>
      <RouterProvider router={router} />
    </ModuleRegistryContext>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-08T06:00:00Z') });
  resetModuleState([billsView]);
  resetReminderState([WATER, RENT]);
  signIn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('coming up', () => {
  it('words each reminder as its module does, says when it is due and leads to it', async () => {
    renderPanel();

    const panel = await screen.findByRole('region', { name: 'Coming up' });
    const rent = await within(panel).findByRole('link', { name: RENT_TEXT });
    expect(rent).toHaveAttribute('href', '/m/demo-bills/bills?focus=r-rent');
    expect(within(panel).getByText('Due tomorrow')).toBeInTheDocument();
    expect(
      within(panel).getByText("Was due 2 days ago · We'll remind you tomorrow"),
    ).toBeInTheDocument();
  });

  it('puts one off for a few days', async () => {
    const { user } = renderPanel();

    await user.click(
      await screen.findByRole('button', { name: `Remind me in 3 days: ${RENT_TEXT}` }),
    );

    expect(await screen.findByText("We'll remind you in 3 days")).toBeInTheDocument();
    expect(reminderState.find((item) => item.id === 'r-rent')?.remind_at).toBe(
      '2026-10-11T03:30:00Z',
    );
    expect(
      await screen.findByText("Due tomorrow · We'll remind you in 3 days"),
    ).toBeInTheDocument();
  });

  it('dismisses one, keeping keyboard focus in the list', async () => {
    const { user } = renderPanel();

    (await screen.findByRole('button', { name: `Dismiss reminder: ${RENT_TEXT}` })).focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: RENT_TEXT })).toBeNull();
    });
    expect(reminderState.map((item) => item.id)).toEqual(['r-water']);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: WATER_TEXT })).toHaveFocus();
    });
  });

  it('refreshes the bell after a change', async () => {
    const { user, queryClient } = renderPanel();
    const bell = ['user', 'notifications', 'unread'];
    queryClient.setQueryData(bell, 2);

    await user.click(await screen.findByRole('button', { name: `Dismiss reminder: ${RENT_TEXT}` }));

    await waitFor(() => {
      expect(queryClient.getQueryState(bell)?.isInvalidated).toBe(true);
    });
  });

  it.each([
    { action: 'snooze', name: `Remind me tomorrow: ${RENT_TEXT}` },
    { action: 'dismiss', name: `Dismiss reminder: ${RENT_TEXT}` },
  ])('says so when a $action fails', async ({ action, name }) => {
    server.use(
      http.post(`*/api/v1/reminders/:id/${action}`, () =>
        HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
      ),
    );
    const { user } = renderPanel();

    await user.click(await screen.findByRole('button', { name }));

    expect(await screen.findByText(FAILED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: RENT_TEXT })).toBeInTheDocument();
  });

  it('never promises a time already past', async () => {
    // Its time came, but the catch-up that tells it has not run yet.
    resetReminderState([
      reminder('r-gas', 'Gas', '2026-10-08', { remind_at: '2026-10-07T03:30:00Z', sent: false }),
    ]);
    renderPanel();

    await screen.findByRole('link', { name: 'Gas (₹1,500) is due on October 8' });
    expect(screen.getByText('Due today')).toBeInTheDocument();
    expect(screen.queryByText(/remind you/)).toBeNull();
  });

  it('shows more when there are more', async () => {
    server.use(
      http.get('*/api/v1/reminders', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        const items = [page === 1 ? RENT : WATER];
        return HttpResponse.json({ items, page, page_size: 1, total: 2, has_next: page === 1 });
      }),
    );
    const { user } = renderPanel();

    await user.click(await screen.findByRole('button', { name: 'Show more' }));

    expect(await screen.findByRole('link', { name: WATER_TEXT })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: RENT_TEXT })).toBeInTheDocument();
  });

  it.each([
    {
      locale: 'ta' as const,
      title: 'வரவிருப்பவை',
      text: 'Rent (₹1,500) 9 அக்டோபர் அன்று கட்ட வேண்டும்',
      due: 'கெடு: நாளை',
      overdue: 'கெடு முடிந்தது: நேற்று முன்தினம் · நாளை நினைவூட்டுவோம்',
      snooze: 'நாளை நினைவூட்டு',
    },
    {
      locale: 'hi' as const,
      title: 'आने वाले रिमाइंडर',
      text: 'Rent (₹1,500) 9 अक्टूबर तक भरना है',
      due: 'अंतिम तिथि: कल',
      overdue: 'अंतिम तिथि निकल गई: परसों · हम कल याद दिलाएँगे',
      snooze: 'कल याद दिलाएँ',
    },
  ])('speaks $locale', async ({ locale, title, text, due, overdue, snooze }) => {
    signIn(locale);
    await i18n.changeLanguage(locale);
    renderPanel();

    const panel = await screen.findByRole('region', { name: title });
    expect(await within(panel).findByRole('link', { name: text })).toBeInTheDocument();
    expect(within(panel).getByText(due)).toBeInTheDocument();
    expect(within(panel).getByText(overdue)).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: `${snooze}: ${text}` })).toBeInTheDocument();
  });

  it('stays out of the way when nothing is coming up', async () => {
    resetReminderState([]);
    const { queryClient } = renderPanel();

    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });
    expect(screen.queryByRole('region', { name: 'Coming up' })).toBeNull();
  });

  it('explains a failed load and tries again', async () => {
    server.use(
      http.get(
        '*/api/v1/reminders',
        () => HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'boom'), { status: 500 }),
        { once: true },
      ),
    );
    const { user } = renderPanel();

    expect(await screen.findByText("We couldn't load your reminders.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: RENT_TEXT })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    renderPanel();
    await screen.findByRole('link', { name: RENT_TEXT });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
