---
project: pods
last-updated: 2026-07-22 22:40
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 social alpha and the Activity Atlas landing are live at `https://pods-nimiq-activity.up.railway.app` through direct Railway deployment `e860b76f-1156-4ed9-94a6-b770a55311de`.

## In Progress (resume here)

- Task: test the live direct `Wallet` header action inside Nimiq Pay on a physical phone.
- File: `apps/web/src/components/landing-motion.tsx` owns the direct wallet action; `apps/web/src/app/landing-page.css` owns the simplified header and unclipped footer wordmark.

## Open Errors / Blockers

- Physical Nimiq Pay verification of the direct landing wallet action remains pending.
- Financial worker and treasury configuration remain intentionally disabled in production.

## Git State

- `origin/main` is merge commit `90eef67`; its application tree matches verified phase commit `6d8aa5f`.
- Fresh `pnpm check` passed: 229 web tests, 48 worker tests, 48 integration tests, copy check, typecheck, and both production builds.
- Browser verification passed at 390 by 844 and 1440 by 1100 with zero warnings, no horizontal overflow, and a fully visible footer wordmark.
- Direct deployment `e860b76f-1156-4ed9-94a6-b770a55311de` reached `SUCCESS`; `/health/ready` returns `200` with configuration, database, and evidence storage ready.

## Next 3 Tasks

1. Open production in Nimiq Pay and confirm `Wallet` invokes the native connection directly with no `/connect` stop.
2. Confirm the live mobile header and footer match the verified browser captures.
3. Continue the next approved product phase only after the physical wallet gate passes.
