---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, phasing, launch, build-in-public, planning]
---

# First Slice 08: Build Phasing and Launch Plan

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/00-overview|00: Overview]] |
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03: Proof, review and execution moments]] |
[[docs/mainnet-planning/25-mainnet-testnet-and-release-topology|25: Mainnet, testnet and release topology]] |
[[HANDOFF]]

## Phase 0 — Foundation

Auth (GitHub OAuth), the GitHub App itself (install flow, permission set
from [[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06]]),
a minimal data model (Person, Project, Commitment, Execution Moment), and a
webhook receiver turning GitHub events into Pods facts. Nothing user-facing
yet — pure plumbing.

## Phase 1 — Complete First Slice

Everything in Doc 00's "In" scope, built completely, across both the CLI
and the web app (see
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]]). This
is a build-sequencing breakdown within that one complete v1, not a list of
which features get cut:

1. `pods init`/`pods link`/`pods add` project and repo setup.
2. Issue-assignment auto-creating a commitment; PR merge + GitHub review
   auto-creating the proof and Execution Moment (see
   [[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]]
   for the corrected merge-based trigger).
3. The manual-artifact proof path **with its real reviewer inbox** — both
   the CLI commands (`pods review list/approve/reject`) and the web screen,
   built together, not one now and one later.
4. Both timelines — personal raw and project rollup — and the public
   shareable profile.
5. Manual Build Card capture (screenshot/clip attach, no automation yet).
6. GitHub Discussion escalation from the room.

This is the target for something the Skool community can actually use
during Cycle II — a complete product, not a demo of one slice of it.

## Phase 2 — Post-V1 Enhancements

Real improvements layered onto an already-complete v1, not features v1 is
missing: Build Card automation (Playwright/preview-URL auto-capture),
before/after pairing across moments on the same feature, a native MCP
server (see [[docs/mainnet-planning/First-Slice/07-cli-and-agent-workflow|07]]
for why the CLI + manifest approach already covers this without one), the
tiered private-evidence configuration, and real-time sync if request/refresh
ever proves insufficient at real usage scale.

## Phase 3 — Cycle III Pilot Readiness

The Event/Build Season wrapper, an organizer pulse view, and the
event-timeline eligibility plumbing (significance-tier gating) needed to
support an actual multi-project pilot cohort. Full organizer
marketing-content delivery is not required here — it's tracked separately
in [[docs/mainnet-planning/First-Slice/09-open-decisions|09]].

## Build-In-Public Content Plan

Pods' own build becomes its own content pipeline: daily commits and PRs on
Pods itself, run through Pods, produce the raw material for daily Skool/X
posts — dogfooding the raw timeline feature and sourcing content
simultaneously, rather than writing marketing copy separately from
building. A personal origin-story post anchors the series. Weekly deeper
posts tie to real phase completions (e.g. "the core loop works end to end"
is a genuine, postable moment). Phase 2 features (Build Cards, before/after)
get teased early as **static mockups only**, decoupled from actual
engineering — so a "coming soon" doesn't quietly delay while still giving
the audience a reason to follow, and doesn't pull Phase 2 work forward at
the expense of the Phase 1 timeline.

## Sequencing Discipline

Nothing in Phase 2 or Phase 3 blocks Phase 1 shipping. If Phase 1 slips,
the fix is trimming Phase 1 further (e.g. dropping the manual Build Card
capture to a bare list, as described as the leaner "Option A" alternative
during design discussion), not borrowing time from later phases.
