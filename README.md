# Santiago Bet Tracker

A private MLB bet tracker built with Next.js, Prisma, and PostgreSQL.

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

- Next.js 16 + React 19 + TypeScript
- Prisma 7 + `@prisma/adapter-pg`
- PostgreSQL
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
   APP_PASSWORD=your-user-password
   ADMIN_PASSWORD=your-admin-password
   DATABASE_URL=postgresql://postgres:your-password@localhost:5432/santiago_bet_tracker
   # Optional: strong signing secret for signed sessions (defaults to APP_PASSWORD if omitted)
   # AUTH_SESSION_SECRET=replace-with-a-long-random-string
   # Optional: disable auth for local testing (`true` bypasses password/session checks)
   # DISABLE_AUTH=true
   # Optional: session cookie lifetime (default 2592000 = 30 days)
   # AUTH_COOKIE_MAX_AGE_SECONDS=2592000
   ```

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

5. Run migrations against the configured PostgreSQL database:

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

## Database

The app requires a PostgreSQL database. Set `DATABASE_URL` before running Prisma
commands or starting the app. Seed/populate data using your own workflow (manual
entry or SQL/Prisma scripts).

## Authentication

- Access is protected by user and admin passwords (`APP_PASSWORD` and `ADMIN_PASSWORD`).
- All bet mutations require an authenticated admin session.
- Successful login sets an HTTP-only cookie session.
- Unauthenticated API requests return `401`.
- For local testing only, set `DISABLE_AUTH=true` to bypass login and API auth checks.
- Never set `DISABLE_AUTH=true` in production or deployed environments.
