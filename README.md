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

## Planning pack: try it

With the backend running and signed in.

### Duplicate warning

1. Open **Expenses**, choose **Add entry**, and save "Rice" for 125 under Groceries.
2. Choose **Add entry** again and type 125 and "rice". When you pause, the form says _You may
   have saved this already: Rice · ₹125 · …_. **Save** still saves it.
3. In the quick-add bar, type "rice 125, tea 20 and coffee 30" and choose **Read it**. On the
   confirm card the rice draft has the same note and a **Save anyway** button, and **Save all
   (2)** saves only the tea and the coffee.

If the check fails or the server is slow, no note is shown and saving works as before.

### Budgets

1. Open **Expenses**, then the **Plan** tab, and choose **Add budget**.
2. Choose **A trip or event**, type the tag "goa", choose **Chosen dates** with a first and last
   day that include today, set the limit to 10,000 and name it "Goa trip". **Save**. (A trip
   that has ended or not started shows _Ended_ or _Starts_ and never warns.)
3. Add an entry of 8,000 on a trip day with the tag "goa" (under **More details**). The Plan
   card says _Nearly spent_ and its meter reads 80%. The bell shows _“Goa trip” budget: 80%
   used, ₹8,000 of ₹10,000_ once, however many more entries you save; following it opens Plan
   with that card ringed.
4. **See entries** on the card opens the trip's entries, with the same total and a _Tagged goa_
   filter you can remove.

A monthly or weekly budget also shows what an even pace would have spent by today (the mark on
its meter) and what is left a day.

### Goals

1. Open **Expenses**, then the **Plan** tab, choose **Goals** and then **Add goal**.
2. Name it "Bike", set the target to 50,000 and **Reach it by** a day a few months ahead.
   **Save**. The card says how much a month it takes to get there by that date.
3. **Add money**, type 12,000 and choose **Add**. The meter reads _24% saved: ₹12,000 of
   ₹50,000_. **Take out** takes some back (never more than is saved).
4. Add the rest. The card says _Reached_ and the bell shows _You reached your goal “Bike”:
   ₹50,000 saved_ once; following it opens Plan with that card ringed.
5. **Add goal** again, choose **From what I keep** and a first day. This goal grows by itself
   with money in less money out from that day, so it has no **Add money** button.

**Delete** on a card can be undone from the message that follows. If a goal changes on another
device while you edit it, saving offers **Reload goal** for the latest. Money sent again after a
dropped connection counts once, and the message then says what the goal holds.

### Bills and repeats

1. Open **Expenses**, then the **Plan** tab, choose **Bills** and then **Add bill**.
2. Type "Electricity", 1,200, choose **Utilities**, **Monthly**, a **First due date** two days
   ahead, keep **Remind me to pay** and **2 days before**, and **Save**. The card sits under
   _This week_ and says _Every month · due in 2 days_.
3. The bell shows _“Electricity” is due …: ₹1,200_ once (from 9:00 your time on the reminder
   day), however often it polls; following it opens Bills with that card ringed. The
   Notifications page lists it under _Coming up_.
4. **Paid** opens a dialog with ₹1,200 filled in; change it if the bill was different and choose
   **Mark paid**. The entry is added (its page shows a **Repeats** badge that leads back here),
   and the card moves on to next month. Left unpaid, a bill moves to _Overdue_ and stays there.
5. **Add bill** again with **Add it for me** and today as the first date: today's entry is added
   at once, and each next one on its day.
6. Save "Milk" three weeks running (a week apart, the last within the week). A _Looks like it
   repeats_ card offers **Remind me** or **Add it for me** (the form opens filled in), or **Not
   regular**, after which it is never suggested again.

The switch on a card pauses it: no entries and no reminders until it is on again, starting from
today (a bill already paid ahead stays paid).

### Loans

1. Open **Expenses**, then the **Plan** tab, choose **Loans** and then **Add loan**.
2. Keep **I lent**, type "Ravi" and 1,000, set **To be paid back by** to tomorrow, and **Save**.
   The message says _Saved: Ravi owes you ₹1,000._ The tiles show what is owed to you and what
   you owe, and Ravi's row says _Owes you ₹1,000_ and _1 open loan · next due tomorrow_.
3. The bell shows _Ravi is due to pay you back ₹1,000 by …_ once (from 9:00 your time on the
   reminder day); following it opens Ravi's loans with that loan ringed.
4. Choose Ravi. **Record payment** opens with ₹1,000 filled in, what is left. Type 400 and choose
   **Record payment**: the sheet says _Saved: Ravi owes you ₹600._ and the loan lists the payment.
   More than is left is refused, saying how much is left.
5. **Undo payment** beside a payment takes it back, once. **Add loan** in the sheet adds another
   loan with Ravi; **Edit** and **Delete** (after asking) change or remove one.

A loan never becomes an entry, and "Ravi" and "ravi" are one person. Money sent again after a
dropped connection counts once.

### Loans by voice

Works with AI off (quick mode) or on.

1. Open **Expenses** and say or type "lent Ravi 500" in the quick-add bar, then **Read it**. The
   confirm card shows _Lent to Ravi_, ₹500, with _Check: Person_ (the name is picked out of the
   sentence). Nothing is saved yet.
2. **Save** (the tick). The message says _Saved: Ravi owes you ₹500._ A loan never becomes an
   expense, so the entries list is unchanged.
3. Say "Ravi paid me back 200". The card shows _Ravi paid you back_ and **Towards the loan**,
   with Ravi's oldest open loan chosen. **Save**: _Saved: Ravi owes you ₹300._ With no open loan
   with that person, the card says so and can only be dismissed. **Plan → Loans** shows the same.
4. The pencil opens **Check the loan**, to change what happened (lent, borrowed, or paid back
   either way), who, how much and when, and for a new loan when it is to be paid back.
5. In the command palette (Ctrl+K), ask "lent Ravi 500": **Open Expenses** brings the loan to the
   same card. Being paid back is read only from the Expenses page.

"gave Ravi 500" stays an expense, and a refund or change from a shop is never a loan.

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
    speech/              dictation and read-back (Web Speech API), when the browser has them
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
                         Skeleton, AnimatedNumber, MotionProvider, chart scale ...): the only
                         UI modules use
  modules/               one folder per module (manifest.ts)
    expenses/            entries with history, add/edit form, categories, quick add and the
                         confirm card, prices (products, price chart, matches), overview
                         (analytics charts, insight card), i18n/{en,ta,hi}.json
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
