---
project: pods
last-updated: 2026-07-25 21:20
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[sessions/2026-07-25-codex-hackathon]] |
[[validation/phase-5-results]]

## State

The physically verified Build and Ship Testnet core is merged into `main`,
pushed to GitHub, and deployed to both Railway services. Automated Testnet
payout broadcasting remains disabled because persistent production financial
authorization has not yet been given.

## In Progress (resume here)

- GitHub `main` contains the approved release and
  `upgrade/build-ship-testnet-core` remains as its merged source branch.
- The newest Railway web and worker deployments are `SUCCESS`.
- Live web readiness: configuration, database, evidence storage, and schema
  `ready`; runtime release matches remote `main`, schema
  `0017_robust_loners`.
- Railway uses Nimiq Testnet, public proportional settlement, and an available
  worker-only treasury signer.
- Production safety audit before payout enablement: two historical refunds
  confirmed, zero open payouts, zero open refunds, zero payout exceptions, one
  active Pod, and zero settlement runs.
- `PODS_PAYOUT_BROADCAST_ENABLED=false` on web and worker.
- `PODS_FINANCIAL_INCIDENT_PAUSED=false` on web and worker.

## Open Errors / Blockers

- Persistent automatic Testnet payout broadcasting requires Abhinav to
  explicitly authorize setting `PODS_PAYOUT_BROADCAST_ENABLED=true` on the
  Railway Pods web and worker services.
- A remote Nimiq Pay wallet smoke journey against Railway remains.
- Mainnet configuration and transactions remain unauthorized.

## Git State

- Current worktree: clean `main`, verified equal to `origin/main` at release
  close.
- The older root worktree remains on `phase/04-activity` and was not modified.
- The Phase 5 integration teardown now removes generated ledger rows and Pods
  before generated users. The complete merged release gate passed with 699
  unit/component tests and 94 integration tests.

## Next 3 Tasks

1. Obtain explicit production authorization, enable Testnet payout broadcast,
   and verify both replacement deployments plus the unchanged empty queue.
2. Complete one remote Nimiq Pay smoke journey against Railway.
3. Create the next UI and UX upgrade branch from the final remote `main`.
