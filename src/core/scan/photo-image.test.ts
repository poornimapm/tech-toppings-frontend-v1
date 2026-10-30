import { describe, expect, it } from 'vitest';

import { prepare, rgbaOf, tilt, type Grey } from '@/core/scan/photo-image';

interface Scene {
  /** How far the print is tilted. */
  degrees?: number;
  /** The print's grey: 40 is fresh ink, 160 a faded thermal print. */
  ink?: number;
  /** The paper darkens towards the right. */
  shaded?: boolean;
  /** A shadow over the bottom 40%, reaching the photo's edge (a phone held over it), soft-edged. */
  shadow?: boolean;
  table?: number;
}

const PAPER = 235;
const LINES = 12;

/** A fake photo: a light paper on a darker table, with rows of dashes for print. */
function photo({ degrees = 0, ink = 40, shaded = false, shadow = false, table = 70 }: Scene = {}) {
  const [width, height] = [600, 500];
  const rgba = new Uint8ClampedArray(width * height * 4);
  const slope = Math.tan((degrees * Math.PI) / 180);
  const paint = (x: number, y: number, grey: number) => {
    rgba.set([grey, grey, grey, 255], (y * width + x) * 4);
  };
  // How deep the shadow is at a row: none above 55% of the height, full below 65%.
  const dim = (y: number) => (shadow ? Math.min(1, Math.max(0, (y / height - 0.55) / 0.1)) : 0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onPaper = x >= 60 && x < 540 && y >= 40 && y < 460;
      const light = shaded ? PAPER - Math.round(((x - 60) / 480) * 90) : PAPER;
      const grey = onPaper ? light - (light - 130) * dim(y) : table * (1 - 0.4 * dim(y));
      paint(x, y, Math.round(grey));
    }
  }
  for (let line = 0; line < LINES; line++) {
    for (let x = 100; x < 500; x++) {
      if (x % 10 >= 6) continue;
      const y = Math.round(80 + line * 30 + (x - 300) * slope);
      for (let dy = 0; dy < 7; dy++) paint(x, y + dy, Math.round(ink * (1 - 0.45 * dim(y))));
    }
  }
  return { rgba, width, height };
}

const at = (image: Grey, x: number, y: number) => image.pixels[y * image.width + x] ?? -1;

/** Lines of print left: bands of rows with something darker than dark in the middle columns. */
function printLines(image: Grey, dark = 128): number {
  let [bands, inside] = [0, false];
  for (let y = 0; y < image.height; y++) {
    let printed = false;
    for (let x = Math.round(image.width * 0.3); x < image.width * 0.7; x++) {
      if (at(image, x, y) < dark) printed = true;
    }
    if (printed && !inside) bands++;
    inside = printed;
  }
  return bands;
}

function prepared(scene: Scene = {}) {
  const { rgba, width, height } = photo(scene);
  return prepare(rgba, width, height);
}

describe('prepare', () => {
  it('crops to the paper and whitens what is left of the table', () => {
    const ready = prepared();

    expect(ready.width).toBeLessThan(600);
    expect(ready.height).toBeLessThan(500);
    for (const [x, y] of [
      [0, 0],
      [ready.width - 1, 0],
      [0, ready.height - 1],
      [ready.width - 1, ready.height - 1],
    ] as const) {
      expect(at(ready, x, y)).toBeGreaterThan(200);
    }
    expect(printLines(ready)).toBe(LINES);
  });

  it('straightens tilted print', () => {
    const ready = prepared({ degrees: -2.5 });

    expect(tilt(ready, 128)).toBe(0);
    expect(printLines(ready)).toBe(LINES);
  });

  it('evens out a shadow across the paper', () => {
    const ready = prepared({ shaded: true });
    const row = Math.round(ready.height / 2);
    // Between two lines of print: paper on the light side and the shaded side alike.
    const paperAt = (x: number) =>
      Math.max(...[-2, -1, 0, 1, 2].map((dy) => at(ready, x, row + dy)));

    expect(Math.abs(paperAt(10) - paperAt(ready.width - 10))).toBeLessThan(20);
  });

  it('keeps the lines under a shadow that reaches the edge of the photo', () => {
    expect(printLines(prepared({ shadow: true }))).toBe(LINES);
  });

  it('keeps faded print on a dark table level, every line of it', () => {
    const ready = prepared({ ink: 160, table: 60 });

    expect(tilt(ready, 200)).toBe(0);
    expect(printLines(ready, 200)).toBe(LINES); // faded: lighter than fresh ink, still print
  });

  it('leaves a photo that is all paper as it is, only evened', () => {
    const { rgba, width, height } = photo({ table: PAPER });
    const ready = prepare(rgba, width, height);

    expect([ready.width, ready.height]).toEqual([width, height]);
    expect(printLines(ready)).toBe(LINES);
  });
});

describe('tilt', () => {
  it.each([-4, -2.5, 0, 1.5, 3])('finds print tilted by %s degrees', (degrees) => {
    const { rgba, width, height } = photo({ degrees });
    const grey = { pixels: new Uint8Array(width * height), width, height };
    grey.pixels.forEach((_, index) => (grey.pixels[index] = rgba[index * 4] ?? 0));

    expect(tilt(grey, 128)).toBe(degrees);
  });

  it('takes a blank or faint photo as straight', () => {
    const blank = { pixels: new Uint8Array(600 * 500).fill(PAPER), width: 600, height: 500 };

    expect(tilt(blank, 128)).toBe(0);
  });
});

it('turns grey pixels back into opaque RGBA', () => {
  expect([...rgbaOf({ pixels: new Uint8Array([7, 200]), width: 2, height: 1 })]).toEqual([
    7, 7, 7, 255, 200, 200, 200, 255,
  ]);
});
