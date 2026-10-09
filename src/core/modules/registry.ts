import { Blocks } from 'lucide-react';
import { createContext, useContext } from 'react';

import type { ModuleDefinition } from '@/core/modules/types';

interface ManifestFile {
  default: ModuleDefinition;
}

/** URL/folder form of a module key: `gov_docs` -> `gov-docs`. */
export function slugOf(key: string): string {
  return key.replaceAll('_', '-');
}

/** Readable stand-in name for a module the API knows but this build has no folder for. */
function humanise(key: string): string {
  const words = key.replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export class ModuleRegistry {
  private readonly byKey: ReadonlyMap<string, ModuleDefinition>;

  constructor(definitions: readonly ModuleDefinition[]) {
    this.byKey = new Map(definitions.map((definition) => [definition.key, definition]));
  }

  all(): ModuleDefinition[] {
    return [...this.byKey.values()];
  }

  has(key: string): boolean {
    return this.byKey.has(key);
  }

  /** The module's definition, or a neutral placeholder so a backend-only module still shows
   *  (e.g. while its frontend folder is being written). */
  definitionFor(key: string): ModuleDefinition {
    return (
      this.byKey.get(key) ?? {
        key,
        icon: Blocks,
        accent: 'slate',
        strings: { en: { name: humanise(key), tagline: '', description: '' } },
      }
    );
  }
}

const MANIFEST_PATH = /^\/src\/modules\/([^/]+)\/manifest\.ts$/;

/**
 * Build the registry from `src/modules/<slug>/manifest.ts` files. A mistake fails loudly at
 * startup (and in tests) rather than showing a half-broken tile.
 */
export function buildRegistry(files: Record<string, ManifestFile>): ModuleRegistry {
  const definitions: ModuleDefinition[] = [];
  const seen = new Set<string>();
  for (const [path, file] of Object.entries(files)) {
    const folder = MANIFEST_PATH.exec(path)?.[1];
    const definition = file.default;
    if (!folder) throw new Error(`Unexpected module manifest path: ${path}`);
    if (slugOf(definition.key) !== folder) {
      throw new Error(
        `Module "${definition.key}" must live in src/modules/${slugOf(definition.key)}`,
      );
    }
    if (seen.has(definition.key)) throw new Error(`Duplicate module key "${definition.key}"`);
    seen.add(definition.key);
    definitions.push(definition);
  }
  return new ModuleRegistry(definitions);
}

/** Every module folder in this build: adding a folder is all it takes (ADR-0001). */
export const moduleRegistry = buildRegistry(
  import.meta.glob<ManifestFile>('/src/modules/*/manifest.ts', { eager: true }),
);

/** Lets tests (and future previews) swap in another registry. */
export const ModuleRegistryContext = createContext<ModuleRegistry>(moduleRegistry);

export function useModuleRegistry(): ModuleRegistry {
  return useContext(ModuleRegistryContext);
}
