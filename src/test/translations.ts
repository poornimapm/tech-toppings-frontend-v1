import { expect } from 'vitest';

type Leaf = [path: string[], text: string];

/** Every leaf of a translation tree with its path; keys may hold dots (feed codes do). */
function leaves(value: unknown, path: string[] = []): Leaf[] {
  if (typeof value !== 'object' || value === null) return [[path, String(value)]];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
}

const named = (path: string[]) => path.join(' › ');

/**
 * Fails unless every language has exactly English's keys, and keeps every `{{placeholder}}`
 * English uses. For a module's own text: `expectSameKeysAndPlaceholders(messages)`.
 */
export function expectSameKeysAndPlaceholders(
  bundles: Record<'en', unknown> & Record<string, unknown>,
) {
  const english = leaves(bundles.en);
  for (const [language, bundle] of Object.entries(bundles)) {
    const texts = new Map(leaves(bundle).map(([path, text]) => [named(path), text]));
    expect([...texts.keys()].sort(), language).toEqual(english.map(([path]) => named(path)).sort());
    for (const [path, text] of english) {
      for (const placeholder of text.match(/{{\w+}}/g) ?? []) {
        expect(texts.get(named(path)), `${language} ${named(path)}`).toContain(placeholder);
      }
    }
  }
}
