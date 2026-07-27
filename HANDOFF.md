---
project: pods
last-updated: 2026-07-27 18:44
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[sessions/2026-07-27-testnet-release-readiness]] |
[[validation/phase-5-results]]

## State

The final Pods Testnet product is consolidated on `main`, pushed to GitHub,
and deployed to the Railway web and worker services. It includes the complete
Build and Ship lifecycle, profiles and social flows, Pod rooms, public visitor
views, creator review, deterministic settlement, refunds, and real low-value
Testnet NIM payouts. Mainnet remains a separate, unauthorized product phase.

## Verified Release Contract

- The canonical source is clean `main`; no feature branch is a release source.
- The production browser suite runs against a built Next.js server rather than
  the development compiler.
- The release gate passes lint, copy safety, all TypeScript projects, 772 unit
  and component tests, 94 live integration tests, and both production builds.
- Forty mobile browser journeys pass across Mobile Safari and Android Chromium.
- The public design-preview route and its database-backed prototype code are
  absent from the shipped application.
- Dependency audit reports no known production vulnerabilities.
- Railway remains Nimiq Testnet only. Testnet payout broadcasting is explicitly
  authorized and enabled for the web and worker services.

## Physical Gate Status

- The complete two-wallet Testnet funding, activity, review, settlement, and
  payout journey passed on physical Nimiq Pay wallets.
- Both participants received their expected finalized Testnet payouts, and the
  user accepted the end-to-end behavior.
- Mainnet treasury configuration, Mainnet funds, and Mainnet transactions are
  not authorized by this release.

## Completed Local Two-Wallet Journey

- Pod: `Three-Day Ship Sprint`
- Pod ID: `f2673754-4069-4189-a7f9-c49d80a272d3`
- LAN URL:
  `http://192.168.29.244:3411/pods/f2673754-4069-4189-a7f9-c49d80a272d3`
- Creator and reviewer: seeded `pods_test_operator`; the creator neither funds
  nor receives settlement value.
- Contract: three Build and Ship occurrences, `0.1 NIM` per occurrence,
  `0.3 NIM` upfront per participant, two-participant capacity, proportional
  settlement, and a public read-only visitor room.
- Current state: `completed`; the settlement run is `settled`, both payout
  legs are chain-confirmed, and deposit/payout conservation is exactly
  `60,000 Luna`.
- Occurrence one result: `ryuk` is approved and `raptor` is rejected, with
  both review decisions and both Pod-room realtime events persisted.
- Occurrences two and three closed with both members missed. Because neither
  occurrence had an approved bonus recipient, each is recorded as
  `closed_no_bonus_recipient` and both unused slices were restored.
- Final conserved payout from the `0.6 NIM` pool: `raptor` received `0.2 NIM`
  and `ryuk` received `0.4 NIM`.
- Confirmed payout hashes: `raptor`
  `c5d1327b85ae308a9fc66620fdf5e51c1d0428b38ab51c8275521663ded8ffe6`;
  `ryuk`
  `e303506f01a617f5fc96c0de3edbf9425ce65bcfa19330dd45e1a369dc4e4c27`.
- Local web and worker processes are stopped after the completed physical gate.
- Settlement and Testnet payout broadcast remain enabled only for the isolated
  Testnet runtime.

## Local Runtime

- Use the clean root checkout on `main` as the only local Pods source.
- Local Postgres and object storage remain the integration-test dependencies.
- Run the web app on port `3411` for Nimiq Pay LAN testing and run the worker
  against the same local Testnet configuration.

## Next 3 Tasks

1. Preserve the Testnet deployment as the stable competition build.
2. Create the isolated Mainnet release line.
3. Start Mainnet product work without reusing Testnet
   treasury, database, storage, or environment configuration.
