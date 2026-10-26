import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FakeRecognition, installFakeRecognition } from '@/core/speech/fake-recognition';
import { speak, speechLocale, useDictation } from '@/core/speech/speech';

const scope = window as unknown as Record<string, unknown>;
let uninstall: (() => void) | undefined;

afterEach(() => {
  uninstall?.();
  uninstall = undefined;
  delete scope.speechSynthesis;
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
    uninstall = installFakeRecognition();
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
    expect(heard.mock.calls).toEqual([
      ['தக்காளி', false],
      ['தக்காளி 40 ரூபாய்', false],
    ]);

    act(() => {
      recognition?.settle('தக்காளி 40 ரூபாய்');
    });
    expect(heard).toHaveBeenLastCalledWith('தக்காளி 40 ரூபாய்', true); // the words are settled
    expect(result.current.listening).toBe(false);
  });

  it('can be stopped', () => {
    uninstall = installFakeRecognition();
    const { result } = renderHook(() => useDictation('en', vi.fn()));

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(FakeRecognition.last?.stop).toHaveBeenCalled();
    expect(result.current.listening).toBe(false);
  });

  it('reports why it could not listen, and lets go of the microphone when it leaves', () => {
    uninstall = installFakeRecognition();
    const { result, unmount } = renderHook(() => useDictation('en', vi.fn()));

    act(() => {
      result.current.start();
    });
    const recognition = FakeRecognition.last;
    act(() => {
      recognition?.onerror?.({ error: 'not-allowed' });
      recognition?.onend?.();
    });
    expect(result.current.error).toBe('not-allowed');
    expect(result.current.listening).toBe(false);

    unmount();
    expect(recognition?.abort).toHaveBeenCalled();
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
