// For tests only: a stand-in for the browser's speech recognition, where the test plays the
// browser's part. installFakeRecognition() puts it in place and returns how to take it away.
import { vi } from 'vitest';

import type { RecognitionResult } from '@/core/speech/speech';

const scope = window as unknown as Record<string, unknown>;

export class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: RecognitionResult[] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();

  constructor() {
    FakeRecognition.last = this;
  }

  /** Words heard so far, one result per phrase; the browser may still change them. */
  hear(...phrases: string[]) {
    this.emit(phrases, false);
  }

  /** The browser settles on these words (and, listening for one utterance, stops). */
  settle(...phrases: string[]) {
    this.emit(phrases, true);
    this.onend?.();
  }

  private emit(phrases: string[], isFinal: boolean) {
    this.onresult?.({
      results: phrases.map((transcript) => Object.assign([{ transcript }], { isFinal })),
    });
  }
}

export function installFakeRecognition(): () => void {
  scope.webkitSpeechRecognition = FakeRecognition;
  return () => {
    delete scope.webkitSpeechRecognition;
    FakeRecognition.last = null;
  };
}
