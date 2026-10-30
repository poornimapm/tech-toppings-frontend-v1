import { beforeAll, describe, expect, it } from 'vitest';

import i18n from '@/core/i18n';
import { matchesSearch, textFor } from '@/core/modules/module-text';
import { moduleRegistry } from '@/core/modules/registry';
import type { ModuleTile } from '@/core/modules/types';
import { testModules } from '@/test/msw';

function tile(key: string, language: string): ModuleTile {
  const definition = moduleRegistry.definitionFor(key);
  const view = testModules.find((item) => item.key === key);
  if (!view) throw new Error(`no test view for ${key}`);
  return { view, definition, text: textFor(definition, language) };
}

describe('module text', () => {
  // A module's Tamil and Hindi strings arrive with the language (strings/<language>.json).
  beforeAll(() => i18n.loadLanguages(['ta', 'hi']));

  it('uses the UI language and falls back to English', () => {
    const definition = moduleRegistry.definitionFor('expenses');

    expect(textFor(definition, 'ta-IN').name).toBe('செலவுகள்');
    expect(textFor(definition, 'fr').name).toBe('Expenses');
  });

  it('matches names in the current language', () => {
    expect(matchesSearch(tile('expenses', 'ta'), 'செலவு')).toBe(true);
  });

  it('matches English names and keywords whatever the UI language', () => {
    expect(matchesSearch(tile('receipts', 'hi'), 'Warranty')).toBe(true);
    expect(matchesSearch(tile('receipts', 'ta'), 'bill')).toBe(true);
    expect(matchesSearch(tile('gov_docs', 'en'), 'passport')).toBe(true);
  });

  it('finds singular keywords from plural searches', () => {
    expect(matchesSearch(tile('receipts', 'en'), 'bills')).toBe(true);
    expect(matchesSearch(tile('gov_docs', 'en'), 'licences')).toBe(true);
    expect(matchesSearch(tile('meals', 'en'), 'recipes')).toBe(true);
  });

  it('treats an empty search as matching everything and rejects the rest', () => {
    expect(matchesSearch(tile('journal', 'en'), '   ')).toBe(true);
    expect(matchesSearch(tile('journal', 'en'), 'spaceship')).toBe(false);
  });
});
