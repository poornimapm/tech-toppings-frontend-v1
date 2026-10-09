import { act, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AnimatedNumber, FilterChips, Switch, toast, useToasts } from '@/design-system';
import { renderWithProviders } from '@/test/render';

describe('toasts', () => {
  it('announces a message politely and runs its action once', async () => {
    const onAction = vi.fn();
    const { user } = renderWithProviders(<p>page</p>);

    act(() => {
      toast('Saved', { tone: 'success', action: { label: 'Undo', onAction } });
    });

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(useToasts.getState().toasts).toEqual([]);
  });

  it('dismisses on request and by itself after a while', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<p>page</p>);
      act(() => {
        toast('First', { durationMs: 1000 });
        toast('Second', { durationMs: 60_000 });
      });
      expect(screen.getByText('First')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(useToasts.getState().toasts.map((item) => item.message)).toEqual(['Second']);
      act(() => {
        screen.getByRole('button', { name: 'Dismiss' }).click();
      });
      expect(useToasts.getState().toasts).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps at most three on screen', () => {
    act(() => {
      for (const message of ['a', 'b', 'c', 'd']) toast(message);
    });

    expect(useToasts.getState().toasts.map((item) => item.message)).toEqual(['b', 'c', 'd']);
  });
});

describe('filter chips', () => {
  function Chips() {
    const [value, setValue] = useState<'all' | 'new'>('all');
    return (
      <FilterChips
        label="Show"
        value={value}
        onChange={setValue}
        chips={[
          { value: 'all', label: 'All', count: 3 },
          { value: 'new', label: 'New', count: 1 },
        ]}
      />
    );
  }

  it('marks exactly one chip as pressed', async () => {
    const { user } = renderWithProviders(<Chips />);

    await user.click(screen.getByRole('button', { name: 'New (1)' }));

    expect(screen.getByRole('button', { name: 'New (1)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'All (3)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('switch', () => {
  it('toggles and describes itself', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Switch
        label="Notify me"
        description="When it launches"
        checked={false}
        onCheckedChange={onChange}
      />,
    );

    const control = screen.getByRole('switch', { name: 'Notify me' });
    expect(control).toHaveAccessibleDescription('When it launches');
    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('animated number', () => {
  it('gives screen readers the final, localised value', () => {
    renderWithProviders(<AnimatedNumber value={1234567} locale="en-IN" />);

    expect(screen.getByText('12,34,567', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('formats money without decimals', () => {
    renderWithProviders(<AnimatedNumber value={4320.4} locale="en" currency="INR" />);

    expect(screen.getByText('₹4,320', { selector: '.sr-only' })).toBeInTheDocument();
  });
});
