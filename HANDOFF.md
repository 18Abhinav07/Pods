---
project: pods
last-updated: 2026-07-19 23:05
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[docs/implementation-plan]] | [[validation/phase-2-results]] | [[docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation|Phase 3 plan]]

## State

Phase 0, Phase 1, and Phase 2 are physically approved. Phase 3 funding and
reconciliation is active on `phase/03-funding`. The locked product design and
the 2026-07-19 Testnet deposit-attribution spike both pass. The Phase 3 plan is
split into physical Checkpoint 3A for deposit crediting and Checkpoint 3B for
cutoff, roster lock, and refunds.

## In Progress (resume here)

- Task: Execute Task 1 of the Phase 3 plan with TDD.
- Plan: `docs/superpowers/plans/2026-07-19-phase-3-funding-reconciliation.md`.
- Runtime URL: `http://192.168.29.244:3411`.
- Stop after Task 8 for the real Nimiq Pay Checkpoint 3A. Do not start cutoff or
  refund implementation before Abhinav approves the physical deposit-credit flow.
- The client transaction hash remains a hint. Only the worker can credit a deposit.

## Open Errors / Blockers

- No Phase 2 error is open.
- Phase 3A implementation is unblocked.
- Phase 3B remains intentionally blocked until physical Checkpoint 3A passes.
- The local treasury configuration exists under ignored `.runtime` storage and
  must never be printed with its private key or committed.

## Git State

- Branch: `phase/03-funding`.
- Phase 2 is committed and approved at `80344c9`.
- Phase 3 plan is ready for its plan commit.
- The validated inbound boundary is recorded in `validation/inbound-spike-manifest.md`.

## Next 3 Tasks

1. Commit the Phase 3 plan and begin Task 1 domain states with a failing test.
2. Build Tasks 2 through 7 in reviewable TDD commits.
3. Run Task 8 automated gates and request physical Checkpoint 3A approval.
