// The sample receipts behind the scan's accuracy report (backend: tests/modules/expenses/
// receipts, scored by `poe eval-receipts`):
//   npm run receipt-samples render   draws each case as a photo-like JPEG: images/<id>.jpg
//   npm run receipt-samples ocr      reads each photo as the app does without AI: ocr/<id>.txt
//                                    (shrunk and prepared alike, core/scan/photo-image.ts, and
//                                    read by Tesseract.js in Node, whose engine build may differ a
//                                    little from the browser's)
// --cases <folder> is that folder (default: the backend checkout beside this one); --only <id>
// does one receipt. Rendering uses Playwright's Chromium and this computer's fonts (Windows:
// Courier New, Segoe Print, Nirmala UI for Tamil and Hindi), so commit the images it makes.
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium, type Page } from '@playwright/test';
import { createWorker, OEM, PSM } from 'tesseract.js';

import { OCR_LANGUAGES, ocrParameters } from '../src/core/scan/ocr-settings.ts';
import { prepare } from '../src/core/scan/photo-image.ts';
import { ocrFiles } from '../vite-plugins/ocr-files.ts';

interface Look {
  tilt: number;
  blur: number;
  fade: number;
  font: 'mono' | 'sans' | 'hand';
}
interface Case {
  id: string;
  lang: string;
  look: Look;
  paper: string[];
}

const FONTS: Record<Look['font'], string> = {
  mono: "'Courier New', 'Nirmala UI', monospace",
  sans: "Arial, 'Nirmala UI', sans-serif",
  hand: "'Segoe Print', 'Ink Free', 'Nirmala UI', cursive",
};
const SCALE = 2.4; // device pixels per CSS pixel: letters about as tall as in a phone photo
// The app reads a photo no larger than this on its long side (VITE_SCAN_READ_PX's default).
const READ_PX = Number(process.env.VITE_SCAN_READ_PX ?? 2400);
const QUALITY = 72;

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** A receipt on a table, photographed a little crooked, soft and faded. */
function page({ look, paper }: Case): string {
  const ink = (0.12 + look.fade * 0.35).toFixed(2);
  return `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; background: #5b4a3a; }
  .scene { display: inline-block; padding: 36px 44px; background:
    radial-gradient(circle at 30% 20%, #7a6650, #4a3a2c 70%); }
  .paper { position: relative; padding: 22px 26px 30px; background:
    linear-gradient(170deg, #fbfaf6, #ecebe4 60%, #e2e0d6); box-shadow: 0 8px 18px #0007;
    transform: perspective(900px) rotateX(2deg) rotate(${look.tilt}deg); }
  pre { margin: 0; font: 15px/1.45 ${FONTS[look.font]}; color: rgb(0 0 0 / ${1 - Number(ink)});
    filter: blur(${look.blur}px); }
  .shade { position: absolute; inset: 0; background:
    linear-gradient(115deg, transparent 50%, rgb(0 0 0 / .12)); }
  .grain { position: absolute; inset: 0; opacity: .12; mix-blend-mode: multiply;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"); }
  </style><div class="scene"><div class="paper"><pre>${paper.map(escape).join('\n')}</pre>
  <div class="shade"></div><div class="grain"></div></div></div>`;
}

async function render(cases: Case[], folder: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: SCALE });
  const tab = await context.newPage();
  await mkdir(join(folder, 'images'), { recursive: true });
  for (const sample of cases) {
    await tab.setContent(page(sample));
    const path = join(folder, 'images', `${sample.id}.jpg`);
    await tab.locator('.scene').screenshot({ path, type: 'jpeg', quality: QUALITY });
    console.warn(`drew ${path}`);
  }
  await browser.close();
}

/** Run in the browser (as text: this script's own types know no DOM): a photo's pixels as a
 *  canvas gives them, base64-encoded. */
const DECODE = `async ([source, side]) => {
  const image = new Image();
  image.src = source;
  await image.decode();
  const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let binary = '';
  for (const value of rgba) binary += String.fromCharCode(value);
  return { width: canvas.width, height: canvas.height, rgba: btoa(binary) };
}`;

/** A photo's pixels as a browser's canvas gives them (what the app prepares). */
async function pixels(tab: Page, jpeg: Buffer) {
  const source = JSON.stringify([`data:image/jpeg;base64,${jpeg.toString('base64')}`, READ_PX]);
  const found = await tab.evaluate<{ width: number; height: number; rgba: string }>(
    `(${DECODE})(${source})`,
  );
  return { ...found, rgba: new Uint8ClampedArray(Buffer.from(found.rgba, 'base64')) };
}

async function read(cases: Case[], folder: string) {
  // The language data as the app publishes it, in one folder the reader can load from.
  const data = await mkdtemp(join(tmpdir(), 'tt-ocr-'));
  const { files } = ocrFiles();
  for (const [name, source] of Object.entries(files)) {
    if (name.endsWith('.traineddata.gz')) await copyFile(source, join(data, name));
  }
  await mkdir(join(folder, 'ocr'), { recursive: true });
  const browser = await chromium.launch();
  const tab = await browser.newPage();
  try {
    for (const sample of cases) {
      const worker = await createWorker(OCR_LANGUAGES[sample.lang] ?? ['eng'], OEM.LSTM_ONLY, {
        langPath: data,
        cacheMethod: 'none',
      });
      await worker.setParameters(ocrParameters(PSM));
      const photo = await pixels(tab, await readFile(join(folder, 'images', `${sample.id}.jpg`)));
      const ready = prepare(photo.rgba, photo.width, photo.height);
      // Grey pixels as a PGM file, which the reader takes as it is.
      const header = Buffer.from(`P5\n${ready.width} ${ready.height}\n255\n`);
      const { data: found } = await worker.recognize(Buffer.concat([header, ready.pixels]));
      await worker.terminate();
      const path = join(folder, 'ocr', `${sample.id}.txt`);
      await writeFile(path, found.text);
      console.warn(`read ${path} (confidence ${Math.round(found.confidence)})`);
    }
  } finally {
    await browser.close();
    await rm(data, { recursive: true, force: true });
  }
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    cases: {
      type: 'string',
      default: '../tech-toppings-backend-v1/tests/modules/expenses/receipts',
    },
    only: { type: 'string' },
  },
});
const folder = resolve(values.cases);
const all = (JSON.parse(await readFile(join(folder, 'cases.json'), 'utf8')) as { cases: Case[] })
  .cases;
const cases = values.only ? all.filter((sample) => sample.id === values.only) : all;
const step = { render, ocr: read }[positionals[0] ?? ''];
if (!step || cases.length === 0) {
  console.error('Usage: npm run receipt-samples -- render|ocr [--cases <folder>] [--only <id>]');
  process.exit(1);
}
await step(cases, folder);
