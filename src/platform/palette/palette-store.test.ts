import { describe, expect, it } from 'vitest';

import { usePalette } from '@/platform/palette/palette-store';

const palette = () => usePalette.getState();

describe('questions for the palette', () => {
  it('hands each ask out once, by its id, even with the same words', () => {
    palette().ask('250 for vegetables');
    const first = palette().question;
    palette().ask('250 for vegetables');
    const second = palette().question;
    if (!first || !second) throw new Error('no question');

    expect(palette().open).toBe(true);
    expect(second.id).not.toBe(first.id);
    expect(palette().take(first.id)).toBeNull(); // a newer ask replaced it
    expect(palette().take(second.id)).toBe('250 for vegetables');
    expect(palette().take(second.id)).toBeNull();
  });

  it.each([
    ['closed', false],
    ['shut with the shortcut', true],
  ])('drops a question not taken when the palette is %s', (_how, shortcut) => {
    palette().ask('open expenses');

    if (shortcut) palette().toggle();
    else palette().setOpen(false);

    expect(palette()).toMatchObject({ open: false, question: null });
    palette().toggle();
    expect(palette()).toMatchObject({ open: true, question: null });
  });
});
