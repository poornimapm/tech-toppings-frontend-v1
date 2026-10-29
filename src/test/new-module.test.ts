import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

/**
 * The frontend generator (scripts/new-module.ts), run as `poe new-module` runs it, into a folder
 * of its own: what it makes, and what it refuses. (Its pages are tested by the test it writes.)
 */
const run = promisify(execFile);
const RUN_TIMEOUT = 60_000;
const SPEC = {
  key: 'house_plants',
  icon: 'Sprout',
  accent: 'sky',
  status: 'beta',
  order: 90,
  keywords: ['garden', 'தோட்டம்'],
  strings: {
    en: {
      name: 'Plants',
      tagline: 'Water and care for your plants',
      description: 'Keep a note for each plant.',
      items: 'plants',
      add: 'Add a plant',
      field: 'Plant',
      empty: 'No plants yet.',
    },
    ta: {
      name: 'செடிகள்',
      tagline: 'உங்கள் செடிகளுக்கு நீரும் கவனிப்பும்',
      description: 'ஒவ்வொரு செடிக்கும் ஒரு குறிப்பு.',
      items: 'செடிகள்',
      add: 'செடியைச் சேர்',
      field: 'செடி',
      empty: 'இன்னும் செடிகள் இல்லை.',
    },
    hi: {
      name: 'पौधे',
      tagline: 'अपने पौधों को पानी और देखभाल',
      description: 'हर पौधे के लिए एक नोट।',
      items: 'पौधे',
      add: 'पौधा जोड़ें',
      field: 'पौधा',
      empty: 'अभी कोई पौधा नहीं।',
    },
  },
};

const made: string[] = [];

