/**
 * A receipt photo made ready for the on-device reader (Tesseract): grey, cropped to the paper,
 * its surroundings whitened, evenly lit and straightened. Without this a table round the paper,
 * a tilt of a degree or two, or a shadow across it each lose most of the lines. Pure, so the app
 * (from a canvas) and `npm run receipt-samples ocr` (which measures it) prepare a photo alike.
 */
export interface Grey {
  /** One byte a pixel, row by row. */
  pixels: Uint8Array;
  width: number;
  height: number;
}

/** Of a row (or column) of the paper, the share that must be light to count as paper. */
const PAPER_SHARE = 0.35;
/** Kept round the paper, as a share of its size: the reader wants a margin. */
const MARGIN = 0.02;
/** Tilts tried when straightening (degrees either way), and the step between them. */
const MAX_TILT = 5;
const TILT_STEP = 0.25;
/** The tilt is measured on a copy about this wide: enough lines, and quick... */
const MEASURE_WIDTH = 500;
/** ...and on the middle of the paper only, where a tilted paper's dark corners never reach. */
const MIDDLE = 0.2;
/** Light is measured in blocks, about this many across the paper. */
const LIGHT_BLOCKS = 24;
/** The paper's grey: the lightest pixels, past this share of them (glare aside). */
const PAPER_LEVEL = 0.95;
/** A table is told from the paper only when it is this much darker... */
const MIN_CONTRAST = 60;
/** ...and cut away up to this share of the way to the paper's grey: a shadow on the paper is
 *  lighter than the table, so it stays. */
const TABLE_SHARE = 0.3;
/** Fewer dark points than this to measure a tilt by: the photo is taken as straight. */
const MIN_DARK = 200;
/** Another angle wins over straight only when it piles the print up this much sharper. */
const CLEARLY = 1.02;

/** Luma of RGBA pixels (as a canvas gives them). */
function grey(rgba: Uint8ClampedArray, width: number, height: number): Grey {
  const pixels = new Uint8Array(width * height);
  for (let at = 0; at < pixels.length; at++) {
    const i = at * 4;
    pixels[at] =
      ((rgba[i] ?? 0) * 299 + (rgba[i + 1] ?? 0) * 587 + (rgba[i + 2] ?? 0) * 114) / 1000;
  }
  return { pixels, width, height };
}

/** Otsu's threshold: the grey that best splits the picture into dark and light. */
function otsu(pixels: Uint8Array): number {
  const counts = new Array<number>(256).fill(0);
  for (const value of pixels) counts[value] = (counts[value] ?? 0) + 1;
  const sum = counts.reduce((total, count, value) => total + count * value, 0);
  let [best, threshold, darkSum, dark] = [0, 0, 0, 0];
  for (let value = 0; value < 256; value++) {
    dark += counts[value] ?? 0;
    if (dark === 0 || dark === pixels.length) continue;
    darkSum += value * (counts[value] ?? 0);
    const light = pixels.length - dark;
    const between = dark * light * (darkSum / dark - (sum - darkSum) / light) ** 2;
    if (between > best) [best, threshold] = [between, value];
  }
  return threshold;
}

/** The grey below which this share of the pixels lies. */
function level(pixels: Uint8Array, share: number): number {
  const counts = new Array<number>(256).fill(0);
  for (const value of pixels) counts[value] = (counts[value] ?? 0) + 1;
  let seen = 0;
  return counts.findIndex((count) => (seen += count) >= share * pixels.length);
}

/** The typical grey of the photo's border: the table, or the paper if it fills the frame. */
function border({ pixels, width, height }: Grey): number {
  const edge: number[] = [];
  for (let x = 0; x < width; x++) edge.push(pixels[x] ?? 0, pixels[(height - 1) * width + x] ?? 0);
  for (let y = 0; y < height; y++)
    edge.push(pixels[y * width] ?? 0, pixels[y * width + width - 1] ?? 0);
  return level(Uint8Array.from(edge), 0.5);
}

/** The first and last index whose share of light pixels reaches PAPER_SHARE. */
function span(shares: number[]): [number, number] {
  const first = shares.findIndex((share) => share >= PAPER_SHARE);
  return first < 0
    ? [0, shares.length - 1]
    : [first, shares.findLastIndex((s) => s >= PAPER_SHARE)];
}

