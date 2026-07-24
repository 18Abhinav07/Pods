---
project: pods
last-updated: 2026-07-24
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[docs/superpowers/plans/2026-07-24-pods-settlement-payout]] |
[[validation/phase-5-results]]

## State

The first sequential upgrade, Testnet rewards, is deployed as a staged release
candidate. Proportional publication and settlement processing are enabled.
Payout signing and broadcast remain fail-closed until the physical two-wallet
settlement snapshot is inspected.

## In Progress (resume here)

- Task: complete the physical proportional settlement and payout gate.
- Production: `https://pods-nimiq-activity.up.railway.app`.
- Payout broadcast: explicitly disabled on web and worker.
- Required device actors: one creator and two participant wallets.

## Open Errors / Blockers

- Physical Nimiq Pay payout confirmation is still pending.
- Do not advertise redistributed Testnet rewards until that gate passes.
- No Mainnet configuration or transaction is authorized.

## Git State

- Main remains at `6e6bb80da410abcacc12a81d936c0b3cce42a1de`.
- Upgrade branch: `upgrade/testnet-rewards`.
- Deployed code commit: `1c4ae201e607e1b3e631074f274144d921be279f`.
- The release candidate branch is pushed and matched its remote before
  deployment.
- Full `pnpm check`: PASS with 623 non-integration tests and 91 integration
  tests.
- Independent hardening re-review: PASS.
- The legacy root worktree on `phase/04-activity` is intentionally preserved
  because it contains unrelated user changes.

## Runtime State

- Web deployment `bce1a1fe-454e-4265-a153-be8b51600c24`: `SUCCESS`.
- Worker deployment `d17e7e7b-34d7-41e8-8085-82d7c78e7c62`: `SUCCESS`.
- Both services are running and not stopped.
- Live readiness reports configuration, database, evidence storage, and exact
  schema identity as `ready`.
- Live runtime reports Testnet commit `1c4ae201e607` and schema
  `0017_robust_loners`.
- Production data remained unchanged across deployment: one active
  `full_refund_alpha` Pod, two confirmed refund legs, zero settlement runs,
  and zero payout legs.
- Controls on web and worker: public Testnet intake on, proportional
  publication on, settlement processing on, payout broadcast off, incident
  pause off, and legacy refunds on.

## Next 3 Tasks

1. Create a small proportional Testnet Pod with one creator and two funded
   participants, then reach terminal occurrence outcomes.
2. Inspect the immutable settlement and conservation result while payout
   broadcast is still off.
3. Enable payout broadcast only after that inspection, confirm both terminal
   transfer outcomes in Nimiq Pay, then merge the approved upgrade into main.
