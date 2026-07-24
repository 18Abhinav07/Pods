---
project: pods
last-updated: 2026-07-24 17:40
last-agent: codex
mode: HACKATHON
---

# Pods Handoff

Related: [[README]] | [[sessions/2026-07-24-codex-hackathon]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]]

## State

Phase 4 community Testnet alpha is release-ready. The deployed creator,
participant, proof, room, privacy, and timeout journeys passed automated,
production-readiness, and physical Nimiq Pay verification.

## In Progress (resume here)

- Task: publish the community launch post and open a fresh public
  `Pods in Pods` cohort.
- Production: `https://pods-nimiq-activity.up.railway.app`.
- Launch asset:
  `/Users/18abhinav07/.codex/generated_images/019f7647-a0c6-73c3-bde8-f6cdc4600925/call_7ixDaH4oMm9TLknGJ2Bj553F.png`.

## Open Errors / Blockers

- None for the small, clearly labelled Nimiq Testnet community alpha.
- Proportional settlement remains disabled for the existing
  `full_refund_alpha` contract.

## Git State

- Branch: `fix/phase4-activity-experience`.
- Clean release commit: `faf2d55 polish Phase 4 activity release`.
- `origin/main` and the release branch both point to `faf2d55`.
- Full `pnpm check`: PASS with 587 non-integration and 90 integration tests.
- Focused release UI tests: 73 PASS.
- Android approve, reject-with-privacy, and timeout journeys: PASS.

## Runtime State

- Web deployment `5d8e292b-a230-45e1-be0d-89bff0da04cc`: `SUCCESS`.
- Final Worker deployment `2059aba2-58e1-45c7-94ff-7c29c107606a`: `SUCCESS`.
- Production landing returns HTTP 200. Configuration, database, and evidence
  storage readiness checks return `ready`.
- Abhinav confirmed the Nimiq Pay creator-participant journey works correctly.
- Amendment flag: `false` in the running Worker.
- Railway SSH keys: none registered.
- Frozen contract hash and creator consent hash remain
  `044c980e87384587a380b15721b8e4efa8c3ff8c812e21d7e0caca3d2ec5c0b3`.
- Creator membership, creator financial state, creator decisions, and
  settlement runs remain zero.

## Next 3 Tasks

1. Create the public `Pods in Pods` Pod with visitors enabled and publish the
   approved community post.
2. Monitor the first small Testnet cohort and record only reproducible issues.
3. Complete the physical proportional-settlement and payout gate before
   advertising redistributed rewards.
