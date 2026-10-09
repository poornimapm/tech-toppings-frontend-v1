/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// Read from disk (path relative to the project root, where Vitest runs): Vitest replaces CSS
// imports, even ?raw ones, with empty modules.
const tokensCss = readFileSync('src/core/theme/tokens.css', 'utf8');

/** Extract `--tt-*` custom properties declared in the block that starts with `selector {`. */
function tokensFor(selector: string): Record<string, string> {
  const start = tokensCss.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`selector ${selector} not found in tokens.css`);
  const block = tokensCss.slice(start, tokensCss.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--tt-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, value]) => [
      name ?? '',
      value ?? '',
    ]),
  );
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** Foreground/background pairs the UI actually uses. */
const PAIRS: [foreground: string, background: string][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['primary', 'surface'],
  ['primary-contrast', 'primary'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
];

/** Module accents carry stat figures and icons: AA as text on their tint and on surfaces. */
const ACCENTS = ['emerald', 'rose', 'amber', 'sky', 'indigo', 'orange', 'violet', 'teal', 'slate'];
for (const accent of ACCENTS) {
  PAIRS.push([`accent-${accent}`, `accent-${accent}-soft`], [`accent-${accent}`, 'surface']);
}

describe.each([
  ['light', ':root'],
  ['dark', "[data-theme='dark']"],
])('%s theme tokens', (_name, selector) => {
  const tokens = tokensFor(selector);

  it.each(PAIRS)('%s on %s meets WCAG AA (4.5:1)', (foreground, background) => {
    const fg = tokens[foreground];
    const bg = tokens[background];
    expect(fg, `missing --tt-${foreground}`).toBeDefined();
    expect(bg, `missing --tt-${background}`).toBeDefined();
    expect(contrast(fg ?? '', bg ?? '')).toBeGreaterThanOrEqual(4.5);
  });
});
