# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 10: admin console, account security

- **Two-step sign-in**:
  - after the password or Google, sign-in asks for a code from an authenticator app, or a
    recovery code;
  - a sign-in that ran out starts over with a reason.
- **Security page**:
  - **Two-step sign-in**: set it up (a link for the authenticator app and the key in groups),
    see recovery codes once (copy or download), get new ones, or turn it off. Turning it on or
    off asks for the password, or Google again for an account without one, plus a code.
  - **Your data**: download everything as one JSON file, or delete the account. Deleting asks
    for the email typed out, the password (or Google again) and a code if two-step is on.
- **Setting a first password** (an account made with Google): sign in with Google again, plus a
  code with two-step on.
- **Admin console** at `/admin`, for admins only. The link sits in the header and the command
  palette. It has five sections:
  - **Usage**: accounts, active users, assistant requests and fallback rate, sign-ups per day,
    AI calls by provider, errors by code, and database size against the quota.
  - **Users**: search and filter. Each account shows its details and lets you change its role,
    disable or enable it, sign it out everywhere, or reset its password (the one-time password
    is shown once). Each change is confirmed first, and a refusal shows in that dialog. Your own
    account offers no actions.
  - **Allowlist**: invite by email with a note. Entries from server settings are marked and
    can't be removed here.
  - **Modules**: each module's stage and on/off for everyone, with a reset to how it ships.
  - **Audit log**: filter by action, subject and UTC days, with times in UTC. Opened from an
    account, it shows that account's entries. Allowlist and module changes show up in it at
    once.
- Design system: `Table`, `Pager`, `SelectField` `hideLabel`, and `SearchField` `maxLength`.
- `core/api/save-file`: any file the API sends, saved under its own name.
- English, Tamil and Hindi text for all of the above and the new error codes.

### Fixed — Phase 10 review

- After deleting the account, the "account deleted" message and the move to sign-in now happen
  (they ran from a page that had already closed).
- A refused Google re-check asks for a new Google sign-in instead of keeping the refused one,
  and the delete dialog starts empty each time it opens.
- Delete stays disabled until the two-step code is typed (an empty code counted toward the
  lockout).
- The one-time recovery codes stay on screen even when refreshing the status fails.
- A new setup no longer shows the last attempt's "wrong code" error.
- Copying recovery codes says so when the clipboard isn't available.
- The code field takes the focus when sign-in moves to the code step.
- Admin: only the latest action's error shows; per-row buttons have their own names ("Remove
  someone@example.com", "Reset Expenses"); search and filter fields stop at the server's
  limits; the audit log's page goes back to 1 when moving between accounts.

### Added — Phase 9b: data pack (in progress)

- **Saved views** on the Expenses list: save the filters shown under a name, open them from a
  chip, rename or delete a view, and give a taken name to new filters.
- **Bulk edit**: **Select** on the Expenses list ticks entries; move them to a category, add
  or take off a tag, or delete them (undo from the message); bring back deleted ones.
- **Search** in the command palette: your saved views, loans, products and entries, under each
  module's name; a saved view opens from a link (`?view=<id>`).
- **Export CSV** on the Expenses list: downloads what the list shows.
- **Import CSV** page: choose a file, check or change the guessed columns and date format, and
  see what it would add, what is saved already and which rows have a problem; then import it,
  with progress, carrying on after a dropped connection without adding anything twice.
- **Monthly report** page (from Overview): print or save as PDF, or download the figures as CSV;
  the app's header and navigation stay off the printed page.
- **Chat with expenses** in the command palette: answers about your own figures, worded in
  English, Tamil and Hindi; palette answers now write days in your language too.
- **Other currencies**: a new entry can be in any currency with a rate; the list shows what it
  counted as in yours.

### Added — Phase 9a: planning pack (2026-10-16)

- **Plan** tab in Expenses, with four sections:
  - **Budgets**: for all spending, a category, or a trip's tag over chosen dates; a meter with
    the even-pace mark and what is left a day; **See entries** opens the same total.
  - **Bills**: grouped by when they are due; **Paid** adds the entry; repeating entries that
    add themselves; _Looks like it repeats_ suggestions.
  - **Goals**: add or take out money, or grow with what you keep.
  - **Loans**: what is owed each way, a row per person, and a sheet to record or undo payments.
- **Loans by voice**: "lent Ravi 500" or "Ravi paid me back 200" becomes a loan draft on the
  confirm card, beside the entries.
- **Duplicate warning** on the entry form and the confirm card; **Save all** leaves out what
  looks saved already.
- **Coming up** on the Notifications page: reminders that are due soon, which can be put off
  or dismissed.
- Notifications for budgets, goals, bills and loans lead to their card, ringed.
- English, Tamil and Hindi for all of the above.

### Changed

- The Expenses tabs scroll within their bar on phones.
- Dates in notifications share one helper (`withDates`).

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
