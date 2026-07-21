---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [implementation-plan, social-alpha, railway, testnet]
---

# Phase 4 Social Alpha Execution Plan

Related: [[HANDOFF]] | [[docs/implementation-plan]] | [[docs/superpowers/specs/2026-07-21-pods-social-alpha-amendment]]

## Ordered releases

1. Phase 4A: Railway alpha foundation, server capabilities, private storage,
   health probes, and realtime validation.
2. Phase 4B: adaptive redesign, mandatory profile onboarding, and public profile.
3. Phase 4C: Pod rooms, replies, reactions, announcements, unread state, moderation,
   and reconnect recovery.
4. Phase 4D: commitment studio, proof cards, shared media, and private evidence.
5. Phase 4E: People discovery, follows, friends, blocks, reports, and invitations.
6. Phase 4F: friend DMs and non-friend message requests.
7. Phase 4G: capped, allowlisted, full-refund Build Pods Testnet alpha.

Review exceptions remain Phase 5. Proportional settlement and payout remain Phase 6.

## Per-release gate

- Test-first domain and API behavior.
- Lint, copy check, typecheck, unit, integration, production build, and mobile E2E.
- Local Nimiq Pay walkthrough using two real wallets.
- Railway alpha deployment and scoped health verification.
- Remote Nimiq Pay walkthrough.
- Explicit device approval before the next phase branch begins.

## Phase 4A tasks

1. Add strict server-side alpha capability parsing and safe client projection.
2. Make S3 URL style configurable for local MinIO and Railway Buckets.
3. Add web readiness and liveness routes without leaking configuration.
4. Add worker configuration preflight and startup-safe capability checks.
5. Run the authenticated realtime transport spike and record PASS or polling fallback.
6. Provision Railway web, worker, Postgres, and two private buckets.
7. Deploy with every public/social capability disabled and verify remote health.
