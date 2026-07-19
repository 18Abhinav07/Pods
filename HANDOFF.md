---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [handoff, phase-0, phase-1, build]
last-updated: 2026-07-19
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[docs/implementation-plan]] | [[validation/phase-1-results]]

## Current state

Branch `phase/01-contract-auth-creation` contains the approved Phase 0 premium
motion pass and a complete Phase 1 creator slice. Phase 1 provides real Nimiq
wallet challenge signing, HTTP-only sessions, five fixed activity contracts,
server-persisted drafts, public or private community rules, exact NIM commitment
math, timezone-safe occurrence materialization, atomic publication, and an
immutable Rules screen with a SHA-256 contract fingerprint.

The app is ready for Abhinav's phone checkpoint. Automated validation is green;
physical Nimiq Pay signing and the touch-by-touch creator review remain manual.

Current manual gate:

- LAN shell: `http://192.168.29.244:3411` after `pnpm dev:lan`
- Testnet treasury: `NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6`
- Abhinav reported funding the treasury with 5 NIM
- Planned return transfer: `1000` Luna = `0.01` NIM

Latest evidence:

- `pnpm check`: PASS
- Unit tests: 42 PASS across root, domain, UI, worker, and web
- Live Postgres and MinIO integration tests: 5 PASS
- Mobile Safari and Android Chromium regression: 8 PASS
- Signed Nimiq auth plus creator publication journey: 4 PASS
- Production Next build: PASS, 22 routes emitted
- U+2014 copy enforcement: PASS
- Settled Phase 1 visual captures: PASS by Codex review

## Next 3 tasks

1. Abhinav opens the LAN app in Nimiq Pay and completes wallet sign-in.
2. Abhinav creates and publishes a Build and Ship Pod, then reviews its frozen
   Rules screen and motion on the phone.
3. After explicit approval, begin Phase 2 only. The 0.01 NIM return transfer
   still requires Abhinav's exact recipient NQ address.

## Blockers

- Physical-device Phase 1 approval requires Abhinav.
- The treasury return transfer requires the exact recipient NQ address.
