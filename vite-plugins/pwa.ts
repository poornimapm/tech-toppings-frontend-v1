import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

import { build, type Plugin, type ResolvedConfig } from 'vite';

export interface PwaOptions {
  /** The service worker's source (one TypeScript entry, built into a single classic script). */
  entry: string;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  /** Same-origin path of the API (`VITE_API_BASE_URL`): never answered from the cache. */
  apiBase: string;
}

const SERVICE_WORKER = 'sw.js';
/** The host's own configuration (Cloudflare Pages): read by the host, never served. */
const HOST_FILES = new Set(['_headers', '_redirects', '_routes.json']);
const ICONS = [
  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

function manifest(options: PwaOptions, base: string): object {
  return {
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    id: base,
    start_url: base,
    scope: base,
    display: 'standalone',
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: ICONS.map((icon) => ({ ...icon, src: base + icon.src })),
  };
}

async function filesIn(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'));
}

/** What the worker keeps for offline use: not source maps, the worker itself, hidden build
 *  data (`.vite/manifest.json`) or the host's configuration, none of which a page loads. */
function kept(file: string): boolean {
  return (
    !file.endsWith('.map') &&
    file !== SERVICE_WORKER &&
    !HOST_FILES.has(file) &&
    !file.split('/').some((part) => part.startsWith('.'))
  );
}

/**
 * The installable, offline-capable app (ADR-0018), without a PWA library:
 * - `manifest.webmanifest`, named from the build's settings;
 * - `sw.js`: the service worker built into one script, with the list of this build's files to
 *   keep for offline use, and a version that changes whenever any of them does. The page itself
 *   is kept under the base URL, not `index.html`: hosts redirect that name (Cloudflare Pages
 *   sends it to `/`), and a page load refuses an answer that came through a redirect.
 */
export function pwa(options: PwaOptions): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'tt-pwa',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: `${JSON.stringify(manifest(options, config.base), null, 2)}\n`,
      });
    },
    async closeBundle() {
      const outDir = config.build.outDir;
      const files = (await filesIn(outDir)).filter(kept).sort();
      const hash = createHash('sha256');
      for (const file of files) hash.update(file).update(await readFile(join(outDir, file)));
      const url = (file: string) => (file === 'index.html' ? config.base : config.base + file);
      await build({
        configFile: false,
        logLevel: 'warn',
        mode: config.mode,
        resolve: { alias: config.resolve.alias },
        define: {
          __PRECACHE__: JSON.stringify(files.map(url)),
          __SHELL__: JSON.stringify(config.base),
          __SW_VERSION__: JSON.stringify(hash.digest('hex').slice(0, 12)),
          __API_BASE__: JSON.stringify(options.apiBase),
        },
        build: {
          outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          sourcemap: false,
          target: config.build.target,
          lib: {
            entry: options.entry,
            formats: ['iife'],
            name: 'ttServiceWorker',
            fileName: () => SERVICE_WORKER,
          },
        },
      });
    },
  };
}
