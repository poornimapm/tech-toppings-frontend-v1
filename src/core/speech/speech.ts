import { useCallback, useEffect, useRef, useState } from 'react';

import { env } from '@/core/config/env';
import type { Language } from '@/core/i18n';

/**
 * Speech in the browser (Web Speech API): dictation and reading aloud. Both are optional
 * extras that many browsers lack, so everything here reports whether it is available and the
 * app works the same without it.
 */

/** One stretch of speech: its best guess first, and whether the browser has settled on it. */
export type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };

/** The parts of the (still vendor-prefixed) recognition API this app uses. */
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | undefined {
  const scope = window as unknown as Record<string, RecognitionClass | undefined>;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

/** The speech locale for a UI language: `ta` -> `ta-IN` (region from VITE_SPEECH_REGION). */
export function speechLocale(language: Language): string {
  return `${language}-${env.speechRegion}`;
}

export interface Dictation {
  /** False when this browser can't do speech recognition: hide the microphone. */
  supported: boolean;
  listening: boolean;
  /** The recognition error code of the last attempt (e.g. `not-allowed`, `no-speech`). */
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Dictation in the given language. `onText` gets everything heard so far each time it
 * changes, so the caller can show it live and let the user correct it before using it;
 * `final` says the browser has settled on the words (the utterance is over).
 */
export function useDictation(
  language: Language,
  onText: (text: string, final: boolean) => void,
): Dictation {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const heard = useRef(onText);
  useEffect(() => {
    heard.current = onText;
  }, [onText]);
  useEffect(() => () => active.current?.abort(), []);

  const start = useCallback(() => {
    const Class = recognitionClass();
    if (!Class) return;
    const recognition = new Class();
    recognition.lang = speechLocale(language);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const text = results.map((result) => result[0]?.transcript ?? '').join(' ');
      heard.current(text.trim(), results.length > 0 && results.every((result) => result.isFinal));
    };
    recognition.onerror = (event) => {
      setError(event.error);
    };
    recognition.onend = () => {
      setListening(false);
    };
    active.current = recognition;
    setError(null);
    setListening(true);
    recognition.start();
  }, [language]);

  const stop = useCallback(() => active.current?.stop(), []);
  return { supported: recognitionClass() !== undefined, listening, error, start, stop };
}

/**
 * Say the text aloud in the given language, when the device has a voice for it. Returns
 * whether it was spoken; the caller always shows the text as well.
 */
export function speak(text: string, language: Language): boolean {
  if (!('speechSynthesis' in window)) return false;
  const voice = window.speechSynthesis
    .getVoices()
    .find((candidate) => candidate.lang.toLowerCase().startsWith(language));
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
