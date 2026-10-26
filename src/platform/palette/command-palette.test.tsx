import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import type { RunInput } from '@/core/agents/queries';
import { languageFiles } from '@/core/i18n';
import { useToasts } from '@/design-system';
import { usePalette } from '@/platform/palette/palette-store';

import {
  errorEnvelope,
  moduleState,
  server,
  signedOut,
  testProposal,
  testRun,
  testUser,
} from '@/test/msw';
import { renderApp } from '@/test/render';

async function openPalette(path = '/') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1 });
  await view.user.keyboard('{Control>}k{/Control}');
  const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
  return { ...view, dialog };
}

async function askAssistant(user: ReturnType<typeof renderApp>['user'], text: string) {
  await user.type(screen.getByRole('combobox'), text);
  await user.click(await screen.findByRole('option', { name: `Ask the assistant: “${text}”` }));
}

// Compile the lazy pages once up front, so no single test pays for it.
beforeAll(async () => {
  await Promise.all([
    import('@/platform/welcome/welcome-page'),
    import('@/platform/auth/security-page'),
    import('@/platform/auth/login-page'),
    import('@/platform/notifications/notifications-page'),
    import('@/platform/palette/command-palette'),
  ]);
}, 120_000);

const TAMIL = './locales/ta/common.json';
const realLanguageFiles = { ...languageFiles };

afterEach(() => {
  Object.assign(languageFiles, realLanguageFiles);
});

