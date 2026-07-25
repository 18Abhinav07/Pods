---
project: pods
last-updated: 2026-07-25
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[docs/superpowers/plans/2026-07-25-build-ship-testnet-core]] |
[[validation/phase-5-results]]

## State

The Build and Ship Testnet core is automated-green on the isolated
`upgrade/build-ship-testnet-core` branch. Funding, roster lock, commitments,
proof, creator review, deterministic proportional settlement, participant
payout tracking, creator summaries, room archives, Today, My Pods, and Updates
now share one canonical lifecycle projection.

Payout broadcast remains disabled. The branch is not merged into `main` and is
not deployed. The next action is the physical Nimiq Pay settlement snapshot.

## In Progress

- Local LAN app: port `3411`.
- Runtime: Testnet, public local access, proportional settlement enabled.
- Payout broadcast: explicitly disabled.
- Required actors: one creator and two funded participant wallets.
- Stop point: after settlement calculation and before any payout broadcast.

## Automated Evidence

- Implementation commit:
  `51a4b91a0c489b578dcab1f2de21e771faae0ae8`.
- Full `pnpm check`: PASS.
- Unit and component tests: 699 PASS.
- PostgreSQL integration tests: 94 PASS across 15 files.
- Funding and cancellation browser matrix: 4 of 4 PASS.
- Settlement and restoration browser matrix: 4 of 4 PASS.
- Mobile engines: Mobile Safari and Android Chromium.
- Independent review: no remaining Critical or Important implementation
  finding.

## Open Gate

1. Create a one-occurrence public Build and Ship Pod.
2. Fund it from two Testnet participant wallets.
3. Lock both commitments and submit proof.
4. Approve one participant and reject or miss the other.
5. Advance time only through the audited Clock command.
6. Finalize with payout broadcast still off.
7. Inspect conservation, each entitlement, creator zero-receipt, and every
   projected state.
8. Enable payout broadcast only after Abhinav explicitly approves that
   snapshot.

The zero-recipient restoration and underfilled-cancellation paths are also
required before release.

## Git and Deployment Boundary

- `main` and `origin/main` base:
  `d3ba7d7d749886c2024ae4c531d827da761e4f10`.
- Upgrade branch: `upgrade/build-ship-testnet-core`.
- Main/root worktree remains untouched.
- No current-candidate Railway deployment has been performed.
- No Mainnet configuration or transaction is authorized.

## Next 3 Tasks

1. Publish the isolated upgrade branch without merging it.
2. Run the physical two-wallet entitlement snapshot on LAN port `3411`.
3. After explicit approval, broadcast the Testnet payouts, verify finality,
   merge the exact approved branch into `main`, and deploy that SHA.
