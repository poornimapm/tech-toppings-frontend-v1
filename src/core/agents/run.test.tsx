import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import en from '@/core/agents/i18n/en.json';
import hi from '@/core/agents/i18n/hi.json';
import ta from '@/core/agents/i18n/ta.json';
import { useRun, type RunStage } from '@/core/agents/run';
import { RunStages } from '@/core/agents/run-stages';
import { backgroundRun, serveRun, server } from '@/test/msw';
import { createTestQueryClient } from '@/test/render';
import { expectSameKeysAndPlaceholders } from '@/test/translations';

/** Asked about every 10 ms in these tests, rather than every 1.5 s. */
const QUICK = { every: 10, limit: 60_000 };
/** Every stage a run records, each once: a stage added to the API fails the check below. */
const STAGES: Record<RunStage, true> = {
  understanding: true,
  reading: true,
  drafting: true,
  proposing: true,
  checking: true,
  done: true,
};

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

/** Long enough for several more asks, had any been due. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
  });

describe('following a background run', () => {
  it('asks again while it works, follows its stages, and never asks once it has ended', async () => {
    const asked = serveRun(
      backgroundRun(),
      backgroundRun({ stages: ['understanding', 'reading'] }),
      backgroundRun({
        status: 'completed',
        stages: ['understanding', 'reading', 'drafting', 'checking', 'done'],
      }),
    );
    const { result } = renderHook(() => useRun('run-7', QUICK), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('completed');
    });
    expect(result.current.data?.stages).toEqual([
      'understanding',
      'reading',
      'drafting',
      'checking',
      'done',
    ]);
    expect(asked).toEqual(['run-7', 'run-7', 'run-7']);
    await settle();
    expect(asked).toHaveLength(3);
  });

  it('asks nothing without a run, and stops when the page leaves', async () => {
    const asked = serveRun(backgroundRun());
    const { rerender, unmount } = renderHook(({ id }) => useRun(id, QUICK), {
      wrapper,
      initialProps: { id: null as string | null },
    });
    await settle();
    expect(asked).toEqual([]);

    rerender({ id: 'run-7' });
    await waitFor(() => {
      expect(asked.length).toBeGreaterThan(1);
    });
    unmount();
    const seen = asked.length;
    await settle();
    expect(asked).toHaveLength(seen);
  });

  it('follows a run for 150 s, past the longest the server lets one work (120 s)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const asked = serveRun(backgroundRun());
      const { result } = renderHook(() => useRun('run-7'), { wrapper });
      await waitFor(() => {
        expect(asked).toHaveLength(1);
      });
      vi.setSystemTime(Date.now() + 149_000);
      await waitFor(
        () => {
          expect(asked).toHaveLength(2);
        },
        { timeout: 4000 },
      );
      expect(result.current.data?.status).toBe('running');

      vi.setSystemTime(Date.now() + 2000);
      await waitFor(
        () => {
          expect(result.current.data).toMatchObject({ status: 'incomplete', reason: 'timeout' });
        },
        { timeout: 4000 },
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads a run still working past its time as stopped for taking too long, as the server does', async () => {
    const asked = serveRun(backgroundRun());
    const { result } = renderHook(() => useRun('run-7', { every: 10, limit: 30 }), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toMatchObject({ status: 'incomplete', reason: 'timeout' });
    });
    const seen = asked.length;
    await settle();
    expect(asked).toHaveLength(seen);
  });

  it("stops asking when the server can't be reached, and follows on when asked to", async () => {
    let down = false;
    server.use(
      http.get('*/api/v1/agents/runs/:id', () =>
        down ? HttpResponse.error() : HttpResponse.json(backgroundRun()),
      ),
    );
    const { result } = renderHook(() => useRun('run-7', QUICK), { wrapper });
    await waitFor(() => {
      expect(result.current.data?.status).toBe('running');
    });

    down = true;
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    const asked = serveRun(
      backgroundRun({ status: 'completed', stages: ['understanding', 'done'] }),
    );
    await settle();
    expect(asked).toEqual([]); // no more asks once it failed

    await act(() => result.current.refetch());
    await waitFor(() => {
      expect(result.current.data?.status).toBe('completed');
    });
    expect(asked).toEqual(['run-7']);
  });
});

describe('a run’s stages', () => {
  it('names each stage reached in fixed words, announced politely, with Cancel', async () => {
    const onCancel = vi.fn();
    const { container, rerender } = render(<RunStages stages={[]} onCancel={onCancel} />);
    const list = screen.getByRole('list', { name: 'Progress' });
    const words = () =>
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent);
    expect(list.parentElement).toHaveAttribute('aria-live', 'polite');
    expect(words()).toEqual(['Starting']);

    rerender(<RunStages stages={['understanding', 'reading', 'drafting']} onCancel={onCancel} />);
    expect(words()).toEqual([
      'Understanding your request',
      'Reading your records',
      'Writing a draft',
    ]);
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('names each stage once, in the order first reached, the latest one under way', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // A real plan-day run: the model reads, goes back to the model, reads again, then drafts.
    const run: RunStage[] = ['understanding', 'reading', 'checking', 'reading', 'checking'];
    const { rerender } = render(<RunStages stages={run} onCancel={vi.fn()} />);
    const lines = () =>
      within(screen.getByRole('list', { name: 'Progress' }))
        .getAllByRole('listitem')
        .map((item) => [item.textContent, item.getAttribute('aria-current')]);
    expect(lines()).toEqual([
      ['Understanding your request', null],
      ['Reading your records', null],
      ['Working with what it found', 'step'],
    ]);

    rerender(<RunStages stages={[...run, 'drafting', 'checking']} onCancel={vi.fn()} />);
    expect(lines()).toEqual([
      ['Understanding your request', null],
      ['Reading your records', null],
      ['Working with what it found', 'step'],
      ['Writing a draft', null],
    ]);
    rerender(<RunStages stages={[...run, 'drafting', 'checking', 'done']} onCancel={vi.fn()} />);
    expect(lines().at(-1)).toEqual(['Finished', null]);
    expect(lines().every(([, current]) => current === null)).toBe(true);
    expect(logged).not.toHaveBeenCalled(); // no two lines share a key
    logged.mockRestore();
  });

  it('words every stage the API records, in every language', () => {
    expect(Object.keys(en.stages).sort()).toEqual(Object.keys(STAGES).sort());
    expectSameKeysAndPlaceholders({ en, ta, hi });
    for (const stage of Object.keys(STAGES) as RunStage[]) {
      expect(ta.stages[stage]).not.toBe(en.stages[stage]);
      expect(hi.stages[stage]).not.toBe(en.stages[stage]);
    }
  });
});
