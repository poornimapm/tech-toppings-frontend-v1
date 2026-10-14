# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 8: overview and insights (2026-10-14)

- **Overview** tab in Expenses: a summary of the month or week in words (written by AI, or a
  quick summary without it), the period's figures with the change against the same days
  before, spending per day, the running total with where the month is heading, a forecast,
  shares by category, person, place and product, a day-by-week heatmap, net savings per
  month and unusual spending.
- **Drill-down:** clicking any bar, row or day opens the entries behind it with the same
  total; the list shows a chosen range, person or place as filters you can remove.
- English, Tamil and Hindi for all of the above.

### Changed

- Money in notifications, assistant replies and summaries shares one helper (`withMoney`).
- The entries list keeps a custom range, a person and a place in its URL.

### Added — Phase 7: products and prices (2026-10-14)

- **How much was bought**: quantity and unit in the entry form (with the price per unit as
  you type), on drafts and in the list.
- **Prices**: a new tab in Expenses listing what you buy, with the latest price per unit,
  how it moved since the time before, a trend line, and where it is cheapest.
- **A product's page**: price tiles, a chart with a line per shop (readable by keyboard and
  screen readers), prices by place, every purchase, and settings for its price alert, price
  unit, names, combining and stopping.
- **Find matches**: suggestions of products that are the same thing under another name
  (another language, a spelling, a plural), to combine or keep apart.
- **Price alerts** in the notification centre, worded with money in your language and leading
  to the product.
- An entry page shows what it came to per unit and leads to its price history (or follows
  its price).
- English, Tamil and Hindi for all of the above.

### Changed

- The series colours (`--tt-series-1..5`) and chart scale helpers are in the design system;
  `SelectField` shows a validation message like `TextField`.
- A module manifest can link notifications to its pages (`links`).

### Added — Phase 6: capture by voice, text and SMS (2026-10-14)

- **Quick add** on the Expenses page: type, dictate (where the browser can listen) or paste a
  bank SMS; the words stay editable before they are read.
- **Confirm card:** what was understood, as drafts. Guessed fields are listed for checking;
  complete drafts save in one click (or all at once), others open in the entry form already
  filled in. Nothing is saved until the user saves it, and each draft saves only once.
- **Read-back:** saved entries can be read aloud with a device voice for the user's language.
- The page says whether AI or Quick mode read the text, explains when neither can, and
  offers to turn AI on.
- Drafts the command palette prepares open in Expenses, ready to check.
- `core/speech`: dictation and read-back hooks; `VITE_SPEECH_REGION` sets the speech
  languages' region (default `IN`).
- English, Tamil and Hindi for all of the above.

### Changed

- The assistant's static-mode answers for capture are worded in the module's manifest; the
  shell passes a client action's arguments to the page it opens (`MODULE_ACTION`).

### Added — Phase 5: expenses (2026-10-13)

- **Expenses module** (`/m/expenses`, beta):
  - Entries by day with totals (spent, received, left over) for whatever is shown.
  - Filters kept in the URL: spent, received or deleted; this month, last month, last 90
    days or all time; a category; and search.
  - Add or edit in a dialog: amount, what, category and date first; time, where, payment
    mode, for whom, tags, note and a link under "More details", with suggestions from what
    was typed before.
  - An entry's page with its history in words, and "Restore this version" on any earlier one.
  - Delete with Undo; deleted entries can be listed and brought back.
  - The user's own categories: add with a name and an emoji, archive.
  - A floating Add button on phones.
- **Modules bring their own words:** activity entries, assistant replies, widget titles and
  the pages the assistant may open are declared in the module's manifest; its screens are
  worded in its own `i18n` folder, loaded with its pages and type-checked.
- `core/utils/money.ts` and `core/utils/dates.ts`; a `SelectField` primitive.
- English, Tamil and Hindi for all of the above (136 module strings).

### Changed

- Assistant text and client actions are looked up from modules first
  (`useAgentText`, `actions`), so the shell no longer lists them.
- ESLint lets each module import its own folder (still no other module or platform code).

### Added — Phase 4b: dashboard, notifications and activity (2026-10-13)

- **Dashboard** (`/dashboard`): widgets from every module and platform area, drawn by kind.
  - Figures count up and show their change against the previous period in words.
  - Area chart with a crosshair and tooltip; arrow keys, Home and End read each day; the
    same numbers are available as a table.
  - 7, 30 and 90 day periods, counted in the user's time zone and kept in the URL. The
    previous figures stay on screen, dimmed, while a new period loads.
  - A widget that failed on the server says so on its own card.
  - Admins can switch to totals across all users.
- **Notifications** (`/notifications`): unread marks, mark one or all as read, remove, and
  follow a launch notice to its module. The navigation shows the unread count.
- **Activity** (`/activity`): the user's own record of changes, with "show more".
- **Navigation:** a bottom bar on phones (Home, Dashboard, Notifications) that becomes part
  of the header on wider screens.
- **Assistant:** "what's new" and "mark all as read" answers (the `check-notifications`
  skill), and an action that opens the notifications page.
- `FeedPage`, `FeedRow`, `usePages`, `useFeedText`, `useMediaQuery` and a `LoadError`
  primitive, shared by the new pages and the Welcome page.
- English, Tamil and Hindi strings for all of the above.

### Changed

- The command palette loads on first use instead of with the first page, and the header
  button pre-fetches it on hover or focus.
- Dialog code (Radix) moved to its own on-demand chunk. `package.json` `sideEffects` marks
  the design system as pure, so importing one primitive no longer pulls in the rest.
- First load: 248 kB to 232 kB gzip (JS and CSS together).
- Toasts sit above the bottom bar on phones.

### Fixed

- Typing quickly in the module search could drop characters, because the box shows the
  URL's value and the URL was updated in a later transition. It now updates within the
  keystroke.

### Added — Phase 4: command palette and assistant (2026-10-09)

- Command palette (cmdk), opened with Ctrl/⌘+K or the header button:
  - commands for pages, module actions (open, pin, notify, show), theme, language and
    sign out, all built from existing registries;
  - grouped, filterable, fully keyboard-operable.
- "Ask the assistant" in the palette:
  - the agent's reply or a translated static-mode message, with an AI / Quick mode badge;
  - proposals with Confirm / Dismiss, and client actions such as opening a module;
  - honest unavailable states, and an in-place switch to turn AI on.
- The footer shows the AI state (on, quick mode or off) and today's remaining AI requests.
- Module details open from the URL (`/?module=<key>`); Back closes them.
- `useSignOut()` is shared by the header and the palette. `pages.ts` is the one page table
  for the router and the palette.
- `VITE_ASSISTANT_AGENT` configures which backend agent answers.
- English, Tamil and Hindi strings for the palette, agent states and every static-mode
  message code.
- Tests: palette commands, asking in static and agent mode, confirm/dismiss, the consent
  flow, client actions, errors, axe, signed-out visitors, deep links. A Playwright journey
  covers asking, confirming and navigating.

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
