import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ClientAction } from '@/core/agents/queries';
import { cancelRun, useRun } from '@/core/agents/run';
import { toLanguage, type Language } from '@/core/i18n';
import { failureCode, travelKeys, type Trip } from '@/modules/travel/api';

interface AiActionSpec<T> {
  /** The client tool whose action carries the draft. */
  tool: string;
  /** Starts the run: its route answers 202 with the background run's id. */
  start: (locale: Language) => Promise<{ run_id: string }>;
  /** The draft out of the action's arguments, or null when there is nothing usable in it: what
   *  an AI hands over is never taken for granted. */
  read: (action: ClientAction) => T | null;
  /** The trip it helps with, if one is saved yet. */
  tripId?: string;
}

/** A run nobody follows any more is stopped: it would only use up the day's AI. Fire and forget:
 *  one that has ended meanwhile, or can't be reached, is let be. */
const letGo = (runId: string) => void cancelRun(runId).catch(() => undefined);

/**
 * One of Travel's AI actions: started, followed while it works, then its draft (also from a run
 * that stopped after drafting), or, without one, the run that says why. Nothing is saved by it:
 * the page shows the draft in its usual preview, and the person applies it there or not at all.
 */
export function useAiAction<T>({ tool, start, read, tripId }: AiActionSpec<T>) {
  const { i18n } = useTranslation();
  const client = useQueryClient();
  const begin = useMutation({
    mutationFn: start,
    onError: (error) => {
      // The trip left Basic AI elsewhere: the page shows its real mode, and no AI help on it.
      if (tripId && failureCode(error) === 'TRAVEL_AI_OFF') {
        void client.invalidateQueries({ queryKey: travelKeys.trip(tripId) });
        void client.invalidateQueries({ queryKey: travelKeys.overview(tripId) });
      }
    },
  });
  const [runId, setRunId] = useState<string | null>(null);
  const follow = useRun(runId);
  // Each ask, numbered: one that answers after Cancel, or after a newer ask, is let go.
  const asked = useRef(0);
  const run = runId === null ? undefined : follow.data;
  const ended = run?.status === 'running' ? undefined : run;
  const action = ended?.client_actions.find((each) => each.tool === tool);

  const ask = async () => {
    asked.current += 1;
    const mine = asked.current;
    setRunId(null);
    // A refusal (the trip isn't in Basic, too many requests...) is shown from `error`.
    const started = await begin.mutateAsync(toLanguage(i18n.language)).catch(() => null);
    if (!started) return;
    if (asked.current === mine) setRunId(started.run_id);
    else letGo(started.run_id); // cancelled while it was starting
  };

  /** Stops the run (Cancel), or forgets the answer (a draft used or put aside). */
  const stop = () => {
    asked.current += 1;
    if (runId !== null && !ended) letGo(runId);
    begin.reset();
    setRunId(null);
  };

  const lost = runId !== null && follow.isError;
  return {
    ask,
    stop,
    /** Asked, and not ended yet: its stages show meanwhile. */
    working: begin.isPending || (runId !== null && !lost && !ended),
    stages: run?.stages ?? [],
    /** The run, once it has ended. */
    ended,
    draft: action ? read(action) : null,
    /** Why it couldn't be started, or followed. */
    error: begin.error ?? (lost ? follow.error : null),
    /** Asked again; a run that couldn't be followed is followed again rather than asked anew. */
    retry: () => {
      if (lost) void follow.refetch();
      else void ask();
    },
  };
}

export type AiAction = ReturnType<typeof useAiAction>;

/** AI helps only a trip in Basic AI (Premium stays locked): on any other, none of it is offered. */
export const aiHelps = (trip: Pick<Trip, 'mode'>) => trip.mode === 'basic';
