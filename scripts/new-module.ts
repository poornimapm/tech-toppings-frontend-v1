// Make a module's frontend folder from a spec (JSON), as the backend's `poe new-module` does for
// both repositories (tech-toppings-backend-v1/docs/modules/new-module.md, ADR-0020): its tile
// (manifest), a page listing its items with add, change and delete, its texts in en/ta/hi, and
// a test. It never writes over a folder, and removes what it wrote if a step fails.
// Usage: npm run new-module -- --spec <file.json> [--out <project folder>] [--check]
// (--check: only check the spec, not whether the module is there already; write nothing.)
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import * as prettier from 'prettier';

interface Texts {
  name: string;
  tagline: string;
  description: string;
  items: string;
  add: string;
  field: string;
  empty: string;
}

interface Spec {
  key: string;
  icon: string;
  accent: string;
  status: 'live' | 'beta';
  keywords: string[];
  strings: Record<Language, Texts>;
}

const LANGUAGES = ['en', 'ta', 'hi'] as const;
type Language = (typeof LANGUAGES)[number];
/** Each text's longest, as the backend's spec (scripts/new_module.py) has them. */
const LIMITS: Record<keyof Texts, number> = {
  name: 40,
  tagline: 80,
  description: 300,
  items: 30,
  add: 40,
  field: 40,
  empty: 120,
};
const FIELDS = Object.keys(LIMITS) as (keyof Texts)[];
// The backend's key rule: parts of a-z and 0-9 joined by single _, each starting with a letter.
const KEY = /^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$/;
const KEY_LENGTH = { min: 2, max: 24 };
const ICON = /^[A-Z][A-Za-z0-9]*$/;
/** Text a translator would have changed, as src/core/i18n/completeness.test.ts reads it. */
const WORDY = /[a-z]{3,}.*\s.*[a-z]{3,}/i;
const TOKEN = /%%(\w+)%%/g;
const project = fileURLToPath(new URL('..', import.meta.url));
const templates = join(project, 'scripts', 'module-template');

/** The page's own words, the same for every module, in every language. */
const GENERIC: Record<Language, Record<string, string>> = {
  en: {
    save: 'Save',
    delete: 'Delete',
    editLabel: 'Edit: {{text}}',
    deleteLabel: 'Delete: {{text}}',
    confirmDelete: 'Delete “{{text}}”? It can’t be brought back.',
    added: 'Added “{{text}}”',
    saved: 'Saved',
    deleted: 'Deleted “{{text}}”',
    required: 'Write something first.',
    loadError: 'This list couldn’t be loaded.',
  },
  ta: {
    save: 'சேமி',
    delete: 'நீக்கு',
    editLabel: 'திருத்து: {{text}}',
    deleteLabel: 'நீக்கு: {{text}}',
    confirmDelete: '“{{text}}” ஐ நீக்கவா? இதைத் திரும்பப் பெற முடியாது.',
    added: '“{{text}}” சேர்க்கப்பட்டது',
    saved: 'சேமிக்கப்பட்டது',
    deleted: '“{{text}}” நீக்கப்பட்டது',
    required: 'முதலில் ஏதாவது எழுதுங்கள்.',
    loadError: 'இந்தப் பட்டியலை ஏற்ற முடியவில்லை.',
  },
  hi: {
    save: 'सहेजें',
    delete: 'हटाएँ',
    editLabel: 'बदलें: {{text}}',
    deleteLabel: 'हटाएँ: {{text}}',
    confirmDelete: '“{{text}}” हटाएँ? इसे वापस नहीं लाया जा सकता।',
    added: '“{{text}}” जोड़ा गया',
    saved: 'सहेजा गया',
    deleted: '“{{text}}” हटाया गया',
    required: 'पहले कुछ लिखिए।',
    loadError: 'यह सूची लोड नहीं हो सकी।',
  },
};

class SpecError extends Error {}

