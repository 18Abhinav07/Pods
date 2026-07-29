---
created: 2026-07-28
project: pods
ecosystem: nimiq
tags: [validation, postgres, proof-review, concurrency]
status: pass
---

# Proof Reconciliation Atomicity Spike

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-28-pods-proof-reconciliation-and-appeal-design]] |
[[validation/spike-results]]

## Assumption

A transaction can retain `submission.state = reviewing` through a provisional
rejection while serializing a competing deadline-worker command against the
same ProofCase. Only one legal transition may win, immutable events must not
duplicate, and settlement must remain blocked until a terminal outcome is
written.

## Method

`validation/spike-proof-reconciliation-atomicity.ts` created disposable
Postgres tables and ran a reviewer provisional-rejection transaction against a
competing initial-timeout transaction. Both commands acquired the same row
lock. The winning transaction appended an idempotent event before commit.

The spike then accepted the provisional rejection and verified that the case
and submission became terminal in one transaction.

## Result

PASS.

- Concurrent legal-transition winners: 1.
- Competing stale timeout winners: 0.
- State after provisional rejection: `reviewing`.
- State after rejection acceptance: `rejected`.
- Immutable events: 2.
- Settlement blocker present before terminal transition: yes.
- Settlement blocker present after terminal transition: no.

## Decision

The transactional ProofCase architecture is validated for implementation.
Production code must preserve the row-lock, stage guard, event append, and
submission projection inside one transaction.

