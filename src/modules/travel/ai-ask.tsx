import { Sparkles } from 'lucide-react';
import { useId } from 'react';

import type { AgentRun } from '@/core/agents/queries';
import { Alert, Button } from '@/design-system';
import type { AiAction } from '@/modules/travel/ai-action';
import { AiProgress } from '@/modules/travel/ai-progress';
import { LIMITS } from '@/modules/travel/trip-form';

/** The person's words for an AI action: required unless `optional` (its label then says so). */
export interface AiWords {
  label: string;
  hint?: string;
  value: string;
  onChange: (text: string) => void;
  optional?: boolean;
}

/**
 * What an AI action does, the person's words for it if it takes any, and the button that asks:
 * pressed again while it works, or before the words it needs are given, it does nothing (and
 * keeps the focus). `id` is its first control's, for the focus to come back to.
 */
export function AiAsk({
  id,
  about,
  words,
  label,
  working,
  onAsk,
}: {
  id: string;
  about: string;
  words?: AiWords;
  label: string;
  working: boolean;
  onAsk: () => void;
}) {
  const missing = words !== undefined && words.optional !== true && words.value.trim() === '';
  const ready = !working && !missing;
  const hintId = `${id}-hint`;
  return (
    <form
      noValidate
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onAsk();
      }}
    >
      <p className="text-sm text-muted">{about}</p>
      {words && (
        <>
          <label htmlFor={id} className="block text-sm font-medium">
            {words.label}
          </label>
          <textarea
            id={id}
            value={words.value}
            rows={2}
            maxLength={LIMITS.assist}
            aria-describedby={words.hint ? hintId : undefined}
            onChange={(event) => {
              words.onChange(event.target.value);
            }}
            className="block min-h-12 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text"
          />
          {words.hint && (
            <p id={hintId} className="text-sm text-muted">
              {words.hint}
            </p>
          )}
        </>
      )}
      <Button
        type="submit"
        id={words ? undefined : id}
        className="min-h-11"
        aria-disabled={!ready || undefined}
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {label}
      </Button>
    </form>
  );
}

/**
 * An AI action in a dialog, from asking to its draft: `AiAsk` until there is something to show,
 * then its stages while it works (Cancel brings the focus back to the ask), or why it ended with
 * nothing, with Retry and `manual`. `ready` is set once there is something to show: the ask goes,
 * and those words (if any) say so as it comes.
 */
export function AiSteps({
  ai,
  about,
  words,
  label,
  manual,
  said,
  ready,
}: {
  ai: AiAction;
  about: string;
  words?: AiWords;
  label: string;
  manual: string;
  said?: (run: AgentRun) => string;
  ready: string | null;
}) {
  const id = useId();
  const stop = () => {
    ai.stop();
    document.getElementById(id)?.focus();
  };
  return (
    <div className="space-y-3">
      {ready === null && (
        <AiAsk
          id={id}
          about={about}
          words={words}
          label={label}
          working={ai.working}
          onAsk={() => void ai.ask()}
        />
      )}
      <AiProgress action={{ ...ai, stop }} manual={manual} said={said} />
      {/* Kept mounted, so a draft coming in is announced. */}
      <Alert tone="info">{ready}</Alert>
    </div>
  );
}