describe('command palette', () => {
  it('opens with Ctrl+K or the header button and lists what it can do', async () => {
    const { user, dialog } = await openPalette();

    expect(within(dialog).getByRole('option', { name: 'Security' })).toBeInTheDocument();
    expect(within(dialog).getByRole('option', { name: 'Open Expenses' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('option', { name: 'Add Journal to favourites' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('option', { name: 'Show Meal planner' })).toBeInTheDocument();
    expect(within(dialog).getByRole('option', { name: 'Sign out' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await user.click(screen.getByRole('button', { name: 'Search or ask…' }));
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });

  it('filters as you type and goes to a page', async () => {
    const { user, router } = await openPalette();

    await user.type(screen.getByRole('combobox'), 'secur');
    await user.click(screen.getByRole('option', { name: 'Security' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account/security');
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('runs module and preference commands', async () => {
    const { user } = await openPalette();

    await user.click(screen.getByRole('option', { name: 'Add Journal to favourites' }));
    await waitFor(() => {
      expect(moduleState.find((view) => view.key === 'journal')?.pinned).toBe(true);
    });

    await user.keyboard('{Control>}k{/Control}');
    await user.click(await screen.findByRole('option', { name: 'Theme: Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('offers a language again after its download failed, and loads it when chosen', async () => {
    languageFiles[TAMIL] = () => Promise.reject(new Error('offline'));
    const { user } = await openPalette();

    await user.click(screen.getByRole('option', { name: 'Language: தமிழ்' }));
    await waitFor(() => {
      // after i18next's own retries
      expect(useToasts.getState().toasts.map((toast) => toast.message)).toContainEqual(
        expect.stringContaining("தமிழ் couldn't be downloaded"),
      );
    });

    // The app still shows English: Tamil is offered again, English is not.
    Object.assign(languageFiles, realLanguageFiles);
    await user.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
    expect(within(dialog).queryByRole('option', { name: 'Language: English' })).toBeNull();
    await user.click(within(dialog).getByRole('option', { name: 'Language: தமிழ்' }));

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ta');
    });
  });

  it('asks the assistant and confirms what it proposes (quick mode)', async () => {
    let body: unknown;
    server.use(
      http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(testRun(), { status: 201 });
      }),
    );
    const { user } = await openPalette();

    await askAssistant(user, 'pin journal');

    expect(await screen.findByText('Quick mode')).toBeInTheDocument();
    expect(screen.getByText('AI is off for your account.')).toBeInTheDocument();
    expect(screen.getByText('Confirm to add Journal to your favourites.')).toBeInTheDocument();
    expect(body).toMatchObject({ input: 'pin journal', locale: 'en' });
    // The names on screen go along, so the assistant matches the user's own words.
    expect((body as RunInput).context?.modules).toContainEqual({ key: 'journal', name: 'Journal' });
    const proposal = screen.getByText('Add Journal to favourites').closest('li');
    if (!proposal) throw new Error('no proposal row');
    await user.click(within(proposal).getByRole('button', { name: 'Confirm' }));

    expect(await within(proposal).findByText('Done')).toBeInTheDocument();
    expect(moduleState.find((view) => view.key === 'journal')?.pinned).toBe(true);
  });

  it("shows the agent's own words and lets you dismiss a change", async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          testRun({
            mode: 'agent',
            reason: null,
            message: 'I can pin Journal for you.',
            message_code: null,
            proposals: [testProposal({ summary: 'Pin Journal', summary_code: null })],
          }),
          { status: 201 },
        ),
      ),
    );
    const { user } = await openPalette();

    await askAssistant(user, 'please pin my journal');

    expect(await screen.findByText('I can pin Journal for you.')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss: Pin Journal' }));
    expect(await screen.findByText('Dismissed')).toBeInTheDocument();
    expect(moduleState.find((view) => view.key === 'journal')?.pinned).toBe(false);
  });

  it('says honestly when AI is unavailable and lets the user turn it on', async () => {
    let consented = false;
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          consented
            ? testRun({ mode: 'agent', reason: null, message: 'Done thinking.', proposals: [] })
            : testRun({ status: 'unavailable', mode: null, message_code: null, proposals: [] }),
          { status: 201 },
        ),
      ),
      http.patch('*/api/v1/me', async ({ request }) => {
        consented = ((await request.json()) as { ai_consent?: boolean }).ai_consent === true;
        return HttpResponse.json({ ...testUser, ai_consent: consented });
      }),
    );
    const { user } = await openPalette();

    await askAssistant(user, 'pin journal');

    expect(
      await screen.findByText("The assistant can't help with that right now."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Turn on the AI assistant' }));

    expect(await screen.findByText('Done thinking.')).toBeInTheDocument();
    expect(consented).toBe(true);
  });

  it('offers the actions the assistant hands over', async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          testRun({
            message_code: 'manage-modules.ready.open',
            proposals: [],
            client_actions: [{ tool: 'modules_open', arguments: { key: 'journal' } }],
          }),
          { status: 201 },
        ),
      ),
    );
    const { user, router } = await openPalette();

    await askAssistant(user, 'open journal');
    expect(await screen.findByText("Here's Journal.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Journal' }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?module=journal');
    });
    expect(await screen.findByRole('dialog', { name: 'Journal' })).toBeInTheDocument();
  });

  it('tells the user what is new and opens their notifications', async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          testRun({
            skill: 'check-notifications',
            message_code: 'check-notifications.ready.show',
            message_params: { count: 2 },
            proposals: [],
            client_actions: [{ tool: 'notifications_open', arguments: {} }],
          }),
          { status: 201 },
        ),
      ),
    );
    const { user, router } = await openPalette();

    await askAssistant(user, 'anything new');
    expect(await screen.findByText('You have 2 unread notifications.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open notifications' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/notifications');
    });
  });

  it('proposes marking notifications as read, in the right number', async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(
          testRun({
            skill: 'check-notifications',
            message_code: 'check-notifications.ready.mark-read',
            message_params: { count: 1 },
            proposals: [
              testProposal({
                tool: 'notifications_mark_all_read',
                arguments: {},
                summary_code: 'check-notifications.change.mark-read',
                summary_params: { count: 1 },
              }),
            ],
          }),
          { status: 201 },
        ),
      ),
    );
    const { user } = await openPalette();

    await askAssistant(user, 'mark all read');

    expect(await screen.findByText('Confirm to mark 1 notification as read.')).toBeInTheDocument();
    expect(screen.getByText('Mark 1 notification as read')).toBeInTheDocument();
  });

  it('explains failures and offers a retry', async () => {
    server.use(
      http.post('*/api/v1/agents/:name/runs', () =>
        HttpResponse.json(errorEnvelope('AGENT_INPUT_TOO_LONG', 'too long'), { status: 422 }),
      ),
    );
    const { user } = await openPalette();

    await askAssistant(user, 'pin journal');

    expect(
      await screen.findByText('That request is too long. Please shorten it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  // Two full-page axe scans: slow on a busy machine.
  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    const { user } = await openPalette();
    expect(await axe(document.body)).toHaveNoViolations();

    await askAssistant(user, 'pin journal');
    await screen.findByText('Quick mode');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('puts each question from elsewhere to the assistant once, and drops it when closed', async () => {
    const asked: string[] = [];
    server.use(
      http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
        asked.push(((await request.json()) as RunInput).input);
        return HttpResponse.json(testRun({ message: 'Opening Expenses.' }), { status: 201 });
      }),
    );
    const { user } = renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    const shut = async (keys: string) => {
      await user.keyboard(keys);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    };

    act(() => {
      usePalette.getState().ask('open expenses');
    });
    expect(await screen.findByText('Opening Expenses.')).toBeInTheDocument();
    await shut('{Control>}k{/Control}');

    // The same words again are a new question, not the old answer.
    act(() => {
      usePalette.getState().ask('open expenses');
    });
    await waitFor(() => {
      expect(asked).toEqual(['open expenses', 'open expenses']);
    });
    expect(await screen.findByText('Opening Expenses.')).toBeInTheDocument();
    await shut('{Escape}');

    // A question shut away before the palette took it is never sent on a later open.
    act(() => {
      usePalette.getState().ask('pin journal');
      usePalette.getState().toggle();
    });
    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('option', { name: 'Security' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(asked).toEqual(['open expenses', 'open expenses']);
  });

  it('is not offered to signed-out visitors', async () => {
    signedOut();
    const { user } = renderApp('/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    await user.keyboard('{Control>}k{/Control}');

    expect(screen.queryByRole('button', { name: 'Search or ask…' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
