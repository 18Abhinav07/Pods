---
project: pods
last-updated: 2026-07-22 17:31
last-agent: codex
mode: HACKATHON
---

## State

The complete Phase 4 adaptive social release is committed and published to GitHub. The new Railway project `shimmering-empathy` now runs the web release from commit `84e19b5` with Postgres and a private evidence bucket. Production starts from 10 migrations, 28 application tables with zero rows, and an empty evidence bucket.

## In Progress (resume here)

- Open `https://pods-activity.up.railway.app` inside Nimiq Pay on a physical phone.
- Complete wallet connection, profile onboarding, Pod creation, room messaging, and proof privacy checks with two wallets.
- Record route-specific physical PASS or defects before enabling any financial capability.

## Open Errors / Blockers

- External DNS for `pods-activity.up.railway.app` remains unavailable from the Codex execution environment. Railway reports the domain `ACTIVE`, deployment `fbd1b400-e6af-4469-aa99-7aadc5423fdf` as `SUCCESS`, one running replica, and a successful internal `/health/ready` gate.
- The new project has no separate worker service or treasury configuration. Deposits, alpha refunds, review exceptions, and proportional settlement remain disabled. This is intentional and prevents the web service from accepting funds it cannot safely reconcile.
- Physical Nimiq Pay approval remains pending and is not replaced by browser verification.

## Git State

- Branch: `phase/04a-social-alpha-foundation` in linked worktree `/private/tmp/pods-phase-04a`.
- Application release commit: `b3d96cb feat: complete phase 4 adaptive social experience`.
- Deployment source commit: `84e19b5 docs: record phase 4 release boundary`.
- GitHub `main` and `phase/04a-social-alpha-foundation` were both verified at `84e19b59bd7c49f3bf29648a4d1ae892ecee206a`.

## Next 3 Tasks

1. Run the deployed release inside Nimiq Pay and record route-specific physical PASS or defects.
2. Decide whether this Railway plan can support the required separate worker before enabling capped `full_refund_alpha` funding.
3. Keep deposits and settlement disabled until the worker, treasury, and two-wallet refund path pass independently.
