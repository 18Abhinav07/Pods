---
project: pods
last-updated: 2026-07-25 20:52
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[sessions/2026-07-25-codex-hackathon]] |
[[docs/superpowers/plans/2026-07-25-build-ship-testnet-core]]

## State

The complete physical Nimiq Testnet gate is PASS on
`upgrade/build-ship-testnet-core`: funding, roster lock, three activity
occurrences, missed proof, zero-recipient restoration, proportional settlement,
real payouts, macro-block finality, and retry idempotency all matched the
approved contract.

## In Progress (resume here)

- Task: run the release gate on the exact approved branch, then merge and deploy
  only if it remains green.
- Branch: `upgrade/build-ship-testnet-core`.
- Implementation commit: `c19c7de6e00bdea8510d3edb6328614b8de26d69`.
- Local web: port `3411`, ready.
- Local worker: port `3412`, ready, payout broadcasting disabled.
- Terminal physical Pod: `5638572a-7e78-4258-bf03-e6527846e187`.
- User 1 payout: 40,000 Luna, transaction
  `55b86a13fdbe8c71cb7bb8749f0b0b679c8836d753c868e68f1514268a84e8c1`,
  finalized at block `6959461`.
- User 2 payout: 20,000 Luna, transaction
  `e2bae3f34f81763e9423cb4ce3b07f8a68171e8018d11835f57212bf120cecdf`,
  finalized at block `6959462`.
- Terminal state: Pod `completed`, settlement `settled`, two confirmed payout
  legs totaling 60,000 Luna, zero open payouts/refunds, zero creator transfers,
  and exactly two total broadcast attempts.

## Open Errors / Blockers

- Release gate, merge, push, and Railway deployment have not run yet.
- One integration-suite teardown deletes memberships before their referenced
  ledger rows; all 14 assertions pass before that cleanup-only FK failure.
- Mainnet configuration and transactions remain unauthorized.

## Git State

- `HANDOFF.md` is modified and uncommitted.
- Base `main` and `origin/main`: `d3ba7d7d749886c2024ae4c531d827da761e4f10`.
- The root/main worktree is untouched.

## Next 3 Tasks

1. Run the full release gate on `upgrade/build-ship-testnet-core`.
2. Merge the approved branch into `main` and push the exact resulting SHA.
3. Deploy matching web and worker revisions to Railway, then verify readiness,
   runtime SHA, and one remote Nimiq Pay smoke journey.
