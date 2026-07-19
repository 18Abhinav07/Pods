---
project: pods
last-updated: 2026-07-19 22:45
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[AGENTS]] | [[docs/implementation-plan]] | [[validation/phase-2-results]]

## State

Phase 0 and Phase 1 are physically approved. Phase 2 public and private enrollment
is implemented and passes the complete automated gate. The creator-aware Discover
fix and automatic test-fixture teardown are implemented and verified. Physical
Nimiq Pay approval is pending. Phase 3 funding remains blocked.

## In Progress (resume here)

- Task: Run the corrected Phase 2 phone checkpoint with Abhinav.
- URL: `http://192.168.29.244:3411`, served by the active `pnpm dev:lan` process.
- Creator behavior: a creator sees `Manage enrollment` on their own public Pod card
  and public preview. Another wallet sees `Apply to join`.
- Gate: public two-wallet application and creator decision, private invitation
  acceptance and replay, Today priority, My Pods, Rules, funding boundary, and motion.

## Open Errors / Blockers

- The shared local database contains 135 historical automated-test Pods from before
  teardown existed. `Pods MVP C1` is the one identified real published Pod.
- Do not delete the 135 historical fixtures until Abhinav explicitly approves the
  exact destructive cleanup.
- Phase 3 is blocked on Abhinav's explicit Phase 2 phone approval.
- The planned 0.01 NIM treasury return still requires Abhinav's exact recipient NQ address.

## Git State

- Branch: `phase/02-enrollment`
- Phase 2 domain, persistence, discovery, applications, creator controls, invitations,
  and connected personal surfaces are committed.
- Creator-aware discovery and preview behavior is implemented with regression coverage.
- Phase 1 and Phase 2 integration and browser tests delete exact generated users after
  every run, which cascades only their own Pods and enrollment records.
- Verification: `pnpm check` PASS, 12 Phase 1 and Phase 2 mobile browser tests PASS,
  and the historical fixture count remained unchanged at 135 after both suites.

## Next 3 Tasks

1. Receive explicit approval to delete the 135 historical test fixtures, or leave them intact.
2. Abhinav retests Discover and the complete Phase 2 flow in Nimiq Pay on the phone.
3. Record PASS or concrete phone defects, then begin Phase 3 only after PASS.
