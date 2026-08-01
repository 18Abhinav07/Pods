---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, timelines, shareables, planning]
---

# First Slice 04: Timelines and Shareables

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03: Proof, review and execution moments]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|12: Activity ledger, timelines and shareables]] |
[[docs/mainnet-planning/First-Slice/09-open-decisions|09: Open decisions]] |
[[HANDOFF]]

## One Fact Stream, Multiple Lenses

This slice supports two tiers of timeline, not three — the Event/Build
Season tier described in the broader workbook is explicitly out of scope
here (see [[docs/mainnet-planning/First-Slice/00-overview|00]]). Both tiers
render the *same* underlying Execution Moments; neither is a separate data
model.

## Builder Timeline — Raw

Every accepted Execution Moment belonging to a person appears here, in
order, with its Build Card if one was attached. This is the personal
execution record — the direct answer to "I have no way to show what I
built." Nothing is filtered out at this tier; it's meant to be a complete,
credible ledger, not a curated highlight reel.

## Project Timeline — Lossless Rollup, Reformatted

Every Execution Moment from every contributor on the Project appears here
too — this is **not** a filtered subset of the builder timeline, it's the
same moments recombined into a multi-person story. The difference from the
builder tier is presentational, not a selection step: Build Cards are shown
at a size weighted by significance tier (milestone/canonical moments are
visually larger), and captions lean toward team-level framing. No approval
gate sits between a builder's moment and its appearance on the project
timeline — if it's real and accepted, it's part of the project's story.

## Progress vs. Timeline

At both tiers, "what's the current state" (active/blocked/near a milestone)
is a **separate surface** from "what's the history" (the curated moment
feed). This slice's progress view is intentionally minimal — a simple
current-state summary per Project — not the full organizer Pulse
console described in the broader workbook, which requires the
Event/Organizer scope this slice doesn't include.

## Public Shareable

Each builder gets one shareable profile link — image, link, and an
editable draft caption per moment they choose to make public. Publishing
is opt-in per moment; nothing crosses from the internal Project view to the
public link automatically. This is deliberately simple in v1: no separate
public-profile theming or layout options, just a clean, credible record a
builder can point someone to instead of writing a Twitter thread.

**Publishing a moment from a private repo never exposes private-origin
links or assets.** If the moment's underlying issue/PR lives in a private
repo, the public shareable shows a non-linking reference (e.g. `[Private
Repo] #12`) instead of a clickable `github.com/...` URL, and any attached
image/clip is served from a public-safe copy, never the private-origin
location. See
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06]]
for the sanitization mechanism this guarantee depends on.

## Explicitly Parked, Not Designed Here

**Event-level timeline and organizer marketing-content delivery are not
designed in this slice.** Earlier discussion identified this as needing
real thought — how much ready-to-post material organizers get, in what
format, on what cadence — and deliberately deferred it rather than bolt on
a shallow version. It's tracked in
[[docs/mainnet-planning/First-Slice/09-open-decisions|09]] as its own future
brainstorm, not a TODO inside this slice.
