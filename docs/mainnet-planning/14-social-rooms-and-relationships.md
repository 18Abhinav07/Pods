---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, rooms, messaging, relationships, moderation, planning]
---

# 14: Social Rooms and Relationships

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Activity ledger]] |
[[docs/mainnet-planning/13-passports-reputation-and-discovery|Passports]] |
[[HANDOFF]] | [[README]]

## Purpose

Provide conversation and connection around real execution without letting chat
become the Project plan, proof store, membership ledger, or financial source of
truth.

## Context Rooms

Default room ownership is deliberately sparse:

| Context | Initial social surface |
|---|---|
| Organization | official broadcast only |
| Team | durable Team room |
| Event | official broadcast and bounded questions |
| EventEntry | no primary room; consumes Event broadcast and Project workspace |
| Project | optional contributor workspace where the Project needs it |
| Pod | focused execution room |

A context with a room owns at most one primary room. A room contains:

- human messages and replies;
- fixed support reactions;
- role-attributed announcements;
- projected ActivityCards referencing Document 12;
- pinned context and official links;
- read cursors, moderation, and archive state.

Messages never create commitments, approve proof, change roles, reserve seats,
or move money. An action initiated from a message opens the authoritative
workflow and later projects the resulting fact back into the room.

## Clean Information Model

Context capabilities are optional rather than five mandatory tabs:

- **Overview:** purpose, current phase, people, and one primary action;
- **Activity:** authoritative milestones and work entries;
- **Room:** conversation around the work;
- **People:** roster and contextual roles;
- **Contract or Rules:** frozen terms and financial status where applicable.

Work is the inventory. Object homes own detail. A small Pod may expose one
compact room with an occurrence strip and context sheet instead of persistent
Overview, Activity, People, and Contract tabs. Separate routes appear only
when the protocol and information density justify them.

ActivityCards remain stable and update in place. Filters can show all
conversation, official announcements, or activity without copying entries.
Daily or phase summaries collapse routine noise.

An author may deliberately convert their own eligible message into a
NarrativeUpdate. A lead cannot republish another person's ordinary chat as a
public progress update.

## Room Access

- Active relationships receive the access declared by the source contract.
- Applicants, invitees, provisionally accepted people, visitors, and former
  participants each receive distinct projections.
- Visitor rooms exist only through an explicit frozen visitor policy and show
  official announcements, explicitly public activity, artifacts, and authored
  NarrativeUpdates. Ordinary member chat is not exposed by default.
- Private proof, reviewer evidence, hidden members, financial details, and
  internal moderation never enter visitor DTOs.
- Leaving or removal ends new optional access while preserving access required
  for disputes, receipts, or settlement through dedicated surfaces.

## Relationships

- Follow is one-way and requires an eligible public profile.
- Connection or friendship is mutual and requires acceptance.
- Shared context is not friendship.
- Direct messages follow the recipient's policy.
- Non-connections may send one bounded introduction when permitted.
- Blocking removes follow, pending person-to-person social requests, optional
  DMs, and reactions without changing shared contractual state.
- Blocking prevents future person-to-person targeting. It does not revoke an
  Organization, Team, Event, Project, or Pod invitation issued under
  contextual authority. That requires an explicit issuer or policy
  `RevokeInvitation` command and a named fact.
- Friend and follower lists are private by default.

## Direct Messages

Accepted connections can start direct conversation. Non-connection requests
show a safe identity, shared context, and plain-text introduction before
acceptance. Media, links, presence, and read receipts remain unavailable to
the sender until acceptance.

Pods does not claim end-to-end encryption in the initial product. Product copy
states the actual privacy and moderation model.

## Content and Moderation

Supported initial content is text, safe links, sanitized images, approved GIF
references, and safe downloadable documents. Domain evidence uses the proof
system rather than ordinary chat upload.

Moderation can hide ordinary messages with a visible tombstone, restrict
contact, suspend a public room projection, and process reports. It cannot hide
authoritative ActivityCards, review outcomes, contracts, settlements, or audit
history from entitled viewers.

Creator and organizer announcements are visually distinct but do not gain
authority beyond the actor's role. Pinning changes prominence, not truth.

## Room Lifecycle

```text
active -> restricted | read_only
restricted -> active | read_only
read_only -> active
active | restricted | read_only -> archived
```

`read_only` is reversible only while the source context remains active and its
contract permits reopening. `archived` is terminal and follows source-context
archival. If the source object later follows a valid reactivation transition,
Pods creates a successor active room linked to the immutable archived room; it
does not reopen or mutate the archived lifecycle. Frozen activity and financial
history never changes. Public moderation suspension is independent from the
authoritative room.

## Product Flow

- A person enters a context through Overview, then chooses Activity or Room
  based on intent.
- A Pod room keeps the composer fixed and lightweight while the current
  occurrence appears as a compact action strip.
- Long press or an accessible action control opens reply, reaction, copy, and
  report options.
- Clicking an ActivityCard opens the exact commitment, proof, review, or
  settlement surface.
- Search and relationship actions live with profiles rather than cluttering
  Event or Pod discovery.

## Failure and Abuse Boundaries

- Optimistic messages use client idempotency IDs and visible retry state.
- Reconnect reconciles from durable cursors.
- Hidden or deleted reply targets render safe tombstones.
- Blocking is transactional across optional social relationships.
- Rate limits, report tools, media scanning, and safe previews apply before
  broad distribution.
- Social outages never block proof, Event progression, refund, or settlement.

## Interdependencies

Consumes Documents 02 through 06 and 12 through 13. Document 15 owns delivery
and unread behavior. Documents 16 through 18 specify Build and Ship context.
Documents 20, 22, 23, and 24 own external sharing, transport, moderation
operations, and routes.

## Review Findings

- Conversation and authoritative activity have separate destinations.
- Pods can feel collaborative without becoming another generic messenger.
- Visitors can observe building in public without gaining member powers.
- Social safety cannot corrupt contractual outcomes.

## Closure Condition

Lock after every object defines its room audience, ActivityCard projection,
archive behavior, contact policy, moderation boundary, and social failure
isolation.
