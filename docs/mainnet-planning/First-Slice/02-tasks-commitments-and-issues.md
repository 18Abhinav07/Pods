---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, commitments, github, issues, planning]
---

# First Slice 02: Tasks, Commitments, and Issues

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01: Onboarding and setup]] |
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03: Proof, review and execution moments]] |
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06: GitHub integration architecture]] |
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10: Web app screens and UX]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|09: Pod, occurrence and commitment lifecycles]] |
[[HANDOFF]]

Commitment state described here (active/superseded/fulfilled) is what the
Commitments screen in
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]] displays
— that screen is a read view over exactly this model, not a separate one.

## Task = a GitHub Issue

A task, in this slice, **is** a GitHub Issue. Pods never provides its own
task-creation surface — issues are already a good tracker, and duplicating
one inside Pods would violate the friction principle in
[[docs/mainnet-planning/First-Slice/00-overview|00]]. Pods only observes
issues; it does not originate them.

Assignment is left entirely to the team's own norms — lead-assigned,
self-assigned, or peer-assigned, however the team already works. Pods does
not gatekeep who can assign what; that's a GitHub permission question, not
a Pods one.

## Commitment = an Assigned Issue

An issue becomes a **Commitment** the moment a specific person is assigned
to it on GitHub. At that moment, Pods freezes a snapshot of the issue's
title, description, labels, and milestone link — this frozen snapshot is
the **claim basis** for everything that follows. If the issue is edited
later (title changed, description rewritten), the live issue on GitHub
reflects the edit, but the already-active commitment's frozen basis does
not silently change out from under the builder or the reviewer.

## Acceptance: Automatic on Assignment (v1 Decision)

**For this slice, acceptance is automatic** — the moment GitHub shows
someone assigned to an issue, Pods treats it as an accepted commitment.
There is no separate "accept" click, no CLI confirm, no GitHub
reaction/comment step.

This was a deliberate speed tradeoff, weighed against two alternatives:

- A GitHub reaction/comment as an explicit accept signal — still zero new
  UI, stays entirely on GitHub, but adds a small conscious moment.
- An explicit click on web or CLI — most deliberate, but reintroduces the
  "open another app" friction the whole product is trying to avoid.

Automatic-on-assignment was chosen for launch speed. The tradeoff is real:
there's no deliberate "I'm taking this on" ceremony in v1. If someone is
assigned in error, the correction path is to unassign them on GitHub itself
— since Pods only reflects GitHub's assignment state, removing the
assignment removes the commitment. This is tracked as a candidate revisit
in [[docs/mainnet-planning/First-Slice/09-open-decisions|09]] if it proves
to cause real problems in the Cycle II dogfood period.

## Single-Assignee Only (v1 Decision)

A commitment in this slice has exactly one assignee. If two people
collaborate on the same issue/PR, credit still resolves to whoever the
issue is assigned to and whoever's PR is the proof — shared or split credit
for genuinely paired work is **not** solved in this slice. This is named
explicitly rather than silently handled, because it's the one known gap in
an otherwise clean per-person attribution model (see
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]]
for why single-assignee attribution is otherwise trustworthy).

GitHub itself allows an issue to carry more than one assignee, which this
slice's model doesn't have a place for. Rather than guess at exact webhook
payload shape, the rule is stated at the level of issue state: **if Pods
observes an issue with more than one assignee at the time a commitment
would be created, it does not create a commitment automatically** — it
surfaces the issue to the Project Lead as needing a single owner before
tracking begins. This avoids silently picking a "primary" assignee on the
team's behalf, which could misattribute credit exactly the way this
product exists to prevent.

## Reassignment and Unassignment

An active commitment can be interrupted by GitHub-side changes to the
issue's assignment:

- **Unassigned before proof exists** — the commitment moves to a
  `superseded` state. It is never deleted (the historical record of who
  was assigned when stays intact), but it stops being the issue's active
  commitment.
- **Reassigned to someone else** — the prior commitment becomes
  `superseded`, and a new commitment is created for the newly assigned
  person, following the same automatic-acceptance rule above.
- **Unassigned after proof already exists** (a PR was already merged
  against it) — the existing Execution Moment is untouched; unassignment
  after the fact does not retroactively revoke a fact that already
  happened.

This keeps the historical record honest without needing a full formal
state-machine diagram at this design layer — `active`, `superseded`, and
`fulfilled` are the only states this slice needs; further detail belongs in
the implementation plan, not here.

## Issue Lifecycle and Closed-Issue Access

Closing an issue does not restrict or delete its data. Every comment,
label, assignee, and timestamp on an issue remains fully queryable via the
GitHub API indefinitely after closure — a plain `GET` on a closed issue
returns everything it always did.

GitHub also exposes a dedicated **Issue Timeline API**
(`GET /repos/{owner}/{repo}/issues/{issue_number}/timeline`) — a full
chronological event log per issue: assigned/unassigned events, label
changes, cross-references from commits/PRs, review-requested events, and
closed/reopened events. This is permanently queryable regardless of the
issue's current state.

Practical ingestion approach: **webhooks are the primary, real-time path**
(so commitments and moments feel live), and **the Timeline API is the
reconciliation/backfill path** for anything a webhook might have missed.
Pods should store each fact durably the moment it's observed rather than
depending on being able to re-query GitHub indefinitely — access can later
be revoked (collaborator removed, App uninstalled), at which point Pods
loses the ability to re-fetch, but whatever was already captured remains
valid. See [[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06]]
for the full ingestion architecture.

## What Actually Turns a Commitment Into a Fact

A merged, reviewed PR referencing the issue (or an approved manual artifact
— see
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]])
is what turns a commitment into an **Execution Moment** — not issue closure
itself. Many real PRs merge without using a GitHub closing keyword, so the
issue never auto-closes even though the work is genuinely done; treating
closure as the required trigger would silently strand those commitments.
Issue closure, when it happens, is additional confirming context, not the
signal Pods waits on. Pods does not need to have been watching the issue
every second of the day either way — the Timeline API lets it reconstruct
the whole story (who was assigned, what happened, whether/when it closed)
from that one endpoint if needed.
