---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, prd, overview, planning]
---

# First Slice 00: Overview

Status: draft — pending review

Related: [[docs/mainnet-planning/first-launch-slice-workbook|First launch workbook]] |
[[docs/mainnet-planning/diagrams/pods-first-launch-product-flow|Product flow diagram]] |
[[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01: Onboarding and setup]] |
[[docs/mainnet-planning/First-Slice/08-build-phasing-and-launch-plan|08: Build phasing and launch plan]] |
[[docs/mainnet-planning/First-Slice/09-open-decisions|09: Open decisions]] |
[[HANDOFF]] | [[README]]

## Purpose

This folder is the PRD and architecture set for the **first buildable slice**
of Pods — the narrowest version of the product that a real 3-person team can
install, use for a real build, and get real value from, targeted at being
usable by the Skool community in Nimiq's Cycle II and pilot-ready for
Cycle III.

It narrows the broader mainnet architecture (docs 01–27 in the parent folder)
into one concrete, shippable slice. Where this slice diverges from or
simplifies that broader architecture, it says so explicitly rather than
silently overriding it — the broader docs remain the reference for anything
this slice defers.

## Product Identity

Pods is a developer-native execution record for collaborative building.
The promise: **turn promises into proof, and proof into portable credit.**

The identity test that defines whether this product has succeeded: GitHub
knows that source activity happened. Discord knows that people talked. Pods
knows what was promised, what evidence backed delivery, who accepted the
result, who deserves credit, and what's safe to show publicly. If a bot
reposting GitHub activity into a chat could replace Pods, Pods has failed.

## Core Invariant

**A person proves work once. Every authorized surface reuses the same frozen
fact, claim basis, attribution, and visibility ceiling.**

Every doc in this folder — commitments, proof, timelines, discussions — is a
projection of this one invariant, not a separate system with its own notion
of truth.

## The Friction Principle

Pods must never become a new app people have to remember to open. It
succeeds the way GitHub succeeds: you set it up once, and after that it sits
underneath the tools people already use — GitHub, their terminal, their
coding agent — rather than competing with them for attention. Every design
decision in this folder is checked against this: does it ask someone to open
Pods when they wouldn't otherwise need to?

## Actors In Scope For This Slice

- **Project Lead** — creates the Project, owns/administers the linked
  repo(s) (see [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]
  for why this slice is centralized-repo-governance only), assigns or lets
  the team self-assign issues, sets milestone structure.
- **Builder** — gets assigned or self-assigns commitments, proves them via
  GitHub or manual artifact, receives a personal execution timeline and
  shareable profile.
- **Reviewer** — approves/requests changes on proof, via GitHub's own PR
  review mechanism for code, or a minimal Pods-side action for manual proof.

Organizer and multi-project Event/Build Season scope (the aggregate,
cross-project layer) is **not** in this slice — it's named in the broader
workbook and will get its own brainstorm once the single-project loop is
proven. This slice is deliberately one Project at a time.

## Scope Boundary For This Slice

**In — built completely, not stubbed:** GitHub-only auth, GitHub App
install, `pods init` project/repo setup, issue-as-task, commitment via
assignment, PR-as-proof with GitHub-native review, manual-artifact proof
path **with a real reviewer inbox** (not CLI-only — see
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]]),
execution moments, a raw personal timeline, a project-level rollup
timeline, one shareable profile link, GitHub Discussion escalation from
chat, a CLI covering setup/commitments/review/timelines, a real web app
covering every one of the above surfaces (see
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10: Web app screens and UX]]),
and an agent-discoverable manifest convention (AGENTS.md/CLAUDE.md) so
coding agents can participate in the loop.

The rule for what belongs in this list: if a feature is in scope, it gets
its complete, real implementation across whatever surface it actually needs
to be usable — not a CLI stub with the real interface promised for later.

**Out (see [[docs/mainnet-planning/First-Slice/09-open-decisions|09]] for
detail):** Event/Build Season aggregation, organizer console and
marketing-content generation, builder reputation/accountability, the
notification/scheduling service, commit-message-driven auto-classification,
multi-assignee commitments, member-owned repo governance, and tiered
private-evidence configuration — each is genuinely separate scope, not part
of this feature set at all.

Also explicitly out, but for a different reason — these are **enhancements
on top of features that are already complete without them**, not missing
pieces: Playwright-based automatic screenshot capture and before/after
pairing (manual capture is already a fully functional Build Card flow), a
native MCP server (the CLI + AGENTS.md manifest already gives agents the
capability), and real-time WebSocket/SSE sync (one shared database plus
request/refresh is already "in sync" at this scale). None of these are
silently missing — they're named and deferred on purpose, with the reason
stated so the deferral can be challenged later if it turns out to be wrong.

## Build Phasing At A Glance

Full detail in [[docs/mainnet-planning/First-Slice/08-build-phasing-and-launch-plan|08]].

- **Phase 0 — Foundation.** Auth, GitHub App, webhook receiver, minimal data
  model. Nothing user-facing yet.
- **Phase 1 — Complete first slice.** Every "In" capability above, fully
  built across the CLI and the web app: setup, commitment, proof, review
  (including a real reviewer inbox), both timelines, the shareable profile,
  discussion escalation. This is the target for Cycle II — a complete
  product, not a partial one.
- **Phase 2 — Post-v1 enhancements.** Build Card automation, before/after
  pairing, a native MCP server, real-time sync, hardened private-evidence
  tiering. Genuine improvements layered onto an already-complete v1, not
  things v1 is missing.
- **Phase 3 — Cycle III pilot readiness.** Event/Build Season wrapper,
  organizer pulse, event-timeline eligibility plumbing.
