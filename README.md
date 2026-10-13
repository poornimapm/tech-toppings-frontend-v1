# tech-toppings-frontend-v1

The web app for **Tech-Toppings**, a modular, multi-user personal platform. It is one shell
app with independent modules; Module 1 is a voice-first expense tracker. Built as a React +
TypeScript PWA that supports English, Tamil and Hindi.

- Backend: <https://github.com/poornimapm/tech-toppings-backend-v1>
- Plan, ADRs, free-tier limits: in the backend repo's
  [`docs/`](https://github.com/poornimapm/tech-toppings-backend-v1/tree/develop/docs)
- Frontend docs: [docs/](docs/)

> **Status:** Phase 2 (auth) is done. Built so far: sign in, register (allowlist), forced or
> voluntary password change, signed-in devices, optional Google sign-in, and protected routes
> on top of the Phase 1 shell (live status, en/ta/hi, themes).

## Stack

| Concern        | Choice                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Runtime        | **Node 24 LTS**, scoped to this repo via `.node-version` + fnm. Your system Node is untouched.                      |
| Framework      | React 19, Vite 8, TypeScript 5.9 (strict)                                                                           |
| Routing / data | React Router 8 (data router, lazy routes, auth guards), TanStack Query 5                                            |
| State          | Zustand (session in memory, theme, toasts)                                                                          |
| Motion and UX  | motion (lazy-loaded, reduced-motion aware), dnd-kit (accessible drag and drop), Radix Dialog, lucide-react icons    |
| Forms          | react-hook-form + zod (`zod/mini`, tree-shaken)                                                                     |
| API client     | `openapi-fetch` with types generated from the backend OpenAPI schema                                                |
| Styling        | Tailwind CSS 4 with semantic design tokens (WCAG-AA contrast checked in tests)                                      |
| i18n           | i18next + react-i18next (en / ta / hi), typed translation keys                                                      |
| Quality        | ESLint (typescript-eslint strict, jsx-a11y), Prettier, Vitest + Testing Library + MSW, vitest-axe, Playwright, knip |

## Prerequisites

- **fnm** (Node version manager) with Node 24. Install fnm once with
  `winget install --id Schniz.fnm -e --scope user`, then run `fnm install 24`.
- The backend running locally for live data. See the backend README. The app also runs
  without it and shows "Waking up…" / "Unreachable".

## Setup (first time)

In PowerShell, from this folder:

```powershell
. .\scripts\use-node.ps1     # this terminal now uses Node 24 (from .node-version)
npm install                  # all packages go to node_modules (nothing global)
copy .env.example .env       # optional: every value has a default
npm run e2e:install          # optional: Chromium for smoke tests, installed INTO node_modules
```

`use-node.ps1` affects only the current terminal. Run it in each new terminal you use for this
repo. Other projects keep your system Node 20.

## Run

```powershell
npm run dev
```

Opens <http://localhost:5173>. Requests to `/api/*` are proxied to the backend set in
`DEV_API_PROXY_TARGET` (default `http://localhost:8000`). Production uses the same proxy
pattern, so the browser always talks to its own origin.

### Verify

| With the backend…                       | You should see                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| running (`poe dev` in the backend repo) | **System status:** API _Online, Version 0.1.0_; Database _Ready_                                                                                 |
| running, but MongoDB stopped            | Database _Not ready_, plus a translated reason                                                                                                   |
| stopped                                 | After ~3 s, a "Waking up the server…" banner; after ~90 s, _Unreachable_ with **Try again**. It recovers automatically when the backend returns. |

Sign-in flow, with the backend running and your email in its `AUTH_ALLOWED_EMAILS`:

1. Open <http://localhost:5173>. You are sent to **Sign in** (`/login?next=/`).
2. Choose **Create an account**, register, and land on the welcome page.
3. Reload the page. You stay signed in: the refresh cookie is exchanged for a new access token.
4. Open **Security** to see your devices ("This device" is marked). Sign in from another
   browser, then sign that browser out from here.
5. Choose **Sign out**, or **Sign out of all devices**.
6. Admin reset: in the backend run `poe reset-password --email you@…` and sign in with the
   one-time password. Only **Choose a new password** is reachable until you change it.

Also try:

- the **language** menu (English / தமிழ் / हिन्दी) and the **theme** button (Light → Dark →
  System); both are remembered;
- any unknown URL, which shows _Page not found_;
- **Tab** from the top of the page, which shows a "Skip to main content" link.

## Scripts

| Command                                     | What it does                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`                               | Dev server with HMR and the `/api` proxy                                                                |
| `npm run build`                             | Typecheck, then production build to `dist/`                                                             |
| `npm run preview`                           | Serve the production build (with the same `/api` proxy)                                                 |
| `npm run lint`                              | ESLint, zero warnings allowed                                                                           |
| `npm run format` / `format:check`           | Prettier write / check                                                                                  |
| `npm run typecheck`                         | `tsc -b` (app + node configs)                                                                           |
| `npm test` / `test:watch` / `test:coverage` | Vitest (coverage gate: 70% for lines, branches, functions and statements)                               |
| `npm run e2e`                               | Playwright smoke tests against the production build (API stubbed)                                       |
| `npm run knip`                              | Find unused files, exports and dependencies                                                             |
| `npm run gen:api`                           | Regenerate `src/core/api/schema.d.ts` from the backend's `openapi.json` (run `poe openapi` there first) |
| `npm run check`                             | **Everything CI's quality job runs**, locally                                                           |

## Configuration

Every variable is documented in [.env.example](.env.example).

- `VITE_*` values are compiled into the public bundle, so never put secrets there.
- `DEV_*` / `PREVIEW_*` values configure only the local servers.

## Project layout

```
src/
  main.tsx               entry: styles, i18n, providers, router
  core/                  framework plumbing (no feature knowledge)
    api/                 typed client, ApiError, query client, server-status hooks, usePages,
                         generated schema
    auth/                session store, refresh (single-flight, cross-tab lock), API middleware,
                         route guards, bootstrap, password policy
    config/env.ts        validated VITE_* configuration
    i18n/                i18next setup, locales/{en,ta,hi}/{common,errors}.json
    theme/               design tokens (tokens.css), theme store
    utils/
  platform/              shell features shared by all modules
    shell/               app, routes, layout, main navigation (header or bottom bar), error
                         boundaries, banner, account nav, language/theme
    auth/                sign in, register, change password, security (devices), Google button
    core/modules/        module registry (import.meta.glob), tiles query, optimistic preferences
    core/agents/         agents API: availability, ask, confirm/reject proposals, AI consent
    core/dashboard/      dashboard query (own or, for admins, all users)
    core/notifications/  notifications: list, unread count (polled), read / remove
    core/activity/       the user's activity feed
    welcome/             animated Welcome page: tiles, search, filters, favourites, customize
    palette/             Ctrl/⌘+K command palette + "Ask the assistant" (agents API), lazy
    dashboard/           dashboard page: stat tile, area chart, widget card, period presets
    notifications/       notifications page
    activity/            activity page
    feed/                FeedPage and FeedRow, shared by the feeds and the dashboard lists
  design-system/         shared UI (Button, Dialog, Toaster, FilterChips, SearchField, Switch,
                         Skeleton, AnimatedNumber, MotionProvider ...): the only UI modules use
  modules/               one folder per module (manifest.ts)
    expenses/            entries with history, add/edit form, categories, i18n/{en,ta,hi}.json
    medicine/ ...        the other seven: manifest only, coming soon
  test/                  test setup, MSW server, render helpers, naming-convention test
e2e/                     Playwright smoke tests
scripts/                 use-node.ps1, gen-api-types.mjs
```

## Conventions (enforced by tooling)

- Imports use the `@/` alias, never `../`. ESLint enforces this.
- File and folder names are kebab-case. A unit test enforces this.
- Colours come only from semantic tokens (`bg-surface`, `text-muted`, …). Token pairs must
  meet WCAG AA contrast, enforced by a test.
- Every user-facing string goes through i18n. A test checks that Tamil and Hindi have
  exactly the same keys as English.
- Server errors are shown by `code` (translated), never as raw messages.
- The access token lives only in memory. The refresh token is an httpOnly cookie the app
  never sees. Post-login redirects accept only same-app paths (`safeNext`).
- Git hooks: husky + lint-staged run ESLint and Prettier on staged files, using this repo's
  Node through fnm.
- Line endings: LF in git (`.gitattributes`).

## CI

`.github/workflows/ci.yml` runs on every push and pull request to `develop` and `main`:

- a quality job: lint, format, typecheck, tests with coverage, knip, build, `npm audit`;
- a Playwright smoke job;
- a gitleaks secret scan.
