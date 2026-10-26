import { act, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AnimatedNumber,
  FilterChips,
  Meter,
  Switch,
  toast,
  usePointerTilt,
  useToasts,
} from '@/design-system';
import { renderWithProviders } from '@/test/render';

/** The OS asks for reduced motion (from now until the test ends). */
function preferReducedMotion() {
  const matchMedia = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = matchMedia(query);
    return query.includes('prefers-reduced-motion: reduce')
      ? Object.defineProperty(list, 'matches', { value: true })
      : list;
  });
}

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

  it('fades a dismissed toast out, hidden from assistive tech and the keyboard meanwhile', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<p>page</p>);
      act(() => {
        toast('Leaving', { durationMs: 60_000 });
      });
      const item = screen.getByText('Leaving').closest('li');

      act(() => {
        screen.getByRole('button', { name: 'Dismiss' }).click();
      });
      expect(useToasts.getState().toasts).toEqual([]);
      expect(item).toHaveAttribute('aria-hidden', 'true');
      expect(item).toHaveAttribute('inert');
      expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByText('Leaving')).toBeNull();
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

describe('meter', () => {
  it('reads out its value in words and stays within its range when over', () => {
    renderWithProviders(
      <>
        <Meter label="Groceries" value={6200} max={8000} marker={4000} valueText="78% used" />
        <Meter label="Trip" value={9000} max={8000} tone="over" valueText="₹1,000 over" />
      </>,
    );

    const groceries = screen.getByRole('meter', { name: 'Groceries' });
    expect(groceries).toHaveAttribute('aria-valuenow', '6200');
    expect(groceries).toHaveAttribute('aria-valuemin', '0');
    expect(groceries).toHaveAttribute('aria-valuemax', '8000');
    expect(groceries).toHaveAttribute('aria-valuetext', '78% used');
    const trip = screen.getByRole('meter', { name: 'Trip' });
    expect(trip).toHaveAttribute('aria-valuenow', '8000');
    expect(trip).toHaveAttribute('aria-valuetext', '₹1,000 over');
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

  it('counts up to the value on screen', async () => {
    renderWithProviders(<AnimatedNumber value={1500} locale="en" />);

    expect(screen.getByText('0', { selector: '[aria-hidden]' })).toBeInTheDocument();
    expect(
      await screen.findByText('1,500', { selector: '[aria-hidden]' }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('shows the value at once when the OS asks for reduced motion', () => {
    preferReducedMotion();
    renderWithProviders(<AnimatedNumber value={1500} locale="en" />);

    expect(screen.getByText('1,500', { selector: '[aria-hidden]' })).toBeInTheDocument();
  });
});

describe('pointer tilt', () => {
  function Card() {
    const tilt = usePointerTilt();
    return (
      <div data-testid="card" {...tilt.handlers}>
        card
      </div>
    );
  }

  /** Point with a `pointerType` at (x, y) of a 200 x 100 card at the page's top left. */
  function pointAt(card: HTMLElement, x: number, y: number, pointerType = 'mouse') {
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;
    fireEvent.pointerMove(card, { pointerType, clientX: x, clientY: y });
  }

  it('leans toward the pointer and lights up under it, then settles when it leaves', () => {
    renderWithProviders(<Card />);
    const card = screen.getByTestId('card');

    pointAt(card, 200, 0); // top right corner

    expect(card.style.getPropertyValue('--spot-x')).toBe('100.0%');
    expect(card.style.getPropertyValue('--spot-y')).toBe('0.0%');
    expect(card.style.rotate).toBe('5.00 5.00 0 7.07deg');
    fireEvent.pointerLeave(card);
    expect(card.style.rotate).toBe('');
  });

  it('keeps still for touch', () => {
    renderWithProviders(<Card />);
    const card = screen.getByTestId('card');

    pointAt(card, 200, 0, 'touch');

    expect(card.style.getPropertyValue('--spot-x')).toBe('');
    expect(card.style.rotate).toBe('');
  });

  it('keeps still for reduced motion, while the light still follows', () => {
    preferReducedMotion();
    renderWithProviders(<Card />);
    const card = screen.getByTestId('card');

    pointAt(card, 200, 0);

    expect(card.style.getPropertyValue('--spot-x')).toBe('100.0%');
    expect(card.style.rotate).toBe('');
  });
});
