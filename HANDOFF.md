---
project: pods
last-updated: 2026-07-22 22:40
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 social alpha and the Activity Atlas landing are committed and pushed through `d87bdad`; the local landing is browser-verified, while the source-linked Railway deployment is still queued.

## In Progress (resume here)

- Task: verify Railway deployment `ba755a24-e0ca-4124-9f0b-51d28baba2c1` reaches `SUCCESS`, then test the direct `Wallet` header action inside Nimiq Pay.
- File: `apps/web/src/components/landing-motion.tsx` owns the direct wallet action; `apps/web/src/app/landing-page.css` owns the simplified header and unclipped footer wordmark.

## Open Errors / Blockers

- Railway deployment `ba755a24-e0ca-4124-9f0b-51d28baba2c1` for `d87bdad` remains `QUEUED` with reason `Processing deployment...`; the previously queued `186d4e8` deployment cites upstream GitHub issues.
- Physical Nimiq Pay verification of the direct landing wallet action remains pending.
- Financial worker and treasury configuration remain intentionally disabled in production.

## Git State

- `origin/main` and `origin/phase/04a-social-alpha-foundation` contain application commit `d87bdad` (`fix: streamline landing wallet entry`).
- Fresh `pnpm check` passed: 229 web tests, 48 worker tests, 48 integration tests, copy check, typecheck, and both production builds.
- Browser verification passed at 390 by 844 and 1440 by 1100 with zero warnings, no horizontal overflow, and a fully visible footer wordmark.

## Next 3 Tasks

1. Poll deployment `ba755a24-e0ca-4124-9f0b-51d28baba2c1` to terminal status and verify production health.
2. Open production in Nimiq Pay and confirm `Wallet` invokes the native connection directly with no `/connect` stop.
3. Continue the next approved product phase only after the physical wallet gate passes.
