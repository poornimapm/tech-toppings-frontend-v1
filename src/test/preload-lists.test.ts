import type { ResolveModulePreloadDependenciesFn, Rollup } from 'vite';
import { describe, expect, it } from 'vitest';

// eslint-disable-next-line no-restricted-imports -- a build plugin, beside the app, not in src
import { preloadLists } from '../../vite-plugins/preload-lists';

/** A built chunk: its file, what it imports statically, and the module it was built from. */
function chunk(fileName: string, imports: string[], facade: string | null = null) {
  return {
    type: 'chunk',
    fileName,
    imports,
    isEntry: facade !== null,
    facadeModuleId: facade,
  } as unknown as Rollup.OutputChunk;
}

/** The plugin's list filter, once it has seen this build. */
function resolverFor(chunks: Rollup.OutputChunk[]): ResolveModulePreloadDependenciesFn {
  const plugin = preloadLists();
  const config = (
    plugin.config as () => {
      build: { modulePreload: { resolveDependencies: ResolveModulePreloadDependenciesFn } };
    }
  )();
  const seen = plugin.generateBundle as unknown as {
    handler: (options: unknown, bundle: Rollup.OutputBundle) => void;
  };
  seen.handler({}, Object.fromEntries(chunks.map((one) => [one.fileName, one])));
  return config.build.modulePreload.resolveDependencies;
}

const BUILD = [
  chunk('assets/index.js', ['assets/react.js', 'assets/registry.js'], '/app/index.html'),
  chunk('assets/react.js', ['assets/runtime.js']),
  chunk('assets/runtime.js', []),
  chunk('assets/registry.js', ['assets/runtime.js']),
  chunk('assets/page.js', ['assets/react.js', 'assets/icon.js']),
  chunk('assets/icon.js', ['assets/runtime.js']),
  chunk('assets/worker.js', ['assets/shared.js'], '/app/src/core/scan/prepare.worker.ts'),
  chunk('assets/shared.js', []),
];
const PAGE_DEPS = ['assets/page.js', 'assets/react.js', 'assets/runtime.js', 'assets/icon.js'];

describe('the lazy pages’ lists of files to fetch with them', () => {
  it('leave out what the page’s entry has loaded already, however deep it imports it', () => {
    const resolve = resolverFor(BUILD);

    expect(
      resolve('assets/page.js', PAGE_DEPS, { hostId: 'assets/registry.js', hostType: 'js' }),
    ).toEqual(['assets/page.js', 'assets/icon.js']);
  });

  it('keep what only another entry loads, and what the page itself names', () => {
    const resolve = resolverFor(BUILD);

    expect(
      resolve('assets/page.js', ['assets/page.js', 'assets/shared.js'], {
        hostId: 'assets/registry.js',
        hostType: 'js',
      }),
    ).toEqual(['assets/page.js', 'assets/shared.js']);
    expect(
      resolve('assets/index.js', PAGE_DEPS, { hostId: 'index.html', hostType: 'html' }),
    ).toEqual(PAGE_DEPS);
  });
});
