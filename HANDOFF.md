---
project: pods
last-updated: 2026-07-24 15:20
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[sessions/2026-07-24-codex-hackathon]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]]

## State

Phase 4 template commitments, proof submission, creator review, and canonical
participant status are deployed. The live legacy Testnet Pod now uses its
creator as the effective reviewer through an additive audited override.

## In Progress (resume here)

- Task: complete the physical Nimiq Pay creator-review gate.
- Production: `https://pods-nimiq-activity.up.railway.app`.
- Pod: `82663fcc-0f27-4b38-8432-d4c5986a0e70`.
- Creator route: `/pods/82663fcc-0f27-4b38-8432-d4c5986a0e70/admin/reviews`.
- Participant submission remains `reviewing` and inside its hard deadline.

## Open Errors / Blockers

- No automated or deployment blocker.
- Physical Nimiq Pay proof is pending for creator evidence inspection,
  approve/reject action, and participant-side projection after refresh.
- Proportional settlement remains disabled for the existing
  `full_refund_alpha` contract.

## Git State

- Branch: `fix/phase4-activity-experience`.
- Implementation commit: `6a82312 feat: safely amend legacy testnet verifier`.
- Full `pnpm check`: PASS with 587 non-integration and 90 integration tests.
- Exact Phase 4 Android browser journeys: 3 of 3 PASS.

## Runtime State

- Web deployment `8ccf3524-de14-481d-a4dc-1cfb2825ba32`: `SUCCESS`.
- Final Worker deployment `2059aba2-58e1-45c7-94ff-7c29c107606a`: `SUCCESS`.
- Amendment flag: `false` in the running Worker.
- Railway SSH keys: none registered.
- Frozen contract hash and creator consent hash remain
  `044c980e87384587a380b15721b8e4efa8c3ff8c812e21d7e0caca3d2ec5c0b3`.
- Creator membership, creator financial state, creator decisions, and
  settlement runs remain zero.

## Next 3 Tasks

1. Open the creator review route in Nimiq Pay and inspect the participant's
   image, artifact URL, commitment, and result summary.
2. Approve or reject once, then verify Today, Room, submission detail, and
   Updates show one canonical outcome without exposing reviewer-only evidence.
3. Record the physical PASS or exact correction before opening the next phase.
