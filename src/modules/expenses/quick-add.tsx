import { Mic, Sparkles, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAiConsent } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { errorKey, toLanguage } from '@/core/i18n';
import { useDictation } from '@/core/speech/speech';
import { cx } from '@/core/utils/cx';
import { todayIn } from '@/core/utils/dates';
import { Button } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import {
  DRAFT_TOOL,
  draftsFrom,
  useCapture,
  useReadBack,
  type Draft,
} from '@/modules/expenses/capture';
import { NS } from '@/modules/expenses/i18n';

const TOGGLE =
  'grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted transition-colors ' +
  'hover:text-text aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary';

/**
 * Say, type or paste what was spent; it comes back as drafts to check. The microphone shows
 * only where the browser can listen, and what it hears can be corrected before it is read.
 */
export function QuickAdd({ onDrafts }: { onDrafts: (drafts: Draft[]) => void }) {
  const { t, i18n } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const user = useSession((state) => state.user);
  const [text, setText] = useState('');
  const [spoken, setSpoken] = useState(false);
  const capture = useCapture();
  const consent = useAiConsent();
  const readBack = useReadBack();
  const dictation = useDictation(toLanguage(i18n.language), (heard) => {
    setText(heard);
    setSpoken(true);
  });
  const { run } = capture;
  const failure = failureCode(capture.error);

  async function read() {
    const input = text.trim();
    if (!input) return;
    dictation.stop();
    const answer = await capture.read(input, spoken ? 'speech' : 'text').catch(() => null);
    const action = answer?.client_actions.find((item) => item.tool === DRAFT_TOOL);
    const drafts = draftsFrom(action, todayIn(user?.timezone));
    if (drafts.length === 0) return; // the status line below says why
    onDrafts(drafts);
    setText('');
    setSpoken(false);
  }

  let status: React.ReactNode = null;
  if (capture.pending) status = t('capture.reading');
  else if (dictation.listening) status = t('capture.listening');
  else if (dictation.error) status = t('capture.speechError');
  else if (failure) status = tError(errorKey(failure));
  else if (run?.status === 'unavailable') {
    status = (
      <span className="flex flex-wrap items-center gap-2">
        {tCommon('agents.unavailable')} {run.reason && tCommon(`agents.reason.${run.reason}`)}
        {run.reason === 'consent' && (
          <Button
            variant="secondary"
            disabled={consent.isPending}
            onClick={() => {
              consent.mutate(undefined, { onSuccess: () => void read() });
            }}
          >
            {tCommon('agents.enable')}
          </Button>
        )}
      </span>
    );
  } else if (run && !run.client_actions.some((item) => item.tool === DRAFT_TOOL)) {
    status = run.message ?? t('capture.nothing');
  } else if (run?.mode) status = t('capture.readBy', { mode: tCommon(`agents.mode.${run.mode}`) });

  return (
    <section
      aria-label={t('capture.label')}
      className="rounded-3xl border border-border bg-glass p-3 shadow-sm backdrop-blur-xl"
    >
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void read();
        }}
      >
        <input
          aria-label={t('capture.label')}
          value={text}
          placeholder={t('capture.placeholder')}
          autoComplete="off"
          onChange={(event) => {
            setText(event.target.value);
            setSpoken(false); // corrected by hand: no longer just what was heard
          }}
          className="h-10 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-text"
        />
        {dictation.supported && (
          <button
            type="button"
            aria-pressed={dictation.listening}
            aria-label={t(dictation.listening ? 'capture.stop' : 'capture.listen')}
            onClick={dictation.listening ? dictation.stop : dictation.start}
            className={cx(TOGGLE, dictation.listening && 'animate-pulse')}
          >
            <Mic aria-hidden="true" className="size-5" />
          </button>
        )}
        <button
          type="button"
          aria-pressed={readBack.on}
          aria-label={t('capture.readBack')}
          title={t('capture.readBack')}
          onClick={readBack.toggle}
          className={TOGGLE}
        >
          <Volume2 aria-hidden="true" className="size-5" />
        </button>
        <Button type="submit" className="rounded-full" disabled={capture.pending || !text.trim()}>
          <Sparkles aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">{t('capture.send')}</span>
        </Button>
      </form>
      <p role="status" className="min-h-5 px-2 pt-2 text-sm text-muted">
        {status}
      </p>
    </section>
  );
}
