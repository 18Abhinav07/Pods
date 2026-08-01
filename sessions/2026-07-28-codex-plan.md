---
created: 2026-07-28
project: pods
ecosystem: full-stack
tags: [session, codex, plan]
---

# 2026-07-28 Mainnet Planning Foundation

Related: [[HANDOFF]] | [[sessions/INDEX|Session index]] |
[[docs/mainnet-planning/01-person-account-and-identity|Identity contract]]

## Completed

- Locked one opaque Pods person independent of providers, wallets, chains, and
  settlement adapters.
- Locked Google and GitHub as equal account-entry methods with settings-only
  secondary linking and no initial account merging.
- Locked username, recovery-code, account-lifecycle, deletion, session,
  provider-scope, and duplicate-prevention behavior.
- Locked youth participation from the applicable age floor of at least 13,
  subject to provider and jurisdiction requirements.
- Separated youth collaboration from financial eligibility. Youth accounts
  cannot fund, receive redistributed value, or administer funded structures in
  the initial Mainnet product.
- Added authoritative compliance evidence and explicit later validation gates.
- Added neutral account-age screening, versioned product consent, and a
  separate adult financial-activation receipt with escalation to stronger
  assurance when required.
- Locked the profile contract with structured facet attributes, managed
  taxonomies, matching intent, explainable matching, discovery consent, and
  youth-safe contextual matching.
- Locked the actor and role contract with contextual role grants, explicit
  separation of duties, collective representation, service actors, and 52
  approved decisions.

## Decisions

- Document 01 is closed and marked `locked`.
- Guardian supervision enables eligible non-financial youth participation but
  does not grant contractual or financial capacity.
- Account merging remains documented future scope rather than a partial
  initial linking flow.

## In Progress

- Document 04 is active with a 60-decision object, typed-relationship,
  ownership, membership, enrollment, capacity, exit, and continuity bundle
  awaiting approval or numbered amendments.

## Errors

- None.

## Package Completion Checkpoint

### Completed

- Locked the six canonical product objects and typed relationship model in
  Document 04.
- Drafted Documents 05 through 27 as one dependency-ordered candidate covering
  access, commands, lifecycles, proof, economics, activity, reputation, social
  systems, Build and Ship, operations, integrations, data, security, routes,
  environments, architecture, and validation.
- Added an indexed dependency map and canonical end-to-end product flow.
- Reconciled review findings across ProofCase creation, PodParticipation draft
  and cancellation states, economic-mode-specific outcomes, milestone command
  reachability, actor destinations, provider attribution, distribution
  receipts, and release validation.
- Kept Documents 05 through 27 in `review`; autonomous drafting and internal
  audit did not convert candidate scope into product authority.

### Decisions

- The Mainnet package is a reviewed candidate, not empirical validation.
- No implementation plan may be written before the selected slice's required
  validation spikes record PASS.
- Google, GitHub, Nimiq, wallets, and future settlement rails remain adapters
  to canonical identity and domain state.

### In Progress

- Reconcile Abhinav's product plan against the candidate package, select a
  coherent Mainnet v1 slice, and validate only the dependencies that slice
  requires.

### Errors

- One delegated audit run became unresponsive and was stopped. Completed audit
  findings were independently checked and reconciled locally; no document or
  Git operation depended on the stalled process.

## First Launch Slice Workbook

### Completed

- Researched the official Devpost, DoraHacks, HackQuest, GitHub, Linear,
  WakaTime, and Nimiq community product surfaces relevant to the first launch.
- Selected a recommended market wedge: Pods as the execution layer used during
  a Build Season, not a replacement hackathon platform, generic task manager,
  or static builder portfolio.
- Drafted
  [[docs/mainnet-planning/first-launch-slice-workbook|First Launch Slice Decision Workbook]]
  with the complete builder, Project lead, organizer, reviewer, and visitor
  journeys.
- Defined the recommended Execution Moment, Project Journey, Execution
  Profile, organizer console, GitHub observation, review, distribution,
  privacy, attribution, and optional-economic boundaries.
- Added 30 explicit product choices with one recommendation each so Abhinav
  can review the complete slice in one pass.
- Mapped the proposed slice to Documents 01 through 27 and retained the
  architecture and validation gates before implementation planning.

### Decisions

- No new product decision was locked. The workbook is an editable proposal for
  Abhinav's review.

### In Progress

- Abhinav reviews and edits the workbook, especially Sections 29 and 30.

### Errors

- None.

## Product Flow Diagram

### Completed

- Created
  [[docs/mainnet-planning/diagrams/pods-first-launch-product-flow|Pods First Launch Product Flow]]
  as an editable Excalidraw source with a rendered PNG companion.
- Mapped the canonical execution graph, identity and consent entry, GitHub,
  CLI, MCP, web, private-source review, controlled-NIM boundary, and derived
  Project, person, Event, and public projections.
- Added sequential action lanes for Organizer, Project Lead, Builder,
  Reviewer, and Visitor or Judge.
- Added screen-level route wireframes for the normal builder loop and the
  Project, review, organizer, and public surfaces.
- Linked the visual from the planning index and the launch workbook.

### Decisions

- The visual is a proposal companion to the workbook, not an implementation
  plan or a silent lock of candidate Mainnet decisions.
- Chat may reference work, but commitment, review, credit, and visibility
  remain owned by canonical action surfaces.

### In Progress

- Abhinav reviews the visual and workbook together before reconciliation.

### Errors

- One section-render command used a workspace-relative source path from the
  renderer directory and failed. Re-running with the absolute source path
  succeeded; no source or render defect was involved.

## Developer-Native Product Identity Revision

### Completed

- Integrated Abhinav's requirement that public and private repositories both
  support source-backed proof.
- Verified selected-repository GitHub App access, fine-grained permissions,
  short-lived installation tokens, issue assignment constraints, webhook
  capabilities, and MCP authorization from official sources.
- Reframed Pods as the portable execution record for collaborative building,
  with Build Seasons as the first packaged wedge rather than the permanent
  product identity.
- Added the GitHub issue assignment to accepted-commitment bridge with frozen
  snapshots and explicit builder acceptance.
- Added a required Pods CLI and an opt-in MCP beta over one headless execution
  API.
- Added dual-key private-source review, protected private media, and
  public-safe private-evidence claims.
- Added routine, highlight-candidate, milestone-linked, and system-event
  timeline treatment so profiles and Project Journeys do not become commit
  walls.
- Changed Nimiq sequencing to Cycle II build and dogfood, followed by a
  candidate complete Cycle III cohort.
- Expanded the decision workbook from 30 to 40 explicit decisions and captured
  Abhinav's additions and corrections in the same document.

### Decisions

- GitHub tasks remain GitHub issues. Pods observes eligible assignments and
  creates proposals; the builder must accept a frozen snapshot before a
  commitment exists.
- The first integration is read-oriented. Pods does not write issues, labels,
  comments, or repository status in the initial launch.
- CLI is a first-launch interface. MCP is an opt-in beta after the CLI command
  contract stabilizes.
- MCP mutations use server-side prepare-confirm and exclude review, public
  publishing, membership, permission, and financial actions initially.
- Private raw source requires both Pods ProofCase authority and GitHub
  repository entitlement.
- Timeline prominence is curated presentation over immutable proof facts, not
  a self-awarded canonical label.

### In Progress

- Abhinav reviews Sections 29 and 30 of the revised workbook.

### Errors

- None.
