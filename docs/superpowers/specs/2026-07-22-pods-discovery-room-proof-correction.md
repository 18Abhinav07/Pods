---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [spec, mobile-ux, discovery, pod-room, proof]
---

# Pods Discovery, Room, and Proof Correction

Related: [[2026-07-22-pods-chat-first-redesign]] | [[../plans/2026-07-22-pods-discovery-room-proof-correction]] | [[../../../HANDOFF]]

This amendment records the July 22 correction approved by Abhinav after the chat-first browser review. It narrows discovery, fixes mobile room geometry, and makes recurring proof work legible without changing the frozen Pod contract, evidence authority, financial state, or review rules.

## Discover ownership

- Discover lists public Pods only. Private Pods remain reachable only through a valid invitation.
- Every public Pod still requires an application and creator acceptance. Public means discoverable, not instant admission.
- People and Following no longer appear as Discover segments.
- A visitor Pod card uses one circular arrow control at the lower-right of its media. It opens the public Pod preview where the participant reviews the rules before applying.
- A user with an existing relationship sees the same compact relationship state and destination everywhere. The interface never offers Apply again after an application exists.

## People ownership

- Authenticated global chrome places a people-search control immediately before Updates.
- People search is query-first and returns no directory before the participant enters at least two characters.
- Following and Friends belong to the private Profile surface. They do not turn Discover into a global member directory.
- Public profile DTOs continue to omit wallet identity, private Pods, private proof, and financial data.

## Pod room geometry

- A Pod room has no redundant back button in its header. Global navigation and direct route ownership provide escape paths.
- The composer is fixed to the true WebView bottom, spans the available app width, and includes safe-area padding.
- The send control is visually distinct in enabled, disabled, sending, and failed states.
- Message actions remain in long-press and the accessible More sheet. They do not return as permanent controls inside every message.

## Proof history

- Proof history identifies the participant who submitted each item with avatar, display name, and public handle.
- The screen does not repeat the Pod name or generic phase copy already established by the room.
- A member search and All or Mine scope replace a 500-person chip row.
- Results are paginated. The initial page is bounded and the server filters by public handle or display name.
- The group-safe proof projection may include the locked task, result summary, public artifact, review state, and Pod-shared attachments. Reviewer-only evidence remains inaccessible.

## Recurring proof action

The room presents exactly one occurrence action derived from the frozen schedule and authoritative submission state:

1. Lock commitment when the current occurrence is open and no commitment exists.
2. Add proof when a commitment exists and no evidence draft exists.
3. Continue proof when a draft exists.
4. View submission after evidence is submitted.
5. Next occurrence opens when the current occurrence is complete and a future occurrence exists.
6. Schedule complete when no current or future occurrence remains.

The strip shows occurrence progress, for example 3 of 12. Proof cannot be created before an occurrence opens. A one-occurrence Pod correctly ends at Schedule complete. Frozen occurrence counts are never rewritten to make a demo look recurring.

## Acceptance

- The same signed-in profile renders the same avatar signal on Discover and authenticated routes.
- Discover contains no People or Following segment and does not eagerly load all profiles.
- The public and private Pod distinction remains understandable.
- The room composer touches the safe-area bottom and its send control is readable.
- Proof history remains usable with hundreds of members without exposing private evidence.
- A participant can tell whether to lock, add, continue, view, wait, or stop from one occurrence action.
