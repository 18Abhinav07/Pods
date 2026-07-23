---
project: pods
last-updated: 2026-07-23 18:34
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 is deployed with Testnet funding enabled. Web, worker, Postgres, and
evidence storage are healthy. The creator remains an unfunded, non-payout admin.
The creator-scoped proof review design is written and awaiting explicit review
before implementation planning.

## In Progress (resume here)

- Task: complete the physical two-wallet `Pods in Pods` showcase.
- Start at the live domain:
  `https://pods-nimiq-activity.up.railway.app`.
- Resume by reviewing
  `docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design.md`.
- After approval, write the implementation plan before changing application
  code.

## Open Errors / Blockers

- Normal proof approval is currently centralized under `/ops/reviews`, while
  the intended MVP authority is the Pod creator.
- Physical Nimiq Pay signing and transaction confirmation remain unverified
  for this release.
- Alpha mode is full-refund only. Reward settlement is not implemented.

## Git State

- Remote `main` and `phase/04a-social-alpha-foundation` remain at `d23efc0`.
- The local branch adds the creator-review design and this handoff update.
- Web deployment `b0d2e841-d0a5-43db-9f2a-ca63224c918d`: `SUCCESS`.
- Worker deployment `94c1c99c-cd6b-4956-b366-c2baa0e1c227`: `SUCCESS`.
- Live capabilities: Testnet and `depositMode=allowlist_refund_only`.
- The design has not been pushed, so Railway has not redeployed from this
  documentation-only change.

## Next 3 Tasks

1. Review and approve the written creator-review design.
2. Write and approve the implementation plan.
3. Implement creator review, then run the two-wallet occurrence walkthrough.
