import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { speak, speechLocale, useDictation } from '@/core/speech/speech';

/** A stand-in for the browser's recognition object; the test plays the browser's part. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();

  constructor() {
    FakeRecognition.last = this;
  }

  hear(...phrases: string[]) {
    this.onresult?.({ results: phrases.map((transcript) => [{ transcript }]) });
  }
}

const scope = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete scope.webkitSpeechRecognition;
  delete scope.speechSynthesis;
  FakeRecognition.last = null;
});

describe('dictation', () => {
  it('says it is unsupported where the browser cannot listen', () => {
    const { result } = renderHook(() => useDictation('en', vi.fn()));

    act(() => {
      result.current.start(); // harmless: nothing to start
    });

    expect(result.current.supported).toBe(false);
    expect(result.current.listening).toBe(false);
  });

  it('listens in the user language and passes on what it hears, as it hears it', () => {
    scope.webkitSpeechRecognition = FakeRecognition;
    const heard = vi.fn();
    const { result } = renderHook(() => useDictation('ta', heard));

    act(() => {
      result.current.start();
    });
    const recognition = FakeRecognition.last;
    act(() => {
      recognition?.hear('தக்காளி');
      recognition?.hear('தக்காளி 40', 'ரூபாய்');
    });

    expect(result.current.supported).toBe(true);
    expect(result.current.listening).toBe(true);
    expect(recognition?.lang).toBe('ta-IN');
    expect(recognition?.interimResults).toBe(true);
    expect(heard.mock.calls).toEqual([['தக்காளி'], ['தக்காளி 40 ரூபாய்']]);

    act(() => {
      result.current.stop();
    });
    expect(result.current.listening).toBe(false);
  });

  it('reports why it could not listen, and lets go of the microphone when it leaves', () => {
    scope.webkitSpeechRecognition = FakeRecognition;
    const { result, unmount } = renderHook(() => useDictation('en', vi.fn()));

    act(() => {
      result.current.start();
    });
    act(() => {
      FakeRecognition.last?.onerror?.({ error: 'not-allowed' });
      FakeRecognition.last?.onend?.();
    });
    expect(result.current.error).toBe('not-allowed');
    expect(result.current.listening).toBe(false);

    unmount();
    expect(FakeRecognition.last?.abort).toHaveBeenCalled();
  });
});

describe('reading aloud', () => {
  it('speaks with a voice of that language, when the device has one', () => {
    const spoken: SpeechSynthesisUtterance[] = [];
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: unknown = null;
        lang = '';
        constructor(readonly text: string) {}
      },
    );
    scope.speechSynthesis = {
      getVoices: () => [{ lang: 'en-GB' }, { lang: 'hi-IN' }],
      cancel: vi.fn(),
      speak: (utterance: SpeechSynthesisUtterance) => spoken.push(utterance),
    };

    expect(speak('जोड़ा गया', 'hi')).toBe(true);
    expect(speak('சேர்க்கப்பட்டது', 'ta')).toBe(false); // no Tamil voice: the text is only shown

    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toMatchObject({ text: 'जोड़ा गया', lang: 'hi-IN' });
    vi.unstubAllGlobals();
  });

  it('does nothing where the browser cannot speak', () => {
    expect(speak('Added', 'en')).toBe(false);
    expect(speechLocale('en')).toBe('en-IN');
  });
});
