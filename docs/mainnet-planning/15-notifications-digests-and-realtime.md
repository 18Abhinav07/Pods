---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, notifications, digests, realtime, attention, planning]
---

# 15: Notifications, Digests, and Realtime

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|Command contract]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Activity ledger]] |
[[docs/mainnet-planning/14-social-rooms-and-relationships|Social contract]] |
[[HANDOFF]] | [[README]]

## Purpose

Bring the right person back for the next meaningful action without turning
every message, webhook, or projection update into interruption.

## Attention Classes

1. **Required action:** consent, funding, clarification, dispute, review,
   cutoff, transfer exception, ownership recovery, or safety response.
2. **Time-sensitive awareness:** upcoming commitment, evidence deadline,
   roster lock, Event phase, or scheduled announcement.
3. **Outcome:** application decision, proof decision, settlement, payout,
   refund, completion, or invitation result.
4. **Social:** message, reply, reaction, follow, connection, or introduction.
5. **Digest:** grouped Project, Pod, Event, Team, and network progress.

Required actions drive Today and contextual badges. The chronological Updates
history records meaningful outcomes. Messages own conversation unread state.
These surfaces do not duplicate the same item as independent actions.

Relationship, connection, invitation, and message requests are actionable in
Inbox Requests, not Today. Today is reserved for contractual, execution,
review, safety, governance, and financial obligations.

## Notification Record

A notification references source fact, recipient, attention class, context,
safe presentation payload, creation and expiry, delivery preference,
deduplication key, and deep-link destination. It separately records:

- delivery and read state: `unseen`, `seen`, `read`;
- action relevance: `actionable`, `resolved`, `expired`, or `informational`;
- Updates retention state.

Reading a notice never resolves its underlying action. Resolving an action may
remove it from Today while its historical Update remains. A terminal outcome
may become read while remaining permanently available in Updates. The
notification is a projection, not lifecycle authority.

## Prioritization

- Financial safety and expiring participant rights outrank social activity.
- One person sees at most one primary Today action with ordered secondary
  actions.
- Repeated source changes update or replace one notification.
- Room messages aggregate by conversation and quiet period.
- Organizer broadcasts respect Event scope and do not override personal safety
  or financial notices.
- Passive progress becomes a digest unless the person explicitly follows it
  closely.

## Digests

Configurable daily and weekly digests summarize:

- commitments due or completed;
- Project and Pod milestones;
- Event phase and risk changes;
- review and funding exceptions;
- selected following activity;
- room conversations needing a reply.

Digests are generated from authoritative and social projections with direct
links. They never invent completion, ranking, or sentiment.

## Delivery Channels

In-app delivery is canonical. Email, web push, Nimiq Pay capability, Discord,
Telegram, or future channels are optional adapters requiring consent and
validation. Users control channel, context, class, quiet hours, and digest
frequency, except that mandatory in-app contractual and safety records remain
available.

The product never promises push delivery until the exact client and platform
capability has passed a physical validation gate.

## Realtime Contract

- Durable state lives in Postgres-backed sources and projections.
- A sequenced stream may deliver safe invalidations or presentation DTOs.
- Last acknowledged cursor supports replay.
- Clients reconcile on mount, foreground, reconnect, and network recovery.
- Heartbeats and intentional renewal handle hosting connection limits.
- Cursor polling is the accepted fallback when streaming is unavailable.
- Realtime transport never carries private evidence, wallet addresses, secrets,
  or authority decisions not already allowed to the recipient.

## Product Flow

- Today explains the next action and its deadline.
- Updates provides durable status history and deep links.
- Messages contains active conversations and conversation unread state.
  Requests contains pending relationship, invitation, application, friendship,
  and message-request decisions.
- Context headers show only their own unread or action count.
- A notification opens the canonical screen. Opening marks delivery or read
  state, while authoritative resolution independently changes action
  relevance.
- Multi-device read cursors move forward and converge.

## Failure Boundaries

- Delivery failure cannot change source state or deadline.
- Expired action notifications resolve against current state before opening.
- Duplicate delivery is idempotent.
- Missing push permission falls back to in-app and digest behavior.
- Quiet hours delay optional alerts, not source processing.
- Notification overload triggers coalescing and rate controls.
- Youth channel and contact behavior remains constrained by validated policy.

## Interdependencies

Consumes Documents 05, 06, 09 through 14. Documents 17 and 18 define actor
priority. Documents 20 and 22 define external channels and transport.
Document 23 defines abuse, privacy, and operations. Document 24 owns shell
placement and deep links. Document 27 validates Nimiq Pay and hosting behavior.

## Review Findings

- Today, Updates, and Messages have non-overlapping jobs.
- Realtime is an optimization with durable reconciliation.
- Notification delivery is not required for financial or review correctness.
- Digests make large Events observable without message spam.

## Closure Condition

Lock after every source fact maps to one attention class and canonical
destination, transport passes background and replay validation, and quiet-hour
policy cannot suppress required rights or financial safety.
