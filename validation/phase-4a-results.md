---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [validation, phase-4a, railway, alpha, realtime, storage]
status: automated-pass-device-and-worker-pending
---

# Phase 4A Closed Alpha Foundation Gate

Related: [[HANDOFF]] | [[validation/phase-4-results]] | [[docs/superpowers/plans/2026-07-21-phase-4-social-alpha]]

## Current verdict

`AUTOMATED PASS, PHYSICAL REALTIME GATE PENDING, REMOTE WORKER BLOCKED`

Phase 4A has a tested closed-alpha capability contract, enforced wallet
allowlist, hard deposit lock, Railway-compatible private object storage, safe
health probes, and an authenticated realtime validation harness. The web
service, Postgres, evidence bucket, and reserved social bucket exist in an
isolated Railway `alpha` environment.

The Railway account refused a separate worker service after provisioning
Postgres and the web service because the free-plan resource limit was reached.
The financial worker was not merged into the web process. Remote worker health
and lifecycle execution therefore remain blocked until another Railway service
slot is available.

## Implemented safety boundary

- Alpha deployments require Nimiq Testnet.
- Public capabilities expose no secrets, internal caps, or treasury controls.
- Alpha access supports `closed`, `allowlist`, and `public` modes.
- Only the two real participant wallets are currently allowlisted.
- A non-allowlisted wallet has its newly created session removed and receives a
  403 response.
- Public discovery and public Pod pages require an authenticated session while
  the alpha is not public.
- `PODS_DEPOSIT_MODE=off` blocks deposit intent creation before any funding
  repository call.
- The funding screen states that NIM commitments are paused and renders no
  wallet action.
- Private evidence storage uses virtual-hosted Railway Bucket URLs without
  runtime bucket creation.
- Web readiness checks database, evidence storage, and capability
  configuration without returning connection details or raw errors.
- Worker readiness and alpha preflight are implemented and test-backed for the
  later separate worker deployment.

## Realtime validation boundary

- The harness is hidden behind `PODS_REALTIME_SPIKE_ENABLED=true`.
- Every stream and mutation requires a signed wallet session and authorized Pod
  access.
- For the validation harness only, creators and accepted participants may join
  before funding because deposits are intentionally disabled.
- Event IDs are sequential per Pod.
- Mobile retries are idempotent by actor and client event ID.
- Replay is cursor-based and history is bounded.
- Stream DTOs contain no wallet address, user ID, private evidence, or message
  content.
- A 20-second heartbeat and EventSource retry hint are active.
- The validation screen measures received events, gaps, duplicates, reconnects,
  and recent sequence IDs.

## Automated evidence

- Full `pnpm check`: PASS against the isolated `pods_phase04a` database.
- Copy gate: PASS with no U+2014 characters.
- Root tests: 6 PASS.
- Domain tests: 30 PASS.
- UI tests: 2 PASS.
- Web unit and component tests: 138 PASS.
- Worker tests: 48 PASS.
- Live Postgres integration tests: 32 PASS.
- Production web and worker builds: PASS.
- Railway web migration: PASS.
- Railway web startup: PASS.
- Railway deployment health: PASS.
- Railway Postgres: provisioned in `alpha`.
- Railway private evidence bucket: provisioned in Singapore.
- Railway private social bucket: provisioned in Singapore.

## Railway evidence

- Project: `Pods`.
- Environment: `alpha`.
- Web service: `pods-web`.
- Public domain: `https://pods-web-alpha.up.railway.app`.
- First health-verified deployment: `c0918ba9-988a-4d55-be3a-ded218c54276`.
- External DNS resolution from the Codex execution environment remained
  unavailable immediately after domain creation. Railway marked the domain
  active and the deployment successful after its internal readiness check.

## Physical realtime gate

1. Open `https://pods-web-alpha.up.railway.app` as the first allowlisted wallet
   inside Nimiq Pay and complete wallet sign-in.
2. Create a Build & Ship Pod. Funding will remain disabled by design.
3. Open the same alpha as the second allowlisted wallet, apply, and accept the
   application from the creator wallet.
4. On both devices open
   `/validation/realtime?podId=<the-created-pod-id>`.
5. Keep both screens open for at least 20 minutes.
6. Emit 100 events from each wallet.
7. Background one Nimiq Pay WebView for 90 seconds.
8. Interrupt and restore that device's network.
9. Return to the harness and require zero gaps, zero duplicates, visible
   reconnect recovery, and no event from any different Pod.
10. Record the physical result below. A failure selects cursor polling for the
    social-room phase.

## Pending result

- Physical Nimiq Pay realtime gate: `PENDING`.
- Separate Railway worker service: `BLOCKED BY ACCOUNT RESOURCE LIMIT`.
