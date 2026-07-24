---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [validation, phase-4, activity, evidence, review, mobile]
status: pass
---

# Phase 4 Build & Ship Activity Gate

Related: [[HANDOFF]] | [[validation/phase-4-spike-results]] | [[sessions/2026-07-21-codex-hackathon]]

## Current verdict

`PASS`

The Phase 4 implementation is code, database, storage, worker, browser, and
physical Nimiq Pay verified for a small Testnet community alpha.

## Implemented boundary

- Build & Ship template only.
- Automatic Pod and roster activation when the first occurrence opens.
- One immutable task and allowed deliverable type locked before the occurrence cutoff.
- Refresh-safe result summary and HTTPS artifact-link draft.
- Optional private image evidence, sanitized to metadata-free WebP before private storage.
- Evidence submission before the occurrence deadline.
- Signed centralized Pods reviewer session, queue, private evidence view, and manual approval.
- Participant projections across Today, My Pods, Inbox, Pod room, submission detail, and approved-only Pod feed.
- Explicit access isolation for participant evidence and reviewer routes.

The later creator-review amendment adds rejection and timeout protection.
Clarification, dispute, and proportional settlement remain outside this
`full_refund_alpha` contract.

## Automated evidence

- Private MinIO spike: PASS for private bucket creation, exact-byte write/read, and delete.
- Copy gate: PASS with no U+2014 characters.
- Lint: PASS.
- Workspace TypeScript checks: PASS.
- Production web and worker builds: PASS.
- Unit and component tests: 183 PASS.
- Live Postgres integration tests: 32 PASS.
- Complete mobile browser regression: 24 PASS across Mobile Safari and Android Chromium.
- Dedicated Safari activity path: PASS from frozen task through draft, upload, review, approval, and feed.
- LAN health: both loopback and `http://192.168.29.244:3411/` respond through the running application.

Automated browser tests use isolated disposable users and remove their records.
They do not prove the injected provider behavior of a physical Nimiq Pay WebView.

## Physical gate procedure

1. Create a public Build & Ship Pod and fund the frozen commitment from two physical Testnet wallets.
2. Confirm both participants show credited funding and tell Codex to advance the audited local Clock through the actual cutoff and first occurrence open.
3. Reopen Today as one participant. Confirm the active Pod is the primary action and open its current occurrence.
4. Lock one concrete task and deliverable type. Close and reopen the WebView to confirm the commitment remains immutable.
5. Save a result summary and valid GitHub or HTTPS artifact link. Optionally upload a phone image and confirm `Image secured` appears only after server persistence finishes.
6. Submit for review. Confirm Today, Inbox, My Pods, Pod room, and submission detail use the same reviewing state without redundant primary actions.
7. Open `/ops/reviews` with the locally configured reviewer access, inspect the private evidence, enter a review note, and approve once.
8. Reopen the participant path. Confirm the occurrence is manually approved, the streak updates, the approved artifact appears in the Pod feed, and the private evidence image does not.
9. Record Abhinav's verdict below. Any route, responsive, state, or copy correction keeps this gate pending until retested.

## Physical evidence

- Test Pod prepared: `Phase 4 Build Lab` (`fad860b4-cb09-4b61-b62a-3baaa6b568e1`).
- Exactly one published public Pod existed after creation.
- Both physical applications were accepted and funded with exactly `0.1 NIM` each.
- Deposit hashes: `942fe830bb9780629716bb7324132e8955c5873ac0b89f2dc114787f770f0bfb` and `e3d4bb657b6ae1cc49e41b1f3c093528fac2bced2e9f0e89978a160d76a02049`.
- Both deposits finalized before cutoff and produced exactly two `10,000 Luna` deposit-credit ledger movements.
- Audited Clock event: `07e87121-6e02-47bf-94ac-cd7ba3a7cd6d`, effective at `2026-07-21T18:35:00.000Z`.
- Post-cutoff state: Pod `active`, two active memberships, both deposits `applied_to_roster`, and occurrence one `commitment_open`.
- Wallet tail `GMF3 KKYQ` locked `Ship phase 4` with a commit deliverable and submitted `d20a9683-0a1c-405b-a512-c0268df08e34`.
- Public artifact `79794f5b887aa1c2cd8e637200129f02b9cc3f8e` exists on GitHub `main` and contains the Phase 4 participant and reviewer implementation.
- The private evidence endpoint returned a sanitized `image/webp` object of `171,028` bytes to an authenticated reviewer only.
- The reviewer approved once with reason `meets_frozen_commitment`; exactly one review decision and one approved feed item exist.
- On 2026-07-24, Abhinav confirmed the deployed creator review and participant
  projections work correctly in Nimiq Pay.

## Final verdict

`PASS`
