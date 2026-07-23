---
project: pods
last-updated: 2026-07-23 18:05
last-agent: codex
mode: HACKATHON
---

## State

Phase 4 is deployed with Testnet funding enabled. Web, worker, Postgres, and
evidence storage are healthy; the web and worker run commit `e93c55f`.

## In Progress (resume here)

- Task: complete the physical two-wallet `Pods in Pods` showcase.
- Start at the live domain:
  `https://pods-nimiq-activity.up.railway.app`.
- Creator publishes a public, visitor-enabled Pod; wallet two applies; creator
  accepts; both fund; worker credits and roster-locks; members submit the first
  commitment and proof.

## Open Errors / Blockers

- No automated or deployed-runtime blocker.
- Physical Nimiq Pay signing and transaction confirmation remain unverified
  for this release.
- Alpha mode is full-refund only. Reward settlement is not implemented.

## Git State

- `origin/main` and `origin/phase/04a-social-alpha-foundation` are at
  `e93c55f`.
- Web deployment `b0d2e841-d0a5-43db-9f2a-ca63224c918d`: `SUCCESS`.
- Worker deployment `de570b13-dd66-4e8c-939b-f7fc177f333c`: `SUCCESS`.
- Live capabilities: Testnet and `depositMode=allowlist_refund_only`.

## Next 3 Tasks

1. Run the two-wallet funding and roster-lock walkthrough.
2. Run the first active occurrence and publish a shared proof.
3. Capture the first build-in-public screenshot or short video.
