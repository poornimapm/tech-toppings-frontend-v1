// The performance budget (Phase 11): the JavaScript a first page needs before it renders,
// gzipped, must stay within BUNDLE_BUDGET_KB (default 200). That is the entry script, what it
// imports, and the lazy route module the router loads for that page with its own imports.
// Checked for each page a visit can start on. Run after `vite build`: npm run budget
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** The pages a visit starts on: home when signed in, sign-in otherwise (routes.tsx). */
const FIRST_PAGES = {
  '/': 'src/platform/welcome/welcome-page.tsx',
  '/login': 'src/platform/auth/login-page.tsx',
};

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, 'dist');
const budgetKb = Number(process.env.BUNDLE_BUDGET_KB ?? 200);

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Written by `vite build` (build.manifest): each source module's chunk and its static imports.
const manifest = JSON.parse(
  await readFile(resolve(dist, '.vite/manifest.json'), 'utf8').catch(() =>
    fail('No dist/.vite/manifest.json: run `vite build` first (build.manifest must be on).'),
  ),
);

/** A module's chunk and every chunk it imports statically: what loads with it. */
function chunksOf(key, found = new Set()) {
  const chunk = manifest[key];
  if (!chunk) fail(`${key} is not in the build manifest: update FIRST_PAGES.`);
  if (found.has(chunk.file)) return found;
  found.add(chunk.file);
  for (const imported of chunk.imports ?? []) chunksOf(imported, found);
  return found;
}

const entry = Object.keys(manifest).find((key) => manifest[key].isEntry && key.endsWith('.html'));
if (!entry) fail('No entry script in the build manifest: nothing would be measured.');

const sizes = new Map();
async function gzipped(file) {
  if (!sizes.has(file)) {
    sizes.set(file, gzipSync(await readFile(resolve(dist, file)), { level: 9 }).length);
  }
  return sizes.get(file);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1).padStart(7)} KB`;
let over = false;
for (const [path, page] of Object.entries(FIRST_PAGES)) {
  const files = [...chunksOf(page, chunksOf(entry))].filter((file) => file.endsWith('.js'));
  let total = 0;
  console.warn(`\n${path}`);
  for (const file of files) {
    const size = await gzipped(file);
    total += size;
    console.warn(`${kb(size)}  ${file}`);
  }
  console.warn(`${kb(total)}  first-load JavaScript of ${path}, gzipped (budget ${budgetKb} KB)`);
  if (total / 1024 > budgetKb) {
    over = true;
    console.error(
      `${path} is over budget by ${(total / 1024 - budgetKb).toFixed(1)} KB: ` +
        'move what it does not need for its first paint behind a lazy import.',
    );
  }
}
if (over) process.exit(1);
