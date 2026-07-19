---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, phase-1, auth, creator, immutable-contract]
---

# Phase 1 Validation Results

Related: [[HANDOFF]] | [[docs/implementation-plan|Pods implementation plan]] | [[validation/temporal-spike-results|Temporal spike]]

## Scope

This checkpoint covers the signed wallet session and immutable Pod creation
slice. It does not claim participant enrollment, funding, evidence submission,
or settlement behavior from later phases.

## Result

PASS for automated validation. Physical phone approval remains open.

- Five fixed templates have distinct validated evidence contracts.
- Activity, community, and NIM commitment steps persist independently.
- Local schedule dates materialize to frozen UTC occurrence windows.
- Public Pods use applications and private Pods use invitations.
- A generated Nimiq keypair completed the real challenge and verification APIs.
- Publication writes the contract and occurrences atomically.
- Published contracts receive a deterministic SHA-256 fingerprint.
- Post-publication edits return HTTP 409.
- Unauthenticated creator routes redirect to the signed wallet gate.

## Evidence

- `pnpm check`: PASS
- `pnpm test:e2e`: 10 of 10 PASS across mobile Safari and Android Chromium
- Exact Wi-Fi-origin hydration test: 2 of 2 PASS at `192.168.29.244`
- Repository-wide unit tests: 44 PASS
- Live service integration tests: 5 PASS
- Production build: PASS
- No U+2014 characters: PASS

## LAN hydration correction

The first phone checkpoint exposed a server-rendered Connect screen whose client
button could not hydrate because Next blocked development resources requested
through the Wi-Fi host. The live server warning identified the exact boundary.
`allowedDevOrigins` now permits the configured LAN host, and a browser regression
proves the Connect control reaches account access, message signing, and session
verification through that exact origin. The landing-page Create a Pod action now
uses the premium secondary-button treatment rather than text-link styling.

## Manual gate

Abhinav must complete the same path inside Nimiq Pay over the LAN and approve
the wallet handoff, motion, form ergonomics, publication moment, and frozen
Rules screen before Phase 2 begins.
