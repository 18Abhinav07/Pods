---
project: pods
last-updated: 2026-07-28 21:10
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] |
[[docs/superpowers/specs/2026-07-28-pods-proof-reconciliation-and-appeal-design]] |
[[validation/proof-reconciliation-spike-results]]

## State

The Testnet proof reconciliation and appeal lifecycle is implemented on the
isolated local branch `feat/rel-testnet-proof-recon-and-appeal-lifecycle` in
the `BUILD-proof-recon` worktree. The stable Testnet release, Railway
deployment, Mainnet branch, and Mainnet worktree were not changed.

The feature branch is ready for a physical two-wallet Nimiq Pay gate. It is
not pushed, merged, migrated in Railway, or deployed.

## Implemented Contract

- Existing V1 and V2 Pods retain their frozen direct-decision behavior.
- New V3 Pods freeze `proof_reconciliation_v1` into the published contract.
- The Pod creator remains the Testnet reviewer. Review does not create a
  friendship or direct-message relationship.
- A submission remains `reviewing` through one clarification, one provisional
  rejection, and one appeal. Settlement stays blocked until a terminal result.
- Structured rejection captures a category, detailed reason, one to five unmet
  criteria, and an optional suggested correction.
- The participant may accept rejection, appeal once with optional private
  evidence, or explicitly share sanitized rejection context with locked Pod
  members for advisory room discussion.
- Initial and post-clarification reviewer inactivity protects the occurrence.
  Appeal-review inactivity returns principal with grace. An unused appeal
  window resolves to rejection.
- Proof cases have stage deadlines and a 72-hour absolute cap driven only by
  the audited Clock.
- Proof versions and review events are immutable and sequenced. Mutations use
  idempotency keys, including safe replay after a terminal transition.
- A ten-minute upload reservation can begin before occurrence close. It is
  bound to the exact selected image hash, survives local HTTP without relying
  on SubtleCrypto, is consumed once, and writes the hash into the immutable
  proof version.
- A rejected Build or Practice submission can start a linked recovery
  commitment only when a real later occurrence is still eligible. The original
  outcome never changes, and no dead recovery link is shown.
- `approved`, `rejected`, `timeout_protected`, and `grace` continue to use the
  existing proportional settlement engine. Grace returns principal, earns no
  bonus, and is neutral for streak and completion-rate calculations.

## User Surfaces

- Participant submission detail contains the private review thread, immutable
  proof versions, clarification response, provisional rejection, one appeal,
  acceptance, Pod-context sharing, and recovery action.
- Creator review detail contains the full review thread before and after a
  terminal decision, plus approve, clarify, provisional-reject, and appeal
  resolution controls.
- Today and creator review queues appear only when the current stage belongs to
  the creator. Participant-owned stages do not show a false creator action.
- Updates contains durable role-correct review events without duplicate generic
  terminal entries.
- Pod rooms show only explicitly shared sanitized rejection context. Replies
  and reactions remain advisory and cannot mutate review or financial state.
- Public visitors receive no clarification, rejection, appeal, private media,
  wallet, or financial detail.

## Persistence and Worker

- Migration: `0018_proof_reconciliation_lifecycle`.
- Schema identity: `c149f0c7e6a433e135c6c77d36ed59cd6ab43cb735d4465f05f5872f403b5c1f`.
- New durable records cover proof cases, review events, proof versions, upload
  reservations, and recovery links.
- The worker advances proof deadlines from effective Clock time. The legacy
  review-timeout cycle excludes submissions owned by V3 proof cases.
- Reviewer and deadline transitions lock the proof case and submission in one
  transaction, append the event, project the terminal state, and enqueue
  authorized delivery records together.

## Verification

`pnpm check` passes on the final working tree:

- ESLint and no-U+2014 copy gate: PASS.
- All TypeScript projects: PASS.
- Unit and component tests: 814 PASS.
- Live Postgres integration tests: 103 PASS across 16 files.
- Web and worker production builds: PASS.
- Focused proof persistence suite: 9 PASS, including concurrent transition,
  timeout, queue ownership, advisory sharing, recovery, reservation, and media
  hash assertions.

## Physical Gate Still Required

Use two real Testnet wallets inside Nimiq Pay and a new V3 Pod. Verify:

1. Submit a proof close to occurrence cutoff and confirm the reviewer receives
   a full independent review window.
2. Request clarification, answer it with a replacement artifact or image, and
   confirm both immutable versions remain visible only to participant and
   creator.
3. Send a structured provisional rejection, share its sanitized context to the
   Pod room, and confirm another member can reply without changing the case.
4. Exercise acceptance and appeal on separate proofs. Resolve an appeal as
   approved, rejected, or grace and verify every projection agrees.
5. Close the Pod and confirm settlement remains blocked while a case is open,
   then conserves exactly after the terminal outcome.
6. Begin an image upload just before cutoff and complete it within ten minutes.
   Confirm a different image cannot consume that reservation.

## Next 3 Tasks

1. Run and record the physical two-wallet V3 gate on LAN.
2. Fix only device-proven defects on this isolated branch and rerun `pnpm check`.
3. After explicit approval, choose whether to push, merge into stable `main`,
   migrate Testnet Railway, and deploy web plus worker.
