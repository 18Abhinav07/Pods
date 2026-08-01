---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, open-decisions, planning]
---

# First Slice 09: Open Decisions

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/00-overview|00: Overview]] |
[[HANDOFF]]

This doc exists so nothing gets silently resolved by omission. Each item
below was raised during design discussion and deliberately left open,
deferred, or given a stand-in default rather than a real decision.

## Resolved for v1 (stand-in defaults, revisit if they cause problems)

- **Commitment acceptance mechanism** — automatic on GitHub assignment, no
  explicit accept step. Chosen for launch speed over the earlier
  alternatives (explicit click, GitHub reaction/comment). If this causes
  real problems during Cycle II dogfooding (e.g. wrong assignments being
  treated as accepted commitments), revisit toward the reaction/comment
  option, which keeps zero new UI while adding a conscious moment.
- **Repo governance** — centralized only; Project Lead owns/administers
  all repos. Member-owned repo support is a real, deferred feature, not
  ruled out permanently.
- **Private-evidence handling** — simple binary (internal by default,
  explicit per-moment publish). The fuller three-tier privacy config
  (full detail / structural-only / redacted) from the broader workbook is
  deferred until there's evidence the binary default is insufficient.
- **Room/chat build decision** — resolved: a full in-house chat room is
  built for v1, as the first surface a person lands on for a Project. It
  was flagged as blocking (comparable engineering weight to the MCP server
  we chose not to build) until this was confirmed. See
  [[docs/mainnet-planning/First-Slice/05-discussions-and-room|05]] and
  [[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]] for
  what it does and doesn't own.

## Fully Parked — Needs Its Own Future Brainstorm

- **Event-level highlight curation mechanism** — whether organizer picks
  highlights manually from the eligible pool, or an algorithm auto-suggests
  (with a fairness constraint so no single project dominates) and the
  organizer just approves/swaps. Not resolved; not needed until Phase 3.
- **Organizer marketing-content delivery** — how much ready-to-post
  material organizers get, in what format, on what cadence. Identified as
  needing real dedicated design thought, not a shallow add-on.
- **Builder reputation/accountability system** — how to handle members who
  don't take accountability for assigned work, and whether/how a
  cross-project reputation signal should exist. Needs its own feature plan.
- **Daily commitment/review notification and scheduling service** — fixed
  windows, reminders, timezone handling. Real infrastructure, independent
  of the core loop, not designed here.
- **`pods review help` (agent-assisted review)** and
  **commit-message-driven auto-classification** (agents authoring
  commits/PRs in a way that signals significance directly) — both raised
  as valuable, both deferred past this slice.

## Explicitly Rejected — Do Not Re-Propose Without New Justification

These have each been proposed once and turned down with clear reasoning.
Logged here so a future audit pass doesn't quietly reintroduce them as if
they were new ideas:

- **Auto-picking a "primary" assignee on a multi-assignee GitHub issue.**
  Rejected because Pods silently guessing who gets credit is exactly the
  failure mode this product exists to prevent. The actual rule (Doc 02):
  Pods refuses to auto-create a commitment on a multi-assignee issue and
  flags it to the lead instead.
- **A "Build Card Studio" modal / editor screen with caption-override and
  crop controls, plus a dedicated `pods card generate` command.** Proposed
  twice by the same kind of "make it a complete product" audit, rejected
  both times as Phase-1 scope creep. The actual v1 feature (Doc 03) is
  manual attach-or-skip, no separate studio surface, no separate command.
- **A three-outcome manual-proof review** (approve / request changes /
  reject) presented without a state machine for the middle outcome. The
  actual v1 model (Doc 03) is two outcomes only — approve or reject — with
  the reviewer's `--reason` on reject covering the same need "request
  changes" was trying to serve, without inventing a resubmission loop that
  was never designed.

## Known Gaps, Named Rather Than Hidden

- **Shared/multi-assignee commitments** — a commitment in this slice has
  exactly one assignee; genuinely paired work on one PR doesn't get split
  credit. Not solved, not silently ignored.
- **Playwright/preview-URL automatic capture and before/after pairing** —
  real Phase 2 work, not present in the Phase 1 loop.
