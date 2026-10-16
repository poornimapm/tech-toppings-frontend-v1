import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettled } from '@/core/utils/use-settled';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSettled', () => {
  it('starts settled, then follows a value only once it stops changing', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value, 400), {
      initialProps: { value: { title: 'r' } },
    });
    expect(result.current).toEqual({ title: 'r' });

    rerender({ value: { title: 'ri' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: { title: 'rice' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toEqual({ title: 'r' }); // still typing

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ title: 'rice' });
  });

  it('does not restart the wait for an equal value made anew', () => {
    const { result, rerender } = renderHook(({ value }) => useSettled(value, 400), {
      initialProps: { value: ['a'] },
    });
    rerender({ value: ['b'] });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: ['b'] });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual(['b']);
  });
});
