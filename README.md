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

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Prisma 7 + `@prisma/adapter-better-sqlite3`
- SQLite (`dev.db`)
- Tailwind CSS 4
- Recharts

## Setup

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
