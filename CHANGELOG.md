# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 3: modules and the Welcome page (2026-10-09)

**Module system**

- Module folders `src/modules/<slug>/manifest.ts` (icon, accent, en/ta/hi text, keywords,
  optional routes), discovered with `import.meta.glob`. A mismatched or duplicate key fails
  loudly.
- Manifests for expenses, medicine, receipts, study, government documents, meals, habits
  and journal.
- Tiles merge `/v1/modules` with manifests. Pin, on/off, order and notify-me update
  optimistically and roll back on error.
- Module pages mount at `/m/<slug>/*` behind a gate that explains unavailable modules.

**Welcome page**

- Time-of-day greeting in the user's time zone, gradient headline, drifting aurora
  background, compact status pill.
- Search with `/` and Ctrl/⌘+K shortcuts, plural-tolerant and cross-language. Counted
  filter chips with a gliding highlight, kept in the URL.
- Favourites and All modules sections with shared-layout animations; hidden modules can be
  brought back.
- Glass tiles with 3D tilt, cursor spotlight, hover lift, press spring, star burst on
  favourite, count-up figures and status badges (Beta, Coming soon, Turned off).
- A details dialog (a bottom sheet on phones) with switches for Notify me, Favourite and
  Show on my page.
- Customize mode: drag and drop with pointer, touch or keyboard (translated announcements),
  Move earlier/later and hide buttons, saved automatically.
- Toasts with Undo, shimmer skeletons, error retry, friendly empty states.

**Design system**

- New: `MotionProvider`, `Badge`, `Skeleton`, `Dialog`, `FilterChips`, `SearchField`,
  `Switch`, `EmptyState`, `AnimatedNumber`, `Toaster` / `toast()`, `usePointerTilt`.
- Module accent tokens (9 pairs), aurora and glass tokens, all contrast-tested in both
  themes.
- Sticky glass header.

**Quality**

- ESLint keeps modules away from platform internals and other modules.
- Tests: registry and demo module, statuses, search, filters, pins with undo, rollback,
  notify-me, customize, Tamil, module routes, toasts and primitives, and axe with and
  without the dialog.
- Playwright: favourite a module and request a launch notice in the real build.

### Added — Phase 2: auth (2026-10-08)

**Session handling**

- Session store (Zustand) with the access token in memory only.
- `refreshSession()`: one request shared by concurrent callers, serialised across tabs with
  the Web Locks API, and retried once on `AUTH_REFRESH_RACE`.
- API middleware:
  - adds `Authorization` and the CSRF header to every request;
  - on `AUTH_TOKEN_EXPIRED`, refreshes once and replays the original request, body included;
  - signs out on a revoked session;
  - flags a pending password change.
- `AuthBootstrap` restores the session at startup and keeps retrying while the free backend
  wakes up. It also drops cached data when the account changes.

**Routes and pages**

- Route guards: `RequireAuth` (redirects to `/login?next=…`), `RequirePasswordFresh`
  (forced change after an admin reset) and `PublicOnly`.
- Pages:
  - **Sign in**: validation, translated server errors, lockout wait time, show/hide password,
    optional Google button.
  - **Register**: live password-rule checklist, allowlist and closed-mode messages.
  - **Change password**: voluntary and forced.
  - **Security**: devices, "This device", sign out a device, sign out everywhere with
    confirmation.
- Header account nav with Sign out.

**Preferences and UI**

- Language and theme are saved to the account and applied again on sign-in on any device.
- Design system: `TextField`, `PasswordField` and `Alert`, all with accessible labels and
  error wiring.
- en/ta/hi strings for all auth screens and error codes.

**Tests**

- 128 unit and component tests.
- 5 Playwright smoke tests, including a sign-in journey.

## Phase 1 — foundations (2026-10-08)

**Project setup**

- Vite 8 + React 19 + TypeScript 5.9 (strict, `noUncheckedIndexedAccess`) project.
- Node 24 LTS pinned through `.node-version` (fnm). `scripts/use-node.ps1` scopes it to a
  terminal session.

**API layer**

- Typed API client: `openapi-fetch` with types generated from the backend OpenAPI schema
  (`npm run gen:api`).
- A single `ApiError` (envelope, synthetic `HTTP_<status>`, `NETWORK_ERROR`).
- Request IDs on every call.

**Server status**

- Health hooks report `checking`, `waking`, `online` and `offline`, with exponential backoff
  for free-tier cold starts.
- A "Waking up the server…" banner and a retry action.
- The welcome page shows live API version and database readiness.

**Shell**

- React Router 8 data router with lazy pages.
- Root error page, app-level error boundary and not-found page.

**Look and accessibility**

- Tailwind CSS 4 semantic design tokens with light, dark and system themes (persisted).
  Token contrast is verified to WCAG AA in tests.
- Skip link, labelled controls and polite live-region announcements.

**Languages**

- i18n in English, Tamil and Hindi, with typed keys, a persisted choice, `<html lang>` sync,
  and translated server error codes.

**Testing**

- Vitest + Testing Library + MSW 3 (unhandled requests fail), plus vitest-axe accessibility
  checks.
- 69 tests at 98.7% line coverage.
- Playwright smoke tests against the production build: 4 tests, with Chromium installed
  into `node_modules`.

**Tooling and CI**

- ESLint (typescript-eslint strict-type-checked, jsx-a11y strict, react-hooks), Prettier
  (with Tailwind class sorting) and knip.
- husky + lint-staged, using this repo's Node through fnm.
- Vendor chunk splitting (react / router / vendor), so app deploys keep framework caches
  warm.
- GitHub Actions: quality job, Playwright job and gitleaks.
