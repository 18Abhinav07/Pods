---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, activity-ledger, timelines, shareables, planning]
---

# 12: Activity Ledger, Timelines, and Shareables

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/02-profile-facets-and-privacy|Profile contract]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Turn authoritative work into an observable journey without turning every chat
message, webhook, reaction, or repeated projection into activity.

## Activity Ledger

Domain facts remain immutable. An `ActivityEntryVersion` is an immutable
source mapping that records how one or more facts contribute to a narrative
unit at one projection version. It contains:

- stable entry and source-fact IDs;
- actor, subject, context, protocol, and activity type;
- effective and recorded times;
- concise title, structured summary, artifact references, and outcome;
- verification and claim basis;
- source visibility and allowed projection scopes;
- supersession and correction references.

Eligible types include membership and role milestones, commitment locks,
submitted or approved work, protected or missed participant occurrences, Project
milestones, releases, deployments, Event phases, awards, settlement, and
completion.

Chat, reactions, follows, profile edits, raw provider events, draft evidence,
and routine worker transitions do not enter the public activity ledger.

`ActivityMoment` is the rebuildable current projection. It has a stable ID,
source cursor, current presentation, moderation state, and eligible share
state. Corrections create a new ActivityEntryVersion and rebuild the moment
without deleting prior audit history.

Related entry versions may render through one stable ActivityMoment. A
ParticipantOccurrence moment updates in place from commitment through proof
and terminal outcome instead of producing a new card for every transition.
Shared Occurrence projections aggregate those participant moments without
inventing one group outcome. Project and Event milestones use the same rule.

A NarrativeUpdate may add authored context around referenced facts or
artifacts but cannot change their outcome. A PublicationGrant records who
selected eligible material for one audience.

## Contextual Timelines

One entry may appear through allowlisted projections on:

- a person's private history;
- a facet-specific public passport;
- a Team history;
- a Project build journey;
- a participant's Pod occurrence trail or an authorized group aggregate;
- an Event program timeline;
- an EventEntry story;
- a public showcase or external share.

The source fact remains singular. Each projection applies its own audience,
ordering, wording, and privacy ceiling.

## Timeline Rules

1. Entries use effective time for chronology and recorded time for audit.
2. Duplicate provider events and repeated projections cannot create duplicate
   milestones.
3. Corrections supersede presentation while preserving source history.
4. Rejected or missed work is private by default and never becomes punitive
   public display.
5. Timeout-protected and grace outcomes remain distinguishable from approved.
6. Public timelines include only subject-approved artifacts and safe outcome
   language.
7. A dense period may collapse routine entries into an explainable summary,
   but users can inspect the underlying entries they are entitled to view.
8. Filters cover phase, actor, activity type, Project, Pod, Event, and
   verification basis.
9. A Project journey favors milestones and shipped artifacts over message
   volume.
10. Archived contexts remain readable under their final visibility policy.
11. One lifecycle unit produces one primary moment that updates in place.
12. Narrative text is visibly separated from verified facts.

## Shareable Snapshot

A ShareableSnapshot freezes:

- selected ActivityEntries and current safe Project, Pod, Event, or person
  summary;
- exact visibility and contributor approvals;
- design template and locale;
- canonical Pods link and snapshot version;
- expiry or revocation policy where supported.

Outputs may include an image card, deep link, public page, embed, or structured
export. Wallet addresses, deposit amounts, private Pod names, reviewer
evidence, raw location, private repository details, and hidden collaborators
are excluded by default.

External posts are user or authorized organizer initiated. Pods records that a
snapshot was shared, not that an external platform still hosts or deleted it.
Turning visibility off prevents future Pods views but cannot recall already
published external copies.

## Narrative Products

- **Builder timeline:** evidence-backed work across Projects and Events,
  filtered by facet.
- **Project build journey:** commitments, artifacts, milestones, releases,
  contributors, and Event results.
- **Pod trail:** shared schedule windows with exact participant outcomes for
  the authorized audience.
- **Event pulse:** curated aggregate progress and official milestones.
- **Judge or sponsor packet:** frozen public-safe Project and Event evidence.

No narrative uses generated claims that lack source references.

## Product Flow

1. A source fact creates an ActivityEntryVersion and creates or updates one
   stable ActivityMoment.
2. The actor sees its private projection and available visibility choices.
3. An eligible entry can be added to a Project story, passport, Event
   showcase, or share snapshot.
4. Viewers can inspect claim basis without receiving private evidence.
5. A correction updates every projection through the same source reference.

## Failure and Abuse Boundaries

- Projection lag shows last-updated state and reconciles from facts.
- A failed share render does not change public consent.
- Removed or unsafe public media becomes a tombstone, not a rewritten outcome.
- Repeated low-value activity is rate-limited and collapsed.
- Search engines receive only deliberately public snapshots.
- Share URLs use opaque public IDs rather than private object identifiers where
  existence is sensitive.

## Interdependencies

Consumes Documents 02, 05, 06, and lifecycle facts from 07 through 11.
Document 13 derives passports and reputation. Document 14 embeds activity
cards in rooms. Document 15 distributes attention. Documents 16 through 20
define domain and external presentation. Documents 22 and 24 own projections
and routes.

## Review Findings

- The timeline is an authoritative activity projection, not another chat feed.
- One fact can support many audiences without copied truth.
- Public failure history is not used as humiliation.
- Shareables remain a distribution funnel with explicit provenance.

## Closure Condition

Lock when every lifecycle names its eligible ActivityEntryVersion types, Document 13
uses only terminal entries, and Documents 14 and 20 preserve the source
visibility ceiling.
