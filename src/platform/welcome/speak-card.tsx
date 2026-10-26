import { Mic, Sparkles } from 'lucide-react';
import { useRef, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { toLanguage } from '@/core/i18n';
import { useDictation, type Dictation } from '@/core/speech/speech';
import { cx } from '@/core/utils/cx';
import { Button } from '@/design-system';
import { usePalette } from '@/platform/palette/palette-store';

/** Recognition errors meaning the microphone may not be used here: typing is the way. */
const BLOCKED = new Set(['not-allowed', 'service-not-allowed']);

function statusKey(dictation: Dictation) {
  if (dictation.listening) return 'speak.listening';
  if (dictation.error) return BLOCKED.has(dictation.error) ? 'speak.blocked' : 'speak.error';
  return dictation.supported ? 'speak.hint' : 'speak.typeOnly';
}

/**
 * Simple mode's home starts with the voice (U8): one large button to speak, a box to type
 * instead. What is said shows in the box as it is heard and, once the browser settles on it,
 * goes to the assistant (once per utterance), which answers in the command palette with what
 * to open (an expense to check, a page to see).
 */
export function SpeakCard() {
  const { t, i18n } = useTranslation();
  const ask = usePalette((state) => state.ask);
  const [text, setText] = useState('');
  const asked = useRef(false);
  const dictation = useDictation(toLanguage(i18n.language), (heard, final) => {
    if (asked.current) return;
    setText(heard);
    if (!final || !heard) return;
    asked.current = true;
    ask(heard);
    setText('');
  });

  const listen = () => {
    asked.current = false;
    dictation.start();
  };

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    ask(text.trim());
    setText('');
  };

  return (
    <section
      aria-labelledby="speak-title"
      className="flex flex-col items-center gap-4 rounded-3xl border border-primary/40 bg-glass p-6 text-center shadow-sm backdrop-blur-xl"
    >
      <h2 id="speak-title" className="text-xl font-semibold">
        {t('speak.title')}
      </h2>
      {dictation.supported && (
        <button
          type="button"
          aria-pressed={dictation.listening}
          onClick={dictation.listening ? dictation.stop : listen}
          className={cx(
            'grid size-24 place-items-center rounded-full bg-primary text-primary-contrast shadow-lg shadow-primary/30 transition-transform hover:scale-105',
            dictation.listening && 'animate-pulse',
          )}
        >
          <Mic aria-hidden="true" className="size-10" />
          <span className="sr-only">{t(dictation.listening ? 'speak.stop' : 'speak.listen')}</span>
        </button>
      )}
      <p role="status" className="min-h-6 text-muted">
        {t(statusKey(dictation))}
      </p>
      <form className="flex w-full max-w-md gap-2" onSubmit={submit}>
        <input
          aria-label={t('speak.type')}
          placeholder={t('speak.type')}
          value={text}
          autoComplete="off"
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="h-12 min-w-0 flex-1 rounded-full border border-border bg-surface px-5 text-text"
        />
        <Button type="submit" className="rounded-full" disabled={!text.trim()}>
          <Sparkles aria-hidden="true" className="size-4" />
          {t('speak.ask')}
        </Button>
      </form>
    </section>
  );
}