/** Cut to the paper: the rows and columns that are mostly light, with a margin. */
function crop({ pixels, width, height }: Grey, threshold: number): Grey {
  const rows = new Array<number>(height).fill(0);
  const columns = new Array<number>(width).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((pixels[y * width + x] ?? 0) > threshold) {
        rows[y] = (rows[y] ?? 0) + 1;
        columns[x] = (columns[x] ?? 0) + 1;
      }
    }
  }
  const [top, bottom] = span(rows.map((count) => count / width));
  const [left, right] = span(columns.map((count) => count / height));
  const [dy, dx] = [Math.round(height * MARGIN), Math.round(width * MARGIN)];
  const [y0, y1] = [Math.max(0, top - dy), Math.min(height - 1, bottom + dy)];
  const [x0, x1] = [Math.max(0, left - dx), Math.min(width - 1, right + dx)];
  const cut = { width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const out = new Uint8Array(cut.width * cut.height);
  for (let y = y0; y <= y1; y++) {
    out.set(pixels.subarray(y * width + x0, y * width + x1 + 1), (y - y0) * cut.width);
  }
  return { pixels: out, ...cut };
}

/**
 * What is dark and reaches the photo's edge (the table round the paper, its shadow) made
 * white: the reader takes a dark frame round the print for a picture, and skips what's inside.
 * Print never touches the edge, so it stays. `from`: also what reaches pixels already whitened
 * (the paper's own shadow on the table, beside the table cleared before).
 */
function clear(image: Grey, threshold: number, from?: Uint8Array): Grey {
  const { width, height } = image;
  const pixels = image.pixels.slice();
  const queue = new Int32Array(pixels.length);
  let [head, tail] = [0, 0];
  const visit = (at: number) => {
    if ((pixels[at] ?? 255) <= threshold) {
      pixels[at] = 255;
      queue[tail++] = at;
    }
  };
  for (let x = 0; x < width; x++) [x, (height - 1) * width + x].forEach(visit);
  for (let y = 0; y < height; y++) [y * width, y * width + width - 1].forEach(visit);
  from?.forEach((cleared, at) => {
    if (cleared) queue[tail++] = at;
  });
  while (head < tail) {
    const at = queue[head++] ?? 0;
    const x = at % width;
    if (x > 0) visit(at - 1);
    if (x < width - 1) visit(at + 1);
    if (at >= width) visit(at - width);
    if (at < pixels.length - width) visit(at + width);
  }
  return { pixels, width, height };
}

/**
 * How far the lines of print are tilted (degrees): the angle at which the dark pixels pile up
 * into the sharpest rows (a projection profile), as straight lines of text do.
 */
export function tilt({ pixels, width, height }: Grey, threshold: number): number {
  const step = Math.max(1, Math.round(width / MEASURE_WIDTH));
  const dark: [number, number][] = [];
  for (let y = Math.round(height * MIDDLE); y < height * (1 - MIDDLE); y += step) {
    for (let x = Math.round(width * MIDDLE); x < width * (1 - MIDDLE); x += step) {
      if ((pixels[y * width + x] ?? 255) <= threshold) dark.push([x / step, y / step]);
    }
  }
  if (dark.length < MIN_DARK) return 0; // too little print to tell: leave it as it is
  const sharpnessAt = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    const [sin, cos] = [Math.sin(radians), Math.cos(radians)];
    const rows = new Map<number, number>();
    for (const [x, y] of dark) {
      const row = Math.round(y * cos - x * sin);
      rows.set(row, (rows.get(row) ?? 0) + 1);
    }
    let sharpness = 0;
    for (const count of rows.values()) sharpness += count * count;
    return sharpness;
  };
  let [best, sharpest] = [0, sharpnessAt(0)];
  for (let degrees = -MAX_TILT; degrees <= MAX_TILT; degrees += TILT_STEP) {
    const sharpness = degrees === 0 ? 0 : sharpnessAt(degrees);
    if (sharpness > sharpest * CLEARLY) [best, sharpest] = [degrees, sharpness];
  }
  return best;
}

/** Lines tilted by this many degrees made level (bilinear); what comes in from outside the
 *  photo is white. */
