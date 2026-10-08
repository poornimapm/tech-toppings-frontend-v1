# Reference analysis — frontend

**What this is:** a read-only study of an existing internal React frontend (the "reference").
It records which structural patterns to reuse in Tech-Toppings and which to avoid.

**What was not taken:** no code, configuration values, endpoints, credentials, domain content,
prompts or names. Backend findings are in
`tech-toppings-backend-v1/docs/reference-analysis.md`.

## 1. Reference snapshot

| Area        | Reference                                                                                                  | Tech-Toppings decision                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Language    | React 19 + Vite 7. Mostly `.jsx`; some `.ts/.tsx` but **no tsconfig**, so TypeScript is never type-checked | TypeScript only, `strict` plus `noUncheckedIndexedAccess`; `tsc --noEmit` in CI                                         |
| UI          | MUI 6 + Tailwind 4 + CSS variables + class-string objects + inline `sx` (five styling systems)             | Tailwind only, driven by CSS-variable design tokens; headless accessible primitives (Radix)                             |
| State       | Redux Toolkit; server data fetched by hand in `useEffect` with local loading/error flags                   | TanStack Query for server state; Zustand for small client state (auth session, UI prefs)                                |
| Routing     | React Router v7, flat `<Routes>`, no lazy routes; panels switched by a Redux string key                    | Data router, nested layouts, lazy module routes from manifests                                                          |
| Modules     | Module Federation remotes loaded with `lazy()` + `.catch()` fallback + ErrorBoundary + Suspense            | Same lazy + boundary pattern, but plain dynamic `import()` within one build (no federation)                             |
| HTTP        | Two near-duplicate axios instances; token read from `localStorage`; errors not normalized                  | One typed client generated from the backend OpenAPI schema; single-flight refresh; normalized `ApiError`                |
| Auth        | Keycloak `check-sso`; no refresh, logout or role checks; guard calls `login()` during render               | Own JWT auth; access token in memory, refresh token in an httpOnly cookie; `RequireAuth` / `RequireRole` route guards   |
| Realtime    | socket.io singleton; rejoins the room on reconnect                                                         | Not needed in v1. If added later, use a `useSocketEvent` hook with token refresh on reconnect                           |
| Config      | Per-environment TS objects committed with endpoints; Vite `--mode` selects them                            | `import.meta.env` validated by zod at startup; `.env.example` placeholders only; nothing environment-specific committed |
| Tests       | None                                                                                                       | Vitest + React Testing Library + MSW; Playwright smoke; coverage gate                                                   |
| Lint        | ESLint for JS only; no Prettier or Husky                                                                   | ESLint (typescript-eslint strict, jsx-a11y, import boundaries) + Prettier + Husky/lint-staged                           |
| i18n / a11y | None; hardcoded English and `en-US` dates                                                                  | i18next with per-module lazy namespaces (en/ta/hi); `Intl` formatting; jsx-a11y; axe checks in tests                    |
| Build       | Multi-stage Dockerfile → nginx with `/health`; **unminified** production build; no security headers        | Static build on Cloudflare Pages; `_headers` file for CSP/HSTS; hashed assets immutable, `index.html` no-cache          |
| PWA         | None                                                                                                       | vite-plugin-pwa: offline shell, install prompt, IndexedDB sync queue                                                    |

## 2. Patterns worth reusing

1. **Separate shell from features.** Root providers, config and client sit in a shell layer; each
   feature owns its components, services and endpoint maps. This maps to
   `core/` + `platform/` + `modules/<key>/`.
2. **Lazy-load features with a safety net.** Each lazy import has a `.catch()` fallback component,
   an error boundary and a Suspense fallback, so one broken module cannot blank the shell. Every
   module route will be wrapped this way.
3. **Imperative notification API over an event emitter.** One component is mounted once; an object
   exposes `show/update/complete/fail/dismiss`; constants are frozen enums; a `buildConfig()`
   applies defaults; there is a barrel export and a README. This becomes the design-system Toast
   API (`toast.success(...)`, `toast.undo(...)`).
4. **Typed environment config behind an interface,** with one accessor module. Here it is backed
   by a zod schema instead of committed objects.
5. **A throwing context hook** (`useX()` throws outside its provider), plus `useRef` guards against
   React StrictMode double-initialization.
6. **Rejoin subscriptions on reconnect,** for any future realtime channel.
7. **Multi-stage Dockerfile with a health check,** and a `.dockerignore` that excludes secrets. This
   is used only for local production-parity runs, since hosting serves the static build directly.

## 3. Anti-patterns to avoid (and the guard that prevents each one)

| #   | Seen in the reference                                                                           | Guard in Tech-Toppings                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | TypeScript never type-checked; 75 `any`                                                         | `strict` tsconfig; `@typescript-eslint/no-explicit-any: error`; typecheck in CI and pre-commit                                      |
| 2   | Mixed folder casing and typos                                                                   | Convention: kebab-case folders, PascalCase component files; enforced by the ESLint `check-file` plugin                              |
| 3   | Duplicated HTTP clients, services, tooltips, two toast containers                               | One client in `core/api`; all shared UI only in `design-system/`; ESLint `no-restricted-imports` stops modules importing each other |
| 4   | God components (600–800 lines) and grab-bag slices (~25 keys)                                   | `max-lines` lint warning; feature hooks own data; Zustand stores stay small and single-purpose                                      |
| 5   | Tokens in `localStorage` and URL query strings; no refresh or logout                            | Access token in memory only; refresh in an httpOnly cookie; logout revokes server-side                                              |
| 6   | Server state fetched by hand; hardcoded fallback data on failure; dead mock code after `return` | TanStack Query; errors surface through `ApiError` + toast/empty state; MSW mocks live only in tests and dev mock mode               |
| 7   | Non-React modules import the store and dispatch directly                                        | `core/` exposes hooks and services; no singletons reach into stores                                                                 |
| 8   | 1,459 hex literals; Tailwind config silently ignored; no dark mode                              | Tokens as CSS variables (light/dark + per-module accent); lint rule bans arbitrary hex values in classes                            |
| 9   | 135 `console.*` calls; render-delay hacks                                                       | `no-console` (allow `warn`/`error`), plus a `core/logger` wrapper                                                                   |
| 10  | No tests; `npm test` starts a dev server; CI Node version incompatible with Vite                | Real `test` script; `.nvmrc`; CI matrix pinned to the Node version in `package.json#engines`                                        |
| 11  | Seven unused dependencies and a phantom dependency                                              | `knip` in CI flags unused files, exports and dependencies                                                                           |
| 12  | Unminified production build; no CSP; third-party runtime CDN fetches                            | Default minification; strict CSP; fonts self-hosted via `@fontsource` (also needed offline)                                         |
| 13  | No app-level error boundary                                                                     | Root boundary plus one per module route                                                                                             |
| 14  | README left as a template; docs that don't match the code                                       | README run instructions are verified every phase; `docs/modules/<key>.md` maintained                                                |

## 4. Implications for the frontend plan

- Module discovery uses `import.meta.glob('/src/modules/*/manifest.ts', { eager: true })`.
  Manifests are tiny and load eagerly; pages, widgets and i18n namespaces load lazily.
- The backend `/v1/modules` registry is the source of truth for status, enabled flags and order.
  The frontend manifest supplies only presentation (routes, icon, widgets, commands).
- Shared types come from the backend OpenAPI schema (`openapi-typescript`), so no hand-written
  request/response types are duplicated across repos.
