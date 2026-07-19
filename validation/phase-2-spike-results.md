---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, phase-2, postgres, invitations, concurrency]
status: pass
---

# Phase 2 Enrollment Spike Results

Related: [[HANDOFF]] | [[docs/implementation-plan|Implementation plan]] | [[validation/phase-1-results|Phase 1 results]]

## Assumption

One private invitation token can be accepted by at most one wallet even when two
acceptance requests reach Postgres concurrently. Every later replay must return no
winner.

## Risk if false

A shared or replayed invitation could create multiple accepted memberships from a
single-use private entry token, breaking private Pod capacity and access boundaries.

## Spike

- File: `validation/spike-invite-single-use.ts`
- Mechanism: one conditional `UPDATE ... WHERE used_at IS NULL ... RETURNING` executed
  concurrently from two pool connections.
- Repetitions: three complete runs.
- Observed result on every run: `concurrentWinners: 1`, `replayWinners: 0`.
- Cleanup: the isolated unlogged spike table is dropped in `finally` after every run.

The first launcher attempt did not reach Postgres because `pg` is scoped to the
database workspace. Resolving the package from `packages/db/package.json` corrected
the validation harness without changing the experiment.

## Gate decision

PASS. The actual local Postgres environment supports the atomic single-use claim
required by the private invitation architecture. Phase 2 planning and implementation
may proceed.
