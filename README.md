# Santiago Bet Tracker

A private MLB bet tracker built with Next.js, Prisma, and SQLite.

## Features

- Add and edit bets with game details, odds, wager amount, notes, and optional game date
- Track status transitions: `PENDING`, `WIN`, `LOSS`, `PUSH`
- Set actual payout only when settling a bet as `WIN`
- Dashboard metrics (win rate, net profit, streak, recent bets)
- Admin analytics, filtering, CSV export, and bet-type performance breakdown
- Pending-bet workflow with quick result actions
- Sortable bet tables and mobile-friendly card view
- Simple password protection for all pages and API routes

## POC Go-Live Notes

This release is the current proof of concept shipped as-is. The following items are intentionally deferred until the POC is validated in production:

- Auto MLB matchup discovery in bet entry
- External odds autofill via a provider adapter
- Internal API endpoints for matchup and odds lookup
- Short-lived caching and rate-limit protection for provider calls
- Optional provider metadata on bets such as event ID, bookmaker, market or line, and fetched-at timestamp
- Add-bet UX improvements such as a matchup picker, refresh odds action, and manual override controls
- Graceful fallback to manual entry when a provider is unavailable
- Observability for provider latency and error tracking

## Out of Scope for POC

- Auto-grading bet outcomes
- Live score polling
- Background sync jobs or cron refresh
- Multi-sport support

## POC Exit Gate

- Manual workflow stability is verified
- Auth and API behavior is stable under test
- Dashboard, admin, pending, and export flows show no regressions
- Sportsbook strategy is decided for the next phase
- Provider budget and rate-limit envelope are approved

## Release Checklist

- Cut a release branch from the POC-approved commit
- Keep `DISABLE_AUTH` unset or `false` in production
- Set a strong `APP_PASSWORD`
- Configure `SQLITE_DB_PATH` for the production runtime location
- Run `npx prisma generate` and `npx prisma migrate dev` during deployment setup
- Verify login, add bet, settle bet, dashboard, admin, pending, and CSV export flows before promotion
- Keep the previous deployment available for rollback

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Prisma 7 + `@prisma/adapter-better-sqlite3`
- SQLite (`dev.db`)
- Tailwind CSS 4
- Recharts

## Setup

Prerequisites:

- Node.js 20.19 or newer

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Set at least:

   ```env
   APP_PASSWORD=your-password
   # Optional: session cookie lifetime (default 2592000 = 30 days)
   # AUTH_COOKIE_MAX_AGE_SECONDS=2592000
   # Optional: override DB location (defaults to ./dev.db)
   # SQLITE_DB_PATH=dev.db
   ```

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

5. Run migrations (creates local DB file if missing):

   ```bash
   npx prisma migrate dev
   ```

6. Start development server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` – Start local dev server
- `npm run build` – Production build
- `npm run start` – Run production build
- `npm run lint` – Run ESLint

## Notes on Data Files

- Local SQLite files (`dev.db`, `dev.db-journal`) are gitignored.
- Seed/populate data locally using your own workflow (manual entry or SQL/Prisma scripts).

## Authentication

- Access is protected by a single password (`APP_PASSWORD`).
- Successful login sets an HTTP-only cookie session.
- Unauthenticated API requests return `401`.
