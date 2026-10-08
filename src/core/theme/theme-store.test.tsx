import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  nextPreference,
  resolveTheme,
  useApplyTheme,
  useThemeStore,
} from '@/core/theme/theme-store';
import { setPrefersDark } from '@/test/media';

describe('theme preferences', () => {
  it('cycles light → dark → system → light', () => {
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
    expect(nextPreference('system')).toBe('light');
  });

  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ] as const)('resolves %s (OS dark: %s) to %s', (preference, prefersDark, expected) => {
    expect(resolveTheme(preference, prefersDark)).toBe(expected);
  });

  it('persists the chosen preference', () => {
    act(() => {
      useThemeStore.getState().setPreference('dark');
    });

    expect(JSON.parse(localStorage.getItem('tt-theme') ?? '{}')).toMatchObject({
      state: { preference: 'dark' },
    });
  });
});

describe('useApplyTheme', () => {
  it('writes the resolved theme to <html data-theme> and follows the OS in system mode', () => {
    const { result } = renderHook(() => useApplyTheme());

    expect(result.current).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    act(() => {
      setPrefersDark(true);
    });
    expect(result.current).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => {
      useThemeStore.getState().setPreference('light');
    });
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
