import { Blocks, Box } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '@/core/i18n';
import { buildRegistry, moduleRegistry, slugOf } from '@/core/modules/registry';
import { defineModule, type ModuleDefinition } from '@/core/modules/types';

// The backend's app/modules folders as shipped (tech-toppings-backend-v1); `poe new-module`
// adds a module to both sides, so a made one joins these.
const BACKEND_MODULE_KEYS = [
  'expenses',
  'medicine',
  'receipts',
  'study',
  'gov_docs',
  'meals',
  'habits',
  'journal',
];

const demo = defineModule({
  key: 'demo_notes',
  icon: Box,
  accent: 'teal',
  strings: { en: { name: 'Demo notes', tagline: 'Try it', description: 'A demo.' } },
});

function file(definition: ModuleDefinition) {
  return { default: definition };
}

describe('module registry', () => {
  it('has a folder for every backend module', () => {
    expect(moduleRegistry.all().map((definition) => definition.key)).toEqual(
      expect.arrayContaining(BACKEND_MODULE_KEYS),
    );
  });

  it.each(moduleRegistry.all().map((definition) => [definition.key, definition] as const))(
    '%s is described in every language',
    (_key, definition) => {
      for (const language of SUPPORTED_LANGUAGES) {
        const strings = definition.strings[language];
        expect(strings?.name, language).toBeTruthy();
        expect(strings?.tagline, language).toBeTruthy();
        expect(strings?.description, language).toBeTruthy();
      }
    },
  );

  it('picks up a new module folder with no other change', () => {
    const registry = buildRegistry({ '/src/modules/demo-notes/manifest.ts': file(demo) });

    expect(registry.has('demo_notes')).toBe(true);
    expect(registry.definitionFor('demo_notes')).toBe(demo);
  });

  it('requires the folder to be the key as a slug', () => {
    expect(slugOf('gov_docs')).toBe('gov-docs');
    expect(() => buildRegistry({ '/src/modules/demo/manifest.ts': file(demo) })).toThrow(
      'must live in src/modules/demo-notes',
    );
  });

  it('rejects unexpected paths', () => {
    expect(() => buildRegistry({ '/src/elsewhere/manifest.ts': file(demo) })).toThrow(
      'Unexpected module manifest path',
    );
  });

  it('gives modules without a folder a neutral placeholder', () => {
    const placeholder = buildRegistry({}).definitionFor('pet_care');

    expect(placeholder.icon).toBe(Blocks);
    expect(placeholder.accent).toBe('slate');
    expect(placeholder.strings.en.name).toBe('Pet care');
  });
});
