// Generate src/core/api/schema.d.ts from the backend's OpenAPI schema (ADR-0008).
//
// Source: OPENAPI_SOURCE (file path or http(s) URL). Default: the sibling backend repo's
// openapi.json, produced by running `poe openapi` in ../tech-toppings-backend-v1.
// Usage: npm run gen:api
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = process.env.OPENAPI_SOURCE ?? '../tech-toppings-backend-v1/openapi.json';
const sourceUrl = /^https?:\/\//.test(source)
  ? new URL(source)
  : pathToFileURL(resolve(root, source));
const output = resolve(root, 'src/core/api/schema.d.ts');

const header = `/**
 * GENERATED FILE: do not edit by hand.
 * Source: backend OpenAPI schema. Regenerate with \`npm run gen:api\`.
 */

`;

const ast = await openapiTS(sourceUrl);
await writeFile(output, header + astToString(ast), 'utf8');
console.warn(`API types written to ${output} (from ${sourceUrl.href})`);
