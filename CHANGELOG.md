# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 1: foundations (2026-10-08)

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
