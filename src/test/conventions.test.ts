import { describe, expect, it } from 'vitest';

// Every source file path under src/ (keys only; nothing is imported).
const files = Object.keys(import.meta.glob('/src/**/*.{ts,tsx,json,css}'));

const KEBAB_FOLDER = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEBAB_FILE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)*$/;

describe('naming conventions', () => {
  it('finds the source tree', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('uses kebab-case for every folder and file under src/', () => {
    const offenders = files.filter((path) => {
      const segments = path.replace(/^\/src\//, '').split('/');
      const fileName = segments.pop() ?? '';
      return !KEBAB_FILE.test(fileName) || segments.some((folder) => !KEBAB_FOLDER.test(folder));
    });

    expect(offenders).toEqual([]);
  });
});