afterEach(async () => {
  await Promise.all(made.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

interface Options {
  /** The project folder to write into (by default a new one, removed after the test). */
  out?: string;
  /** The spec file as these bytes, in place of the spec as JSON. */
  bytes?: Buffer;
  check?: boolean;
}

/** Runs the generator on `spec`. */
async function generate(spec: object, { out, bytes, check = false }: Options = {}) {
  let folder = out;
  if (folder === undefined) {
    folder = await mkdtemp(join(tmpdir(), 'tt-new-module-'));
    made.push(folder);
  }
  const file = join(folder, 'spec.json');
  await writeFile(file, bytes ?? JSON.stringify(spec));
  const args = ['scripts/new-module.ts', '--spec', file, '--out', folder];
  try {
    await run(process.execPath, check ? [...args, '--check'] : args);
    return { out: folder, failed: '' };
  } catch (error) {
    return { out: folder, failed: (error as { stderr: string }).stderr };
  }
}

async function filesIn(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(folder.length + 1)
        .replaceAll('\\', '/'),
    )
    .sort();
}

describe('the module generator', () => {
  it(
    'makes the tile, page, texts and test, in every language and formatted',
    async () => {
      const { out, failed } = await generate(SPEC);
      const module = join(out, 'src/modules/house-plants');
      const read = (name: string) => readFile(join(module, name), 'utf8');

      expect(failed).toBe('');
      expect(await filesIn(module)).toEqual([
        'api.ts',
        'i18n/en.json',
        'i18n/hi.json',
        'i18n/index.ts',
        'i18n/ta.json',
        'items-page.test.tsx',
        'items-page.tsx',
        'manifest.ts',
      ]);
      const manifest = await read('manifest.ts');
      expect(manifest).toContain("key: 'house_plants'");
      expect(manifest).toContain("import { Sprout } from 'lucide-react';");
      expect(manifest).toContain("stats: { items: 'செடிகள்' }");
      expect(await read('api.ts')).toContain("components['schemas']['HousePlantsItemOut']");
      const texts = await Promise.all(
        ['en', 'ta', 'hi'].map(
          async (language) =>
            JSON.parse(await read(`i18n/${language}.json`)) as Record<string, string>,
        ),
      );
      expect(texts.map((text) => Object.keys(text))).toEqual([
        Object.keys(texts[0] ?? {}),
        Object.keys(texts[0] ?? {}),
        Object.keys(texts[0] ?? {}),
      ]);
      expect(texts.map((text) => text.title)).toEqual(['Plants', 'செடிகள்', 'पौधे']);
      for (const name of await filesIn(module)) expect(await read(name)).not.toContain('%%');
    },
    RUN_TIMEOUT,
  );

  it(
    'reads a spec saved with a byte-order mark, and puts each text on one line',
    async () => {
      const spec = {
        ...SPEC,
        strings: { ...SPEC.strings, en: { ...SPEC.strings.en, name: ' Plants\n' } },
      };
      const { out, failed } = await generate(spec, {
        bytes: Buffer.from(`\uFEFF${JSON.stringify(spec)}`, 'utf8'),
      });
      const english = await readFile(join(out, 'src/modules/house-plants/i18n/en.json'), 'utf8');

      expect(failed).toBe('');
      expect((JSON.parse(english) as { title: string }).title).toBe('Plants');
    },
    RUN_TIMEOUT,
  );

  it(
    'only checks a spec, with --check',
    async () => {
      const { out, failed } = await generate(SPEC, { check: true });

      expect(failed).toBe('');
      expect(await filesIn(out)).toEqual(['spec.json']);
    },
    RUN_TIMEOUT,
  );

  it.each([
    ['an icon lucide-react lacks', { ...SPEC, icon: 'NoSuchIcon' }, 'icon: NoSuchIcon'],
    ['an export that is not an icon', { ...SPEC, icon: 'Icon' }, 'icon: Icon is not'],
    ['an icon named as JavaScript has it', { ...SPEC, icon: 'Map' }, 'use MapIcon'],
    ['an icon lucide-react deprecates', { ...SPEC, icon: 'SwissFranc' }, 'is deprecated'],
    ['a colour the design system lacks', { ...SPEC, accent: 'pink' }, 'accent: pink'],
    ['a key with capitals', { ...SPEC, key: 'Plants' }, 'key: Plants'],
    ['a key with a doubled _', { ...SPEC, key: 'house__plants' }, 'key: house__plants'],
    ['keywords that are not a list', { ...SPEC, keywords: 'garden' }, 'keywords'],
    [
      'a language left out',
      { ...SPEC, strings: { en: SPEC.strings.en, hi: SPEC.strings.hi } },
      'strings.ta.name',
    ],
    [
      'a text left in English',
      {
        ...SPEC,
        strings: { ...SPEC.strings, ta: { ...SPEC.strings.ta, tagline: SPEC.strings.en.tagline } },
      },
      'strings.ta.tagline: still in English',
    ],
    [
      'a text too long',
      { ...SPEC, strings: { ...SPEC.strings, en: { ...SPEC.strings.en, name: 'N'.repeat(41) } } },
      'strings.en.name (1-40 characters)',
    ],
  ])(
    'refuses %s, and writes nothing',
    async (_, spec, problem) => {
      const { out, failed } = await generate(spec);

      expect(failed).toContain(problem);
      expect(await filesIn(out)).toEqual(['spec.json']);
    },
    RUN_TIMEOUT,
  );

  it(
    'never writes over a module that is there',
    async () => {
      const { out } = await generate(SPEC);
      const before = await readFile(join(out, 'src/modules/house-plants/manifest.ts'), 'utf8');

      const again = await generate(SPEC, { out });

      expect(again.failed).toContain('is there already');
      expect(await readFile(join(out, 'src/modules/house-plants/manifest.ts'), 'utf8')).toBe(
        before,
      );
      // --check is about the spec alone (the backend checks where the module goes).
      expect((await generate(SPEC, { out, check: true })).failed).toBe('');
    },
    RUN_TIMEOUT,
  );

  it(
    'asks for UTF-8 in place of UTF-16',
    async () => {
      const { failed } = await generate(SPEC, {
        bytes: Buffer.from(`\uFEFF${JSON.stringify(SPEC)}`, 'utf16le'),
      });

      expect(failed).toContain('is UTF-16: save it as UTF-8');
    },
    RUN_TIMEOUT,
  );
});
