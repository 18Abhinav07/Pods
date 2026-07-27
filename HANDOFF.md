---
project: pods
last-updated: 2026-07-27 17:10
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
- The release gate passes lint, copy safety, all TypeScript projects, 771 unit
  and component tests, 94 live integration tests, and both production builds.
- Forty mobile browser journeys pass across Mobile Safari and Android Chromium.
- The public design-preview route and its database-backed prototype code are
  absent from the shipped application.
- Dependency audit reports no known production vulnerabilities.
- Railway remains Nimiq Testnet only. Testnet payout broadcasting is explicitly
  authorized and enabled for the web and worker services.

## Remaining Human Gate

- Run one final Nimiq Pay phone smoke journey against the deployed release:
  connect, open an existing Pod or create a low-value Testnet Pod, and confirm
  the final mobile shell and wallet handoff.
- This is a physical-device confirmation, not a missing automated product path.
- Mainnet treasury configuration, Mainnet funds, and Mainnet transactions are
  not authorized by this release.

## Local Runtime

- Use the clean root checkout on `main` as the only local Pods source.
- Local Postgres and object storage remain the integration-test dependencies.
- Run the web app on port `3411` for Nimiq Pay LAN testing and run the worker
  against the same local Testnet configuration.

## Next 3 Tasks

1. Complete the final deployed Nimiq Pay phone smoke journey.
2. Preserve the Testnet deployment as the stable competition build.
3. Start Mainnet product work from a new branch without reusing Testnet
   treasury, database, storage, or environment configuration.
