import { expect } from 'vitest';

/** Every leaf of a translation tree as a dotted path: `{a: {b: 'x'}}` -> `['a.b']`. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function valueAt(tree: unknown, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], tree);
  return String(value);
}

/**
 * Fails unless every language has exactly English's keys, and keeps every `{{placeholder}}`
 * English uses. For a module's own text: `expectSameKeysAndPlaceholders(messages)`.
 */
export function expectSameKeysAndPlaceholders(
  bundles: Record<'en', unknown> & Record<string, unknown>,
) {
  const english = bundles.en;
  for (const [language, bundle] of Object.entries(bundles)) {
    expect(keyPaths(bundle).sort(), language).toEqual(keyPaths(english).sort());
    for (const path of keyPaths(english)) {
      for (const placeholder of valueAt(english, path).match(/{{\w+}}/g) ?? []) {
        expect(valueAt(bundle, path), `${language} ${path}`).toContain(placeholder);
      }
    }
  }
}
