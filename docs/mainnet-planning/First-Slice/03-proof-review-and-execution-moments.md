---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, proof, review, execution-moments, planning]
---

# First Slice 03: Proof, Review, and Execution Moments

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02: Tasks, commitments and issues]] |
[[docs/mainnet-planning/First-Slice/04-timelines-and-shareables|04: Timelines and shareables]] |
[[docs/mainnet-planning/10-proof-verification-and-review|10: Proof verification and review]] |
[[HANDOFF]]

## Two Proof Paths

**Primary — merged, reviewed Pull Request.** A commitment's proof is a PR
that references the assigned issue, gets reviewed via GitHub's own
reviewer-assignment and approval mechanism, and merges. Pods does not build
a separate review UI for this path — GitHub's review/approval/merge
sequence *is* the review decision. Pods observes it, it doesn't reproduce
it.

**Secondary — manual artifact.** For work that isn't code (design, video,
non-repo deliverables), the builder attaches an artifact (image or video)
via the CLI, tied to the same commitment. This path has **no GitHub-native
review counterpart** — there's no PR to approve — so it needs its own
minimal Pods-side approve/reject action. This is the one place in the whole
system where Pods can't simply borrow GitHub's mechanism, because there's
nothing to borrow. It's a small, deliberately narrow feature: a reviewer
sees the attached artifact and the frozen commitment basis, and
approves/requests changes/rejects.

**Where this review happens:** both the CLI and a real web screen, built
together for v1 — not one now and the other deferred. There is no PR to
review for this path, so a functioning review surface is required for the
feature to work at all, not an enhancement on top of something already
complete. `pods review list/approve <commitment-id>/reject
<commitment-id> [--reason]` covers CLI-comfortable reviewers; the web
**Proof** screen (see
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]]) shows
the same pending items with the artifact preview and frozen claim basis
front and center, for anyone who isn't living in a terminal. Both read and
write against the same commitment records — neither is the "real" one.

**Where the artifact itself is stored** is deliberately left to the
implementation plan, not this design doc — this slice commits to "opaque
blob storage behind a signed upload/download URL," not a specific vendor.
Picking S3 vs. R2 vs. anything else is an infrastructure decision that
doesn't change the product behavior described here.

Both paths resolve to the same downstream object: an accepted proof tied to
one commitment, one assignee.

## Why Single-Assignee PR Proof Is Trustworthy

Because a commitment is always assigned to one specific person (see
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02]]),
"I opened the PR against my assigned issue, it was reviewed and merged" is
an unambiguous claim tied to that person — not a generic "was on the team"
credit. This is different from the failure mode this whole product exists
to fix (hackathon team-submission erasing individual contribution), because
every task has a named owner from the start. The one gap this doesn't cover
is genuinely paired work on a single PR, which this slice does not attempt
to solve (see [[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02]]).

## Execution Moments

An **Execution Moment** is the fact created when a commitment reaches a
terminal accepted state. This is the actual product output: a stable,
timestamped, attributed record that did not exist on GitHub before Pods
created it. It feeds the builder's raw timeline and the project rollup
timeline (see [[docs/mainnet-planning/First-Slice/04-timelines-and-shareables|04]]).

**The trigger is the merged, reviewed PR itself — not issue closure.**
GitHub only auto-closes an issue on merge if the PR uses a recognized
closing keyword (`closes #12`, `fixes #12`, etc.) in its description or a
commit on the default branch. In practice, plenty of real merges reference
an issue without using one of these exact keywords, and the issue never
auto-closes. If the Execution Moment depended on issue closure as the sole
signal, those commitments would silently never resolve. So the actual rule
is: **a PR that references the commitment's issue, passes GitHub review,
and merges is sufficient on its own** to create the Execution Moment.
Issue closure (whether automatic or manual) is a confirming signal when it
happens, not a required one.

**"References the issue" means GitHub's own tracked Development link, not
a bare-text mention.** GitHub maintains a structured link between a PR and
an issue whenever a closing keyword is used, or when someone manually links
them via the PR's "Development" sidebar — exposed via the PR's
`closingIssuesReferences` (GraphQL) or the issue's cross-reference timeline
events. A plain-text `#12` somewhere in a PR description is not sufficient
on its own — people reference issue numbers in conversation without meaning
"this PR fulfills it," and treating every mention as proof would make the
signal gameable and noisy. If a PR genuinely fulfills a commitment but
was never linked to its issue on GitHub (rare, but possible), the fallback
is the same manual-artifact proof path in reverse: the builder or an
authorized reviewer explicitly links the PR to the commitment inside Pods,
which is then treated the same as a Development-linked PR — an explicit
human action standing in for a missing GitHub-native signal, never Pods
guessing from text.

Because GitHub webhooks can arrive out of order (a `pull_request.closed`
event is not guaranteed to arrive after or before a related `issues.closed`
event), Pods treats each event as an update to the commitment's current
state rather than assuming a fixed arrival order, and reconciles final
state via the Issue Timeline / PR APIs (see
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06]])
rather than depending on webhook sequence being correct.

## Significance: Inherited, Not Self-Rated

Every Execution Moment carries a significance tier — **routine**,
**milestone**, or **canonical** — used to decide what's emphasized on
timelines. This tier is **inherited from structure the lead already set**
(the issue's linked milestone, or a specific label), never self-rated by
the builder at proof-submission time. Asking someone to declare their own
work important is both an awkward ask and an untrustworthy signal; reusing
the lead's own milestone structure costs nothing extra and produces a more
honest signal.

## Build Cards: Manual Capture in v1

Every Execution Moment can optionally carry a visual artifact — a
screenshot or short clip — composited into a "Build Card": the image plus
an auto-drafted one-line caption (pulled from the real PR/issue title,
never invented) plus light context (day/commitment/reviewer). This is what
makes a moment shareable rather than just logged.

**For this slice, capture is manual only.** After a proof is accepted, the
builder is offered a simple attach step — drag in a screenshot or clip, or
skip. There is no automatic Playwright-driven capture against a dev server
or preview URL in v1, and no automatic before/after pairing against a prior
moment on the same feature. Both are real, valuable, and explicitly
deferred to Phase 2 (see
[[docs/mainnet-planning/First-Slice/08-build-phasing-and-launch-plan|08]]) —
they're genuine engineering, not something to half-build now.

## What This Slice Does Not Solve

- Shared/multi-assignee commitment credit.
- Automatic visual capture or before/after pairing.
- Any AI judgment of work quality — captions are drafted from real fields
  only, never inferred or generated content about what the work "means."
