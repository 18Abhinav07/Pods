---
project: pods
last-updated: 2026-07-27 20:55 IST
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[docs/superpowers/specs/2026-07-27-pods-release-branch-and-environment-isolation-design]] |
[[docs/superpowers/plans/2026-07-27-pods-release-branch-and-environment-isolation]]

## Current State

Pods Testnet v0 is frozen, tagged, pushed, and deployed from its dedicated
release branch. The sole local checkout is now on `release/mainnet-v0`, ready
for isolated Mainnet product work. A fresh gate on the current checkout passed
after the release split, and temporary local test services are stopped.

## Stable Testnet Release

- Stable source: `main`
- Deployed branch: `release/testnet-v0`
- Immutable tag: `testnet-v0.0.0`
- Exact release commit:
  `9a1de59d5a7dcefcbe1e75b9048f5afa03e354be`
- `main`, `release/testnet-v0`, and `testnet-v0.0.0` resolve to that exact
  commit.
- GitHub default branch remains `main`.
- Historical `archive/*` tags remain available; they are not active branches.

## Verification Evidence

- `pnpm check`: PASS.
- Unit and component tests: 772 PASS.
- Live PostgreSQL and object-storage integration tests: 94 PASS.
- Production builds: web PASS, worker PASS.
- Mobile browser matrix: 40 PASS across Mobile Safari and Android Chromium.
- Copy safety: no U+2014 characters.
- Physical Nimiq Pay Testnet journey: PASS with two wallets, three
  occurrences, creator review, exact conserved settlement, and finalized
  payouts.
- Final physical payout from the `0.6 NIM` pool: `raptor` received `0.2 NIM`
  and `ryuk` received `0.4 NIM`.

## Railway Testnet Release

- Public URL: `https://pods-nimiq-activity.up.railway.app`
- Web service source: `18Abhinav07/Pods`, branch `release/testnet-v0`
- Worker service source: `18Abhinav07/Pods`, branch `release/testnet-v0`
- Web deployment: `7ed578c2-c887-4991-a3ce-0b13ae651f3c`, `SUCCESS`
- Worker deployment: `effdaf31-81cc-4957-9ba7-63ef7ae4eeab`, `SUCCESS`
- Public readiness: `ready`
- Deployment flavor: `testnet`
- Funds network: `nimiq-testnet`
- Runtime commit: `9a1de59d5a7d`
- Schema: `0017_robust_loners`
- Automatic low-value Testnet payout broadcasting remains explicitly
  authorized and enabled for the isolated Testnet services.

## Git and Local Cleanup

- Active local branches: `main`, `release/testnet-v0`,
  `release/mainnet-v0`.
- Active remote branches: `origin/main`, `origin/release/testnet-v0`,
  `origin/release/mainnet-v0`.
- Registered worktrees: one canonical `BUILD` checkout.
- Git stash: empty.
- Local Pods listeners on ports `3410`, `3411`, and `3412`: stopped.
- Temporary Postgres and MinIO test containers: stopped and removed without
  deleting their persistent volumes.

## Mainnet Isolation Contract

- Active checkout: `release/mainnet-v0`.
- Mainnet feature branches use `feat/rel-mainnet/<slug>` and merge into
  `release/mainnet-v0`.
- The Mainnet release line began from the exact Testnet v0 commit. This handoff
  commit is its only intentional initial divergence.
- Mainnet is not deployed yet.
- Mainnet must receive a separate Railway project, web service, worker,
  Postgres database, object storage, treasury, RPC configuration, secrets, and
  domains.
- Testnet data, funds, treasury credentials, and environment variables must
  never be reused or copied into Mainnet.
- No Mainnet funding or transaction action is authorized by this handoff.

## Next 3 Tasks

1. Finalize the Mainnet Build and Ship product specification and custody model.
2. Create the first `feat/rel-mainnet/<slug>` branch from
   `release/mainnet-v0` only after that specification is approved.
3. Provision isolated Mainnet Railway infrastructure only after its treasury,
   network, and payout safety gates are validated and explicitly authorized.
