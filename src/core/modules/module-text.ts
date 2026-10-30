import i18n, { MODULE_STRINGS, toLanguage } from '@/core/i18n';
import type { ModuleDefinition, ModuleStrings, ModuleTile } from '@/core/modules/types';

/** The module's strings in `language`: loaded with that language (its `strings/<language>.json`)
 *  or in its manifest, falling back to English (always in the manifest). */
export function textFor(definition: ModuleDefinition, language: string): ModuleStrings {
  const chosen = toLanguage(language);
  const loaded = i18n.getResource(chosen, MODULE_STRINGS, definition.key) as
    ModuleStrings | undefined;
  return loaded ?? definition.strings[chosen] ?? definition.strings.en;
}

function normalise(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().trim();
}

/** "bills" should find "bill": also try the English singular of a plural search. */
function variants(needle: string): string[] {
  if (needle.length > 3 && needle.endsWith('es'))
    return [needle, needle.slice(0, -2), needle.slice(0, -1)];
  if (needle.length > 3 && needle.endsWith('s')) return [needle, needle.slice(0, -1)];
  return [needle];
}

/** Does the tile match a search? Checks the current language and English (people often type
 *  English names even with a Tamil or Hindi interface), plus the module's keywords. */
export function matchesSearch(tile: ModuleTile, query: string): boolean {
  const needle = normalise(query);
  if (!needle) return true;
  const { strings, keywords = [], key } = tile.definition;
  const haystack = [
    key,
    tile.text.name,
    tile.text.tagline,
    strings.en.name,
    strings.en.tagline,
    ...keywords,
  ];
  const wanted = variants(needle);
  return haystack.some((value) => {
    const text = normalise(value);
    return wanted.some((word) => text.includes(word));
  });
}
