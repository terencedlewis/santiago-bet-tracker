# Review Notes - 2026-07-28

## Scope reviewed
- Repository: santiago-bet-tracker
- Focus areas:
  - Security and auth flow
  - API validation and data integrity
  - Build and deploy readiness
  - Dependency risk scan
  - UI rendering verification on desktop and mobile

## What we ran and observed
- Local dependency install and lint:
  - npm ci
  - npm run lint
  - Result: lint passed.
- Initial build from clean clone:
  - npm run build
  - Result: failed at first because generated Prisma client was missing.
- Prisma generation:
  - npx prisma generate
  - Result: generated client at src/generated/prisma.
- Build after Prisma generation:
  - npm run build
  - Result: successful production build.
- Dependency audit:
  - npm audit --omit=dev --json
  - Result: 7 production vulnerabilities reported (6 high, 1 moderate).

## Key findings from code review

### 1) Critical - static auth cookie can be forged
- Auth currently uses a fixed cookie value and middleware checks equality against that constant.
- Risk: if a client can set the same cookie value, route protection can be bypassed.
- Relevant files:
  - src/lib/auth.ts
  - middleware.ts
  - src/app/api/auth/login/route.ts

### 2) High - API validation is not strict enough
- Bet create/update routes coerce incoming values with Number(...) and new Date(...) without strict finite/valid checks.
- PATCH payout checks can still permit malformed values to reach update logic in edge cases.
- Risk: malformed payloads can trigger avoidable 500 errors and potential data quality issues.
- Relevant files:
  - src/app/api/bets/route.ts
  - src/app/api/bets/[id]/route.ts

### 3) Medium - deploy pipeline fragility around Prisma client generation
- App imports generated Prisma client from src/generated/prisma.
- Build fails if prisma generate is not run prior to build in a clean environment.
- Relevant files:
  - src/lib/prisma.ts
  - package.json
  - README.md

### 4) Medium - no first-party test suite
- No project test files or test script are present.
- Risk: higher regression risk during future changes/deployments.
- Relevant file:
  - package.json

### 5) Medium - dependency vulnerabilities need triage
- Production audit currently shows 6 high and 1 moderate vulnerabilities.
- Relevant package areas include next/prisma transitive paths from audit output.

## Rendering review completed
UI rendering was verified live at localhost on both desktop and mobile viewport.

### Desktop pages captured
- Home
- Dashboard
- Add Bet
- Pending
- Admin

### Mobile pages captured
- Home
- Dashboard
- Add Bet
- Pending
- Admin

## Hosting readiness snapshot
- Private/internal hosting readiness: approximately 85-90%.
- Public internet hosting readiness: approximately 60-70%.

### Why not public-ready yet
- Auth hardening is required.
- API request validation should be strengthened.
- Vulnerability remediation/triage is pending.
- Prisma generation should be automated in deployment workflow.
- Minimal tests should be added.

## Recommended next work session order
1. Replace static cookie auth with signed session strategy.
2. Add strict schema validation for all API write routes.
3. Add automated prisma generate in lifecycle/CI before build.
4. Triage and remediate dependency vulnerabilities.
5. Add smoke tests for login plus bet CRUD/status transitions.

## Notes for continuation
- Dev server was used for live rendering and can be restarted with:
  - npm --prefix /Users/imacdoc/santiago-bet-tracker run dev
- If build errors reference missing Prisma client, run:
  - npx prisma generate
