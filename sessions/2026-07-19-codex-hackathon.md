---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon]
---

# 2026-07-19 Codex Build Session

Related: [[HANDOFF]] | [[sessions/INDEX]]

## Completed

- Implemented the approved Phase 0 premium motion system with reduced-motion support.
- Implemented Phase 1 domain contracts, Temporal occurrence freezing, Postgres persistence,
  signed wallet sessions, creator routes, saved drafts, and immutable publication.
- Added the five fixed activity templates and NIM-only upfront commitment calculation.
- Added frozen Rules and My Pods management surfaces.
- Added owner-only confirmed draft deletion with immediate list removal.
- Replaced ordinal Pod markers with semantic activity symbols.
- Separated the Enrollment open lifecycle status from the Rules frozen property.
- Scoped hydration tolerance to Nimiq Pay's host-injected root safe-area styles.
- Passed `pnpm check`, eight mobile browser regressions, and settled-state visual QA.
- Committed the checkpoint as `3c7a062`.

## Decisions

- Nimiq Core stays external to the Next server bundle so its Node WASM asset resolves
  from the real package path.
- Migration filesystem logic stays outside the web runtime repository.
- Phase 2 remains blocked until the phone checkpoint is explicitly approved.

## Errors resolved

- Next could not bundle the migration folder while it lived in the runtime repository.
  Moving the migration runner into a separate non-exported module fixed the boundary.
- Turbopack rewrote the Nimiq Core WASM path to `/ROOT`; `serverExternalPackages`
  restored Node's native package loading.
- Invisible custom inputs had unstable automation hit targets; full-tile semantic input
  overlays made the controls reliably tappable.
- Next blocked development client resources requested from the phone's LAN origin,
  leaving server-rendered controls unhydrated. Permitting the configured Wi-Fi host
  restored the Connect interaction and is covered through the exact LAN URL.
- Raw Ed25519 verification did not match Nimiq Keyguard's signed-message convention.
  Reconstructing the prefixed, length-bound SHA-256 digest made physical Nimiq Pay
  authentication pass without weakening address ownership checks.
- Development hot reload retained the pre-change repository singleton. A clean LAN
  restart loaded the owner-only delete contract; both mobile browser journeys then passed.

## Open

- Physical creator-flow and motion approval. Nimiq Pay signing now passes.
- Exact recipient address for the 0.01 NIM treasury return.
