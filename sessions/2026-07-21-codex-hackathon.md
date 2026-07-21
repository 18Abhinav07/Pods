---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon, phase-4]
---

# Phase 4 Activity Implementation Session

Related: [[HANDOFF]] | [[sessions/INDEX]] | [[validation/phase-4-spike-results]]

## Completed

- Added Build & Ship occurrence, frozen commitment, draft, submission, review-decision, and activity state contracts.
- Added the database migration, repository methods, lifecycle worker transitions, participant routes, centralized reviewer workspace, and approved-only Pod feed.
- Implemented private MinIO evidence storage with server-side image decoding, metadata removal, resizing, WebP conversion, authenticated reads, and object cleanup on failed attachment.
- Connected active activity state to Today, My Pods, Inbox, Pod rooms, submission detail, and feed without duplicating primary actions across destinations.
- Fixed reviewer cookie scope, upload completion truthfulness, and deterministic timezone rendering for mobile Safari hydration.

## Decisions

- Phase 4 supports the locked Build & Ship template only. The remaining four templates use later dedicated activity experiences.
- Review is centralized through the Pods team and Phase 4 exposes manual approval only.
- Evidence images remain private. The Pod feed contains approved artifact summaries and links, never raw private evidence.
- The 100 percent upload state means sanitization, MinIO persistence, and database attachment have all succeeded.

## Validation

- Private MinIO spike passed create, exact-byte write/read, and delete against the local service.
- Lint and the no-U+2014 copy check pass.
- All workspace type checks and the production web and worker builds pass.
- 183 unit/component tests and 32 database integration tests pass.
- All 24 Mobile Safari and Android Chromium journeys pass across Phases 0 through 4.
- Both loopback and Wi-Fi health probes reach the LAN runtime; the physical Nimiq Pay gate remains pending.

## Errors and resolutions

- Reviewer API requests returned 401 because the reviewer cookie path excluded `/api/ops`; the signed cookie now covers the full application path.
- XHR could report 100 percent while server processing continued; transport progress now stops at 99 until the server confirms persistence.
- Client locale formatting caused Safari hydration warnings; client timestamps now use an explicit deterministic timezone formatter.

## Remaining

- Run the Phase 4 journey with two real Nimiq Pay wallets and record the physical-device result.
- Later phases add clarification, rejection, dispute, timeout protection, missed occurrences, and settlement.

## Git history

- Preserved the existing 45 truthful phase-based commits from July 19 and July 20 instead of rewriting published project history.
- Added July 21 commit `3bc8955` for activity persistence, lifecycle worker logic, and private evidence storage.
- Added July 21 commit `79794f5` for participant, reviewer, route-state, responsive, and browser-test flows.
- Validation and handoff records were grouped into July 21 documentation commits, then the complete history was published to `origin/main` after Abhinav's explicit authorization.

## Phone fixture

- Created exactly one public Pod through the production repository publication path: `Phase 4 Build Lab` (`fad860b4-cb09-4b61-b62a-3baaa6b568e1`).
- The dedicated fixture owner is not a participant, leaving both seats available for Abhinav's real wallets.
- Contract: Build & Ship, public application, minimum and maximum two participants, one occurrence, and `0.1 NIM` per wallet.
- First occurrence opens at `2026-07-21T18:30:00Z`; its immutable-task cutoff is `2026-07-22T03:30:00Z`.
- Both real wallets applied, were accepted, and finalized distinct `0.1 NIM` deposits before cutoff.
- Audited Clock event `07e87121-6e02-47bf-94ac-cd7ba3a7cd6d` moved effective time to `2026-07-21T18:35:00Z`; the Pod, two memberships, and first occurrence then activated correctly.
- Wallet tail `GMF3 KKYQ` submitted the frozen `Ship phase 4` task with public commit `79794f5`, a result summary, and private image evidence.
- The authenticated reviewer API returned the private sanitized image, and one manual approval produced one review decision and one approved feed item. Participant phone confirmation remains pending.
