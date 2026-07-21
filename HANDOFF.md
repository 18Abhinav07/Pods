---
project: pods
last-updated: 2026-07-21 21:10
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[validation/phase-4a-results]] | [[docs/superpowers/plans/2026-07-21-phase-4-social-alpha]]

## State

Phase 4A closed-alpha foundation is automated-pass. The active implementation
lives on `phase/04a-social-alpha-foundation` in the isolated worktree
`/private/tmp/pods-phase-04a`.

The Railway `alpha` environment has a healthy web deployment, isolated
Postgres, a private evidence bucket, and a separate reserved social bucket.
Alpha access is enforced for the two real participant wallets and NIM deposits
are hard-disabled in both the funding UI and deposit-intent API.

## In Progress

- Task: complete the physical Nimiq Pay realtime transport gate.
- URL: `https://pods-web-alpha.up.railway.app`.
- Harness: `/validation/realtime?podId=<created-alpha-pod-id>`.
- Required result: two allowlisted wallets, 20 minutes connected, 100 events
  each, 90 seconds backgrounded, network interruption and recovery, zero gaps,
  zero duplicates, and no cross-Pod leakage.
- If the physical gate passes, Phase 4C may use SSE with replay. If it fails,
  Phase 4C uses two-second cursor polling.

## Open Errors and Blockers

- Railway refused the separate `pods-worker` service because the account's
  free-plan resource limit was reached after Postgres and `pods-web`.
- The worker code has alpha preflight and safe health probes, but no remote
  worker exists yet.
- Do not merge the worker into the web process. Add a Railway service slot or
  select another approved worker host.
- External DNS resolution for the new Railway domain failed from the Codex
  execution environment immediately after creation. Railway itself marked the
  domain active and the first deployment healthy.
- Phase 4B through Phase 4G remain unimplemented by the one-phase-at-a-time
  approval contract.

## Verification

- Full `pnpm check`: PASS against isolated Postgres database `pods_phase04a`.
- Root tests: 6 PASS.
- Domain tests: 30 PASS.
- UI tests: 2 PASS.
- Web tests: 138 PASS.
- Worker tests: 48 PASS.
- Integration tests: 32 PASS.
- Production web and worker builds: PASS.
- No U+2014 characters: PASS.
- Final Railway web deployment `664efce8-cdef-4e7c-8776-96abf0a4ecb3`:
  SUCCESS with migrations and readiness health.

## Git State

- Branch: `phase/04a-social-alpha-foundation`.
- Base: `81cfbc1` from `phase/04-activity`.
- Implementation checkpoint: `b2f2f07`.
- Original Phase 4 worktree and phone fixture were not modified.
- Phase 4A changes are not merged to `main` and are not pushed pending the
  physical gate and Abhinav's approval.

## Next 3 Tasks

1. Run the physical realtime procedure in
   `validation/phase-4a-results.md` and record PASS or the exact failure.
2. Resolve the Railway worker service slot without merging worker and web.
3. Request Abhinav's Phase 4A
   approval before beginning Phase 4B.
