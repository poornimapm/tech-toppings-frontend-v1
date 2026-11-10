import type { Plugin, Rollup } from 'vite';

/** Every file the page's entry imports statically, however deep: all loaded before its code runs. */
function entryFiles(bundle: Rollup.OutputBundle): Set<string> {
  const found = new Set<string>();
  const visit = (file: string) => {
    const chunk = bundle[file];
    if (found.has(file) || chunk?.type !== 'chunk') return;
    found.add(file);
    chunk.imports.forEach(visit);
  };
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === 'chunk' && chunk.isEntry && chunk.facadeModuleId?.endsWith('.html')) {
      visit(chunk.fileName);
    }
  }
  return found;
}

/**
 * Each lazy import carries the list of files to fetch with it (`__vite__mapDeps`), written into
 * the chunk that makes the import: for the modules' pages, that is their manifests, which load
 * with the first page. A file the page's entry imports statically has already loaded before
 * any lazy import can run (index.html preloads it too), so naming it again costs first-load
 * bytes and fetches nothing. This leaves those files out of every list; the rest are kept, so
 * a lazy page still fetches its own files at once.
 */
export function preloadLists(): Plugin {
  let loaded = new Set<string>();
  return {
    name: 'tt-preload-lists',
    apply: 'build',
    config: () => ({
      build: {
        modulePreload: {
          resolveDependencies: (_file, deps, { hostType }) =>
            hostType === 'js' ? deps.filter((dep) => !loaded.has(dep)) : deps,
        },
      },
    }),
    // Before Vite writes the lists (in its own generateBundle), so the entry's files are known.
    generateBundle: {
      order: 'pre',
      handler(_options, bundle) {
        loaded = entryFiles(bundle);
      },
    },
  };
}
