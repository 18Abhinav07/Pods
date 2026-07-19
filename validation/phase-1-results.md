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

PASS for automated validation, physical Nimiq Pay wallet authentication, and
the complete creator-flow and motion checkpoint. Abhinav approved Phase 1 on
2026-07-19 after testing creation, saved drafts, deletion, publication, status
semantics, frozen Rules, and the mobile interaction quality.

- Five fixed templates have distinct validated evidence contracts.
- Activity, community, and NIM commitment steps persist independently.
- Local schedule dates materialize to frozen UTC occurrence windows.
- Public Pods use applications and private Pods use invitations.
- A generated Nimiq keypair completed the real challenge and verification APIs.
- Publication writes the contract and occurrences atomically.
- Published contracts receive a deterministic SHA-256 fingerprint.
- Post-publication edits return HTTP 409.
- Owner-owned unpublished drafts require confirmation before permanent deletion.
- Published Pod rows show their lifecycle as Enrollment open and their contract as Rules frozen.
- Template markers use semantic activity symbols instead of ordinal numbers.
- Unauthenticated creator routes redirect to the signed wallet gate.

## Evidence

- Lint, typecheck, unit, integration, and production build gates: PASS
- `pnpm test:e2e`: 12 of 12 PASS across mobile Safari and Android Chromium
- Exact Wi-Fi-origin hydration test: 2 of 2 PASS at `192.168.29.244`
- Repository-wide unit tests: 45 PASS
- Live service integration tests: 6 PASS
- Production build: PASS
- No U+2014 characters: PASS

## Physical Nimiq Pay evidence

On 2026-07-19, the phone loaded the LAN Mini App, approved account access, and
signed the server challenge. The live server recorded `POST /api/auth/challenge`
200, `POST /api/auth/verify` 200, and authenticated navigation to `/today`,
`/discover`, `/my-pods`, and `/inbox`.

The first physical signature attempt correctly failed because the server had
verified raw challenge bytes. Official Nimiq Keyguard signs a domain-separated
SHA-256 digest containing `\x16Nimiq Signed Message:\n`, the decimal UTF-8 byte
length, and the message bytes. The verifier now reconstructs that digest before
Ed25519 verification, while still checking that the public key derives the
selected wallet address. Tests reject raw signatures and modified messages.

## LAN hydration correction

The first phone checkpoint exposed a server-rendered Connect screen whose client
button could not hydrate because Next blocked development resources requested
through the Wi-Fi host. The live server warning identified the exact boundary.
`allowedDevOrigins` now permits the configured LAN host, and a browser regression
proves the Connect control reaches account access, message signing, and session
verification through that exact origin. The landing-page Create a Pod action now
uses the premium secondary-button treatment rather than text-link styling.

Nimiq Pay also injects safe-area variables onto the root document element before
React hydrates. The root layout now tolerates only that known host-owned attribute
difference. Descendant hydration mismatches remain observable. The root contract
has an automated regression test; the final physical creator-flow review remains
the device approval gate.

## Manual gate

PASS. Phase 2 public and private enrollment may begin. Participant deposits,
treasury crediting, and roster lock remain outside this approval.