/** The tile colours the design system has (src/core/modules/types.ts), read, not copied. */
async function accents(): Promise<string[]> {
  const types = await readFile(join(project, 'src/core/modules/types.ts'), 'utf8');
  const list = /export const ACCENTS = \[([^\]]+)\]/.exec(types)?.[1] ?? '';
  return [...list.matchAll(/'(\w+)'/g)].map((match) => match[1] ?? '');
}

/** lucide-react's icons that its type declarations mark deprecated (by any of their names): the
 *  project's lint refuses them (@typescript-eslint/no-deprecated). */
async function deprecatedIcons(lucide: Record<string, unknown>): Promise<Set<unknown>> {
  const folder = join(project, 'node_modules', 'lucide-react');
  const { typings } = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8')) as {
    typings: string;
  };
  const types = await readFile(join(folder, typings), 'utf8');
  const names = [...types.matchAll(/@deprecated.*\n\s*\*\/\s*declare const (\w+)/g)];
  return new Set(names.map((match) => lucide[match[1] ?? '']).filter(Boolean));
}

/** The spec file's JSON: UTF-8, with or without the byte-order mark some Windows tools write. */
async function readSpec(path: string): Promise<unknown> {
  const bytes = await readFile(path);
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
    throw new SpecError(`${path} is UTF-16: save it as UTF-8`);
  }
  try {
    return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new SpecError(`${path} is not JSON: ${(error as Error).message}`);
  }
}

/** A spec as read from its file: nothing in it is trusted until checked. */
type Unchecked = Partial<Record<'key' | 'icon' | 'accent' | 'status' | 'keywords', unknown>> & {
  strings?: Partial<Record<Language, Partial<Record<keyof Texts, unknown>>>>;
};

/** The spec, checked and tidied (each text on one line, as a page shows it), or every problem
 *  with it at once. */
async function check(raw: unknown): Promise<Spec> {
  const spec = (raw ?? {}) as Unchecked;
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const oneLine = (value: unknown) => text(value).trim().replace(/\s+/g, ' ');
  const problems: string[] = [];
  const key = text(spec.key);
  if (!KEY.test(key) || key.length < KEY_LENGTH.min || key.length > KEY_LENGTH.max) {
    problems.push(`key: ${key} (2-24 of a-z and 0-9, parts joined by _, each starting a-z)`);
  }
  const status = text(spec.status);
  if (status !== 'live' && status !== 'beta') problems.push('status: live or beta');
  if (!(await accents()).includes(text(spec.accent))) problems.push(`accent: ${text(spec.accent)}`);
  // One of lucide-react's icons (by any of its names), not a name JavaScript has already, and
  // not on its way out.
  const icon = text(spec.icon);
  const lucide = (await import('lucide-react')) as Record<string, unknown> & { icons: object };
  if (!ICON.test(icon) || !Object.values(lucide.icons).includes(lucide[icon])) {
    problems.push(`icon: ${icon} is not a lucide-react icon`);
  } else if (icon in globalThis) {
    problems.push(`icon: ${icon} hides JavaScript's own ${icon}; use ${icon}Icon`);
  } else if ((await deprecatedIcons(lucide)).has(lucide[icon])) {
    problems.push(`icon: ${icon} is deprecated in lucide-react; choose another`);
  }
  const keywords = spec.keywords ?? [];
  if (!Array.isArray(keywords) || !keywords.every((word) => typeof word === 'string')) {
    problems.push('keywords: a list of words');
  }
  const strings = {} as Record<Language, Texts>;
  for (const language of LANGUAGES) {
    const texts = {} as Texts;
    for (const field of FIELDS) {
      texts[field] = oneLine(spec.strings?.[language]?.[field]);
      if (!texts[field] || Array.from(texts[field]).length > LIMITS[field]) {
        problems.push(`strings.${language}.${field} (1-${String(LIMITS[field])} characters)`);
      } else if (
        language !== 'en' &&
        texts[field] === strings.en[field] &&
        WORDY.test(texts[field])
      ) {
        problems.push(`strings.${language}.${field}: still in English`);
      }
    }
    strings[language] = texts;
  }
  if (problems.length) throw new SpecError(`not a module spec:\n  ${problems.join('\n  ')}`);
  return {
    key,
    icon,
    accent: text(spec.accent),
    status: status as Spec['status'],
    keywords: (keywords as string[]).map(oneLine).filter(Boolean),
    strings,
  };
}

