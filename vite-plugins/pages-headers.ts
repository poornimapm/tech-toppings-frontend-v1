import { readFileSync } from 'node:fs';

/** What only makes sense over https, left out on the local http preview. */
const HTTPS_ONLY_HEADERS = new Set(['strict-transport-security']);
const HTTPS_ONLY_DIRECTIVE = /;\s*upgrade-insecure-requests/;

/**
 * The headers Cloudflare Pages adds for one path rule of a `_headers` file (ADR-0019), so that
 * `vite preview`, and the e2e tests on it, run under the same policy as the live site.
 * The format: a rule's path on a line of its own, its headers indented below it.
 */
export function pagesHeaders(file: string, rule = '/*'): Record<string, string> {
  const headers: Record<string, string> = {};
  let current: string | null = null;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = line.trim();
      continue;
    }
    const at = line.indexOf(':');
    const name = line.slice(0, at).trim();
    if (current !== rule || at < 0 || HTTPS_ONLY_HEADERS.has(name.toLowerCase())) continue;
    headers[name] = line
      .slice(at + 1)
      .trim()
      .replace(HTTPS_ONLY_DIRECTIVE, '');
  }
  return headers;
}
