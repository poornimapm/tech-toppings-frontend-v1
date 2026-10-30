import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';

import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const folderOf = (packageJson: string) => dirname(packageJson);

/** The languages the on-device reader knows (Tesseract's codes), as the app's languages need,
 *  and where each one's data comes from (named in full, so the dependency check sees them). */
const LANGUAGE_DATA = {
  eng: require.resolve('@tesseract.js-data/eng/package.json'),
  tam: require.resolve('@tesseract.js-data/tam/package.json'),
  hin: require.resolve('@tesseract.js-data/hin/package.json'),
};
export const OCR_DATA = Object.keys(LANGUAGE_DATA) as (keyof typeof LANGUAGE_DATA)[];
const TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.wasm': 'application/wasm',
  '.gz': 'application/octet-stream',
};

/**
 * The on-device receipt reader's files (Tesseract.js, used when AI is off), by the name they
 * are published under in `ocr/<version>/`: the worker, the engine with and without SIMD (each
 * a script and the WebAssembly it loads from beside the worker), and each language's data.
 * `version` is a hash of all their bytes: the files come from four packages, each versioned on
 * its own, and the folder is cached as never changing.
 */
export function ocrFiles(): { version: string; files: Record<string, string> } {
  const tesseract = folderOf(require.resolve('tesseract.js/package.json'));
  const core = folderOf(require.resolve('tesseract.js-core/package.json'));
  const files: Record<string, string> = {
    'worker.min.js': join(tesseract, 'dist', 'worker.min.js'),
  };
  for (const engine of ['tesseract-core-simd-lstm', 'tesseract-core-lstm']) {
    for (const ending of ['.js', '.wasm']) files[engine + ending] = join(core, engine + ending);
  }
  for (const language of OCR_DATA) {
    // The LSTM-only data, about a third the size: the engines published here are LSTM-only.
    const data = folderOf(LANGUAGE_DATA[language]);
    files[`${language}.traineddata.gz`] = join(
      data,
      '4.0.0_best_int',
      `${language}.traineddata.gz`,
    );
  }
  const hash = createHash('sha256');
  for (const name of Object.keys(files).sort()) {
    hash.update(name).update(readFileSync(files[name] ?? ''));
  }
  return { version: hash.digest('hex').slice(0, 10), files };
}

/**
 * Publishes the reader's files with the build, and serves them in development. They are
 * fetched only when a receipt is read on the device: the service worker doesn't keep them
 * (vite-plugins/pwa.ts), and the language data is then kept by the reader itself.
 * `__OCR_FILES__` is their folder, under the base URL (VITE_OCR_PATH can point elsewhere).
 */
export function ocr(): Plugin {
  const { version, files } = ocrFiles();
  const folder = `ocr/${version}/`;
  return {
    name: 'tt-ocr-files',
    config: () => ({ define: { __OCR_FILES__: JSON.stringify(folder) } }),
    configureServer(server) {
      server.middlewares.use(`/${folder}`, (request, response, next) => {
        const name = (request.url ?? '').replace(/^\//, '').split('?')[0] ?? '';
        const source = Object.hasOwn(files, name) ? files[name] : undefined;
        if (!source) {
          next();
          return;
        }
        response.setHeader('Content-Type', TYPES[extname(source)] ?? 'application/octet-stream');
        createReadStream(source)
          .on('error', () => {
            response.statusCode = 500;
            response.end();
          })
          .pipe(response);
      });
    },
    async generateBundle() {
      for (const [name, source] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: folder + name, source: await readFile(source) });
      }
    },
  };
}