const slugOf = (spec: Spec) => spec.key.replaceAll('_', '-');
const camelOf = (spec: Spec) =>
  spec.key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
const folderOf = (spec: Spec, out: string) => join(out, 'src', 'modules', slugOf(spec));

/** What the templates' `%%name%%` tokens stand for; texts go in as string literals. */
function tokensOf(spec: Spec): Record<string, string> {
  const english = spec.strings.en;
  // English in the manifest (the first page has it); the others beside it, in strings/.
  const manifestStrings = { en: shellStrings(spec, 'en') };
  return {
    key: spec.key,
    slug: slugOf(spec),
    Key: camelOf(spec),
    icon: spec.icon,
    accent: spec.accent,
    status: spec.status,
    keywords: JSON.stringify(spec.keywords),
    strings: JSON.stringify(manifestStrings),
    name: JSON.stringify(english.name),
    add: JSON.stringify(english.add),
    field: JSON.stringify(english.field),
    empty: JSON.stringify(english.empty),
  };
}

async function render(template: string, tokens: Record<string, string>): Promise<string> {
  const text = await readFile(join(templates, template), 'utf8');
  return text.replace(TOKEN, (_, name: string) => {
    const value = tokens[name];
    if (value === undefined) throw new SpecError(`${template} has an unknown token ${name}`);
    return value;
  });
}

/** Every file of the new module, by its path under the module's folder. */
async function filesOf(spec: Spec): Promise<Record<string, string>> {
  const tokens = tokensOf(spec);
  const files: Record<string, string> = {};
  for (const template of await readdir(templates)) {
    const name = template.replace(/\.tmpl$/, '').replace('i18n-index', 'i18n/index');
    files[name] = await render(template, tokens);
  }
  for (const language of LANGUAGES) {
    const { name, add, field, empty } = spec.strings[language];
    const page = { title: name, add, field, empty, ...GENERIC[language] };
    files[`i18n/${language}.json`] = `${JSON.stringify(page, null, 2)}\n`;
    if (language !== 'en') {
      const shell = shellStrings(spec, language);
      files[`strings/${language}.json`] = `${JSON.stringify(shell, null, 2)}\n`;
    }
  }
  return files;
}

/** What the module shows outside its pages (its tile and its figure) in one language; Tamil
 *  and Hindi are loaded with the language (core/i18n), English is in the manifest. */
function shellStrings(spec: Spec, language: Language) {
  const { name, tagline, description, items } = spec.strings[language];
  return { name, tagline, description, stats: { items } };
}

async function write(spec: Spec, out: string): Promise<string[]> {
  const folder = folderOf(spec, out);
  const written: string[] = [];
  try {
    for (const [name, text] of Object.entries(await filesOf(spec))) {
      const path = join(folder, name);
      const options = (await prettier.resolveConfig(join(project, 'package.json'))) ?? {};
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, await prettier.format(text, { ...options, filepath: path }), 'utf8');
      written.push(relative(out, path));
    }
  } catch (error) {
    await rm(folder, { recursive: true, force: true });
    throw error;
  }
  return written;
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      spec: { type: 'string' },
      out: { type: 'string', default: project },
      check: { type: 'boolean', default: false },
    },
  });
  if (!values.spec) {
    console.error(
      'usage: npm run new-module -- --spec <file.json> [--out <project folder>] [--check]',
    );
    return 1;
  }
  const out = resolve(values.out);
  try {
    const spec = await check(await readSpec(values.spec));
    if (values.check) {
      console.warn(`The spec makes the ${spec.key} module; nothing was written.`);
      return 0;
    }
    if (existsSync(folderOf(spec, out))) {
      throw new SpecError(`a module named ${spec.key} is there already: ${folderOf(spec, out)}`);
    }
    const written = await write(spec, out);
    console.warn(`Made the ${spec.key} module's frontend:\n  ${written.join('\n  ')}`);
    return 0;
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exitCode = await main();
