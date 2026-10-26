// Render the app icons (public/icons/*.png) from public/favicon.svg with Playwright's Chromium,
// so no image library is needed. Run again after changing the SVG: npm run gen:icons
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = await readFile(resolve(root, 'public/favicon.svg'), 'utf8');
const BACKGROUND = '#4f46e5'; // the icon's own colour, filling a maskable icon's edges
// The part of the SVG's 64x64 view the stripes take up, with a margin: the badge shows them only.
const STRIPES = '10 10 44 44';

// A maskable icon may be cut to a circle: its content stays inside the middle 80%.
const icons = [
  { file: 'icon-192.png', size: 192, inset: 0 },
  { file: 'icon-512.png', size: 512, inset: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.1 },
];

const sized = (markup) => markup.replace('<svg ', '<svg width="100%" height="100%" ');

const browser = await chromium.launch();
async function render(file, size, html, transparent) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html);
  await page.screenshot({ path: resolve(root, 'public/icons', file), omitBackground: transparent });
  await page.close();
  console.warn(`public/icons/${file}`);
}

try {
  for (const { file, size, inset } of icons) {
    const pad = Math.round(size * inset);
    await render(
      file,
      size,
      `<body style="margin:0;background:${inset ? BACKGROUND : 'transparent'}">` +
        `<div style="padding:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px">` +
        sized(svg) +
        '</div></body>',
      !inset,
    );
  }
  // A notification's badge (Android's status bar) is drawn from its transparency alone: the
  // stripes in white on nothing, without the square behind them.
  await render(
    'badge-96.png',
    96,
    '<style>body{margin:0}rect:first-of-type{display:none}rect{fill:#fff}</style>' +
      '<div style="width:96px;height:96px">' +
      sized(svg.replace(/viewBox="[^"]*"/, `viewBox="${STRIPES}"`)) +
      '</div>',
    true,
  );
} finally {
  await browser.close();
}
