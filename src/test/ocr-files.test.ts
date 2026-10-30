import { existsSync, statSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { OCR_LANGUAGES } from '@/core/scan/ocr-settings';

// eslint-disable-next-line no-restricted-imports -- a build plugin, beside the app, not in src
import { OCR_DATA, ocrFiles } from '../../vite-plugins/ocr-files';

describe('the on-device reader, as the build publishes it', () => {
  const { version, files } = ocrFiles();

  it('has every file it loads, from its own packages', () => {
    expect(version).toMatch(/^[0-9a-f]{10}$/); // a hash of the files: new files, new folder
    expect(Object.keys(files).sort()).toEqual(
      [
        'worker.min.js',
        'tesseract-core-simd-lstm.js',
        'tesseract-core-simd-lstm.wasm',
        'tesseract-core-lstm.js',
        'tesseract-core-lstm.wasm',
        ...OCR_DATA.map((language) => `${language}.traineddata.gz`),
      ].sort(),
    );
    for (const source of Object.values(files)) {
      expect(existsSync(source), source).toBe(true);
      expect(statSync(source).size).toBeGreaterThan(0);
    }
  });

  it('has data for every language the app reads in', () => {
    const wanted = new Set(Object.values(OCR_LANGUAGES).flat());

    expect([...wanted].every((language) => OCR_DATA.some((known) => known === language))).toBe(
      true,
    );
  });
});