function straighten(image: Grey, degrees: number): Grey {
  if (degrees === 0) return image;
  const { width, height } = image;
  const radians = (degrees * Math.PI) / 180;
  const [sin, cos] = [Math.sin(radians), Math.cos(radians)];
  const [cx, cy] = [width / 2, height / 2];
  const pixels = new Uint8Array(width * height);
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 255 : (image.pixels[y * width + x] ?? 255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Where this pixel comes from: the tilt put back.
      const sx = cos * (x - cx) - sin * (y - cy) + cx;
      const sy = sin * (x - cx) + cos * (y - cy) + cy;
      const [x0, y0] = [Math.floor(sx), Math.floor(sy)];
      const [fx, fy] = [sx - x0, sy - y0];
      const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
      const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
      pixels[y * width + x] = top * (1 - fy) + bottom * fy;
    }
  }
  return { pixels, width, height };
}

/**
 * Even light: each pixel divided by the paper's brightness round it (the lightest pixel of
 * its block, blended between blocks), so a shadow across the paper doesn't sink the print.
 */
function flatten(image: Grey): Grey {
  const { width, height } = image;
  const size = Math.max(8, Math.round(width / LIGHT_BLOCKS));
  const [columns, rows] = [Math.ceil(width / size), Math.ceil(height / size)];
  const light = new Float32Array(columns * rows);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const block = Math.floor(y / size) * columns + Math.floor(x / size);
      light[block] = Math.max(light[block] ?? 0, image.pixels[y * width + x] ?? 0);
    }
  }
  const at = (column: number, row: number) =>
    light[
      Math.min(rows - 1, Math.max(0, row)) * columns + Math.min(columns - 1, Math.max(0, column))
    ] ?? 255;
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const by = y / size - 0.5;
    const [r0, fy] = [Math.floor(by), by - Math.floor(by)];
    for (let x = 0; x < width; x++) {
      const bx = x / size - 0.5;
      const [c0, fx] = [Math.floor(bx), bx - Math.floor(bx)];
      const top = at(c0, r0) * (1 - fx) + at(c0 + 1, r0) * fx;
      const bottom = at(c0, r0 + 1) * (1 - fx) + at(c0 + 1, r0 + 1) * fx;
      const paper = Math.max(1, top * (1 - fy) + bottom * fy);
      pixels[y * width + x] = Math.min(255, ((image.pixels[y * width + x] ?? 255) * 255) / paper);
    }
  }
  return { pixels, width, height };
}

/**
 * The photo, made ready for the reader. The table is told from the paper by the photo's
 * border, and cut just above its grey, so a shadow on the paper stays paper. The light is
 * evened before the tilt is measured, so faded print counts as print.
 */
export function prepare(rgba: Uint8ClampedArray, width: number, height: number): Grey {
  const image = grey(rgba, width, height);
  const [table, paper] = [border(image), level(image.pixels, PAPER_LEVEL)];
  if (paper - table < MIN_CONTRAST) {
    const even = flatten(image); // all paper: nothing to cut away
    return straighten(even, tilt(even, otsu(even.pixels)));
  }
  const cut = table + (paper - table) * TABLE_SHARE;
  const cropped = crop(image, cut);
  const cleared = clear(cropped, cut);
  // Measured with the table gone, the threshold falls between print and paper, faded or not.
  const degrees = tilt(cleared, otsu(cleared.pixels));
  const upright = straighten(cleared, degrees);
  // What was whitened, turned the same way (what turns in from outside counts as whitened).
  const marks = cropped.pixels.map((value, at) => (cleared.pixels[at] === value ? 0 : 255));
  const turned = straighten({ ...cropped, pixels: marks }, degrees).pixels;
  const even = flatten(upright);
  // Evened, the paper's own shadow on the table shows as dark beside what was cleared: gone too.
  return clear(
    even,
    otsu(even.pixels),
    turned.map((mark) => (mark > 127 ? 1 : 0)),
  );
}

/** A grey image as RGBA pixels again, for a canvas. */
export function rgbaOf({ pixels }: Grey): Uint8ClampedArray<ArrayBuffer> {
  const rgba = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach((value, at) => {
    rgba.set([value, value, value, 255], at * 4);
  });
  return rgba;
}
