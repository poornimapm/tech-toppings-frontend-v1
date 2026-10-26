import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { useSession } from '@/core/auth/session-store';
import { FakeRecognition, installFakeRecognition } from '@/core/speech/fake-recognition';
import { usePalette } from '@/platform/palette/palette-store';
import { server, testRun, tokenFor } from '@/test/msw';
import { renderApp } from '@/test/render';

beforeAll(async () => {
  await Promise.all([
    import('@/platform/welcome/welcome-page'),
    import('@/platform/palette/command-palette'),
    import('@/modules/expenses/entries-page'),
  ]);
}, 120_000);

const SWITCH = 'Simple mode: larger text, fewer fields';

describe('simple mode', () => {
  it('is turned on for the account, makes the type larger and starts the home with the voice', async () => {
    let saved: unknown = null;
    server.use(
      http.patch('*/api/v1/me', async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ ...tokenFor().user, ...(saved as object) });
      }),
    );
    const { user } = renderApp('/');
    const toggle = await screen.findByRole('button', { name: SWITCH });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('heading', { name: 'What would you like to do?' })).toBeNull();

    await user.click(toggle);
    expect(saved).toEqual({ ui_mode: 'simple' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.uiMode).toBe('simple');
    expect(
      await screen.findByRole('heading', { name: 'What would you like to do?' }),
    ).toBeInTheDocument();

    await user.click(toggle);
    expect(saved).toEqual({ ui_mode: 'standard' });
    expect(document.documentElement.dataset.uiMode).toBe('standard');
  });

  it('puts what is typed (or said) to the assistant, which answers in the palette', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ ui_mode: 'simple' }))),
    );
    const asked: unknown[] = [];
    server.use(
      http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
        asked.push(await request.json());
        return HttpResponse.json(testRun({ message: 'Opening Expenses.' }), { status: 201 });
      }),
    );
    const { user } = renderApp('/');
    const card = within(
      (await screen.findByRole('heading', { name: 'What would you like to do?' })).closest(
        'section',
      ) ?? document.body,
    );

    await user.type(card.getByRole('textbox', { name: 'Or type it here' }), '250 for vegetables');
    await user.click(card.getByRole('button', { name: 'Go' }));

    const palette = await screen.findByRole('dialog');
    expect(await within(palette).findByText('Opening Expenses.')).toBeInTheDocument();
    expect(within(palette).getByRole('combobox')).toHaveValue('250 for vegetables');
    await waitFor(() => {
      expect(asked).toHaveLength(1);
    });
    expect(asked[0]).toMatchObject({ input: '250 for vegetables', locale: 'en' });
  });

  describe('with a microphone', () => {
    let uninstall: () => void;
    beforeEach(() => {
      uninstall = installFakeRecognition();
      server.use(
        http.post('*/api/v1/auth/refresh', () =>
          HttpResponse.json(tokenFor({ ui_mode: 'simple' })),
        ),
      );
    });
    afterEach(() => {
      uninstall();
    });

    async function speakCard() {
      const view = renderApp('/');
      const heading = await screen.findByRole('heading', { name: 'What would you like to do?' });
      return { ...view, card: within(heading.closest('section') ?? document.body) };
    }

    it('shows the words as they are heard and asks once, with the final words', async () => {
      const asked: unknown[] = [];
      server.use(
        http.post('*/api/v1/agents/:name/runs', async ({ request }) => {
          asked.push(await request.json());
          return HttpResponse.json(testRun({ message: 'Opening Expenses.' }), { status: 201 });
        }),
      );
      const { user, card } = await speakCard();

      await user.click(card.getByRole('button', { name: 'Tap and speak' }));
      const recognition = FakeRecognition.last;
      act(() => {
        recognition?.hear('250');
        recognition?.hear('250 for');
      });
      expect(card.getByRole('textbox', { name: 'Or type it here' })).toHaveValue('250 for');
      expect(usePalette.getState().open).toBe(false); // nothing asked yet
      act(() => {
        recognition?.hear('250 for vegetables');
        recognition?.settle('250 for vegetables');
      });

      const palette = await screen.findByRole('dialog');
      expect(await within(palette).findByText('Opening Expenses.')).toBeInTheDocument();
      act(() => {
        recognition?.settle('250 for vegetables'); // some browsers repeat the final result
      });
      expect(usePalette.getState().question).toBeNull();
      expect(asked).toEqual([expect.objectContaining({ input: '250 for vegetables' })]);
    });

    it('says why it could not listen, and points to the box when the microphone is blocked', async () => {
      const { user, card } = await speakCard();

      await user.click(card.getByRole('button', { name: 'Tap and speak' }));
      act(() => {
        FakeRecognition.last?.onerror?.({ error: 'not-allowed' });
        FakeRecognition.last?.onend?.();
      });
      expect(card.getByRole('status')).toHaveTextContent(
        "The microphone isn't allowed for this site. Type it in the box below instead.",
      );

      await user.click(card.getByRole('button', { name: 'Tap and speak' }));
      act(() => {
        FakeRecognition.last?.onerror?.({ error: 'no-speech' });
        FakeRecognition.last?.onend?.();
      });
      expect(card.getByRole('status')).toHaveTextContent("Couldn't hear that.");
    });
  });

  it('asks a new entry only for the essentials', async () => {
    useSession.setState({ user: { ...tokenFor({ ui_mode: 'simple' }).user } });
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ ui_mode: 'simple' }))),
    );
    const { user } = renderApp('/m/expenses');
    await user.click(await screen.findByRole('button', { name: 'Add entry' }));
    const form = within(await screen.findByRole('dialog', { name: 'Add an entry' }));
    expect(form.getByRole('textbox', { name: /Amount/ })).toBeInTheDocument();
    expect(form.queryByText('More details')).toBeNull();
  });
});
