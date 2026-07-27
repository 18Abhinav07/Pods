---
created: 2026-07-26
project: pods
ecosystem: nimiq
tags: [design, mobile, visual-system, journeys, testnet]
---

# Pods Complete Mobile Visual Redesign

Related: [[PRODUCT]] |
[[DESIGN]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]] |
[[docs/superpowers/specs/2026-07-24-pods-testnet-settlement-amendment]]

## 1. Status and purpose

This specification replaces the current visual prototype with a connected,
mobile-native journey model. It governs the isolated `/design-preview` route
only until visual approval. It does not change production routes, database
state, wallet behavior, settlement math, or the deployed Testnet release.

The existing prototype is visually broad but structurally incomplete:

- screen ownership changes the signed-in actor;
- selected Pods, people, messages, submissions, and transfers are not preserved;
- applications bypass creator acceptance;
- waiting participants can enter a room before roster lock;
- participants can visually advance their own review result;
- refund and settlement reuse one generic confirmed-state composition;
- creator, social, and operations actions are mostly disconnected;
- one large component and several CSS override layers cause regressions.

The redesign must answer four questions on every screen:

1. Who is acting?
2. What authoritative state are they viewing?
3. What single action is valid now?
4. Where does that action lead?

## 2. Current Testnet authority

For newly published proportional Testnet Pods:

- The creator is the sole proof verifier.
- The creator cannot join, fund, submit participant proof, or receive
  participant funds.
- Participant outcomes are exactly `approved`, `rejected`,
  `timeout_protected`, and `missed`.
- Clarification, dispute, appeal, grace, peer voting, and a second reviewer are
  unavailable and must not appear as live actions.
- Creator review inactivity becomes `timeout_protected`.
- Approved outcomes return their own slice and are bonus eligible.
- Timeout-protected outcomes return their own slice and are not bonus eligible.
- Rejected and missed outcomes provisionally forfeit their occurrence slice.
- When an occurrence has no approved member, all provisional forfeitures return
  to their original owners.
- A completed Pod requires every positive payout to be confirmed and every zero
  entitlement to be marked `no_transfer_required`.
- Public visitors can read a room only when the Pod is public and its creator
  enabled read-only visitors.
- Social actions never modify membership, evidence outcomes, deposits,
  settlement, refunds, or payouts.

Existing `full_refund_alpha` Pods remain immutable and use their original
contract behavior.

## 3. Actors

### 3.1 Visitor

A visitor can browse public Pods and profiles, inspect visitor-enabled public
rooms and public proof, begin an application, or open a valid private
invitation. A visitor cannot view private Pod data, member-only proof, or
creator-only evidence.

### 3.2 Applicant

An applicant can submit and track an application. They cannot fund before
acceptance or enter member surfaces.

### 3.3 Accepted member

An accepted member can accept the frozen contract and fund before cutoff. They
do not have a secured place until the transaction is finalized and the cutoff
snapshot includes them.

### 3.4 Funded waiting member

A funded provisional member can inspect funding, cutoff, schedule, and refund
status. They cannot enter the member room before roster lock.

### 3.5 Locked participant

A locked participant can enter the room, complete occurrences, submit proof,
read their own outcomes, inspect settlement, and view the completed archive.

### 3.6 Creator and reviewer

The creator publishes the Pod, manages enrollment, posts room announcements,
reviews proof, triggers settlement when ready, and manages the room archive.
They remain outside participant and financial ledgers.

### 3.7 Social user

A social user manages profile visibility, follows, friendships, requests,
blocks, reports, and direct conversations. Social state never changes Pod or
financial authority.

### 3.8 Operations

Operations reconciles deposit, refund, settlement, payout, and public-safety
exceptions. Operations cannot review ordinary proof or override deterministic
financial outcomes.

## 4. Canonical journeys

Every named state below is independently selectable in the browser companion,
even when production later renders several states on one route.

### 4.1 First entry

```text
Landing
-> Connect wallet
-> Signature waiting
-> Connected | signature error
-> Profile identity
-> Avatar selection
-> Photo source
-> Photo crop and upload
-> Privacy and contact settings
-> Setup complete
-> Today
```

Landing also exposes `Discover Pods` without requiring a wallet.

### 4.2 Public visitor and applicant

```text
Discover
-> Public Pod details
   -> Read-only room, if visitors are enabled
      -> Public proof detail
   -> Application
      -> Application submitted
      -> Awaiting creator decision
         -> Declined | expired
         -> Accepted
            -> Frozen contract
            -> Funding
```

An existing application, acceptance, deposit, roster lock, or completed
relationship replaces `Apply` everywhere with its canonical next action.

### 4.3 Private invitation

```text
Invite preview
-> Frozen contract
   -> Accept invitation -> Funding
   -> Decline invitation
   -> Invalid | expired | revoked | used
```

Unavailable invitation states never disclose private Pod details.

### 4.4 Participant funding

```text
Funding summary
-> Contract consent
-> Wallet confirmation
-> Transaction submitted
-> Chain observed
-> Finalized
-> Credited
-> Waiting for cutoff
-> Roster locked
-> Pod active
```

Required exception variants:

- wallet rejected;
- provider unavailable;
- wrong network;
- transaction not observed;
- missing, duplicated, expired, or mismatched reference;
- underpayment, overpayment, or wrong recipient;
- accepted but cutoff passed;
- capacity exclusion;
- Pod below minimum;
- refund required.

### 4.5 Refund

```text
Refund reason
-> Refund queued
-> Transfer prepared
-> Transfer submitted
-> Confirming
-> Refund confirmed
```

Exception variants:

- unknown broadcast;
- delayed;
- retryable failure;
- mismatch;
- manual review.

A confirmed refund no longer displays the earlier funding rail as incomplete.

### 4.6 Participant activity

The Pod room is the central activity surface.

```text
Today
-> Pod room
-> Current occurrence action
```

Build and Ship and Practice and Create:

```text
Lock commitment
-> Choose proof format
-> Add result, artifact, image, and visibility
-> Review submission
-> Submit
-> Creator reviewing
-> Approved | rejected | timeout protected | missed
-> Next occurrence
```

Fitness, Reading, and Study:

```text
Current occurrence
-> Template-specific evidence editor
-> Add image and visibility
-> Review submission
-> Submit
-> Creator reviewing
-> Approved | rejected | timeout protected | missed
-> Next occurrence
```

The activity message updates in place through commitment, proof, review, and
terminal outcome. It is never duplicated as a new room item.

The room context sheet exposes proof history, members, frozen contract,
sharing, and creator controls when authorized.

### 4.7 Participant completion

```text
Last occurrence closes
-> Final review
-> Settlement calculated
-> Payout queued
-> Payout prepared
-> Payout submitted
-> Confirming
-> Paid
-> Completed Pod archive
```

Required variants:

- zero-recipient restoration;
- no transfer required;
- payout delayed;
- payout under operations review;
- retryable failure.

The archive is read-only, removes the composer, preserves room history, and
links to the settlement or refund receipt.

### 4.8 Creator creation and enrollment

```text
Choose template
-> Configure activity
-> Configure community
-> Set NIM commitment
-> Review frozen contract
-> Publishing
-> Published successfully
-> Creator command center
```

Public enrollment:

```text
Applications
-> Applicant profile and motivation
-> Accept | decline
-> Decision confirmation
-> Funding overview
-> Cutoff and roster lock
```

Private enrollment:

```text
Invitation management
-> Create | copy | revoke | replace invitation
-> Funding overview
-> Cutoff and roster lock
```

### 4.9 Creator activity and completion

```text
Active room
-> Review queue
-> Member proof
   -> Approve
   -> Reject with reason
-> Decision confirmation
-> Final review
-> Ready to finalize
-> Settlement calculating
-> Payouts processing
   -> Completed
   -> Blocked for operations
-> Room archive controls
```

The creator sees participant handles and aggregate conservation, never wallet
addresses, treasury keys, or payout discretion.

### 4.10 Social

```text
Private profile
-> Edit identity or avatar
-> People search
-> Public profile
-> Follow | friend request
-> Requests
-> Accept | decline
-> Messages
-> Direct conversation
```

Required variants:

- search guidance before two characters;
- empty search;
- private profile;
- unknown profile;
- blocked user;
- pending friend request;
- discarded message request;
- failed send;
- unavailable reply target.

Primary request decisions are never hidden inside an unexplained overflow
control.

### 4.11 Operations

```text
Transfer queue
-> Transfer detail
-> Fresh chain lookup
   -> Confirmed
   -> Retryable failure
   -> Mismatched
   -> Late
   -> Manual review
-> Replacement attempt, only when permitted
-> Confirmed resolution
```

The browser companion also includes deposit reconciliation, refund recovery,
settlement invariant incidents, freeze controls, and public-safety detail.

## 5. Navigation and state architecture

### 5.1 Persistent actor identity

Bottom navigation changes destinations, not the signed-in actor. A participant
who opens Discover remains the same participant and continues seeing their
relationship with every Pod.

### 5.2 Selected entity identity

The preview state persists:

- selected Pod;
- selected person;
- selected application;
- selected occurrence;
- selected submission;
- selected conversation;
- selected transfer.

Opening a list item must show that exact entity on the destination screen.

### 5.3 Transition registry

Every interactive action is declared in a typed transition registry containing:

- source screen;
- action ID;
- destination screen;
- allowed actors;
- state guard;
- optional state mutation within the visual-only scenario.

No screen may navigate by finding whichever actor happens to own a destination.

### 5.4 Browser companion

The desktop companion groups journeys by actor. Mobile displays a compact
journey and state switcher above the device surface. Both allow happy-path and
exception states to be inspected without mutating production data.

Current database projections are used where safe. Missing lifecycle branches
use deterministic fixtures with realistic names and amounts.

## 6. Visual direction

### 6.1 Physical scene

A participant opens Pods one-handed inside Nimiq Pay, often while moving
between tasks or sharing progress with a small group. The interface must feel
bright, assured, kinetic, and immediately legible under normal daylight.

### 6.2 Theme

The landing is the one committed off-black entry moment. Authenticated and
financial surfaces use a visually white mobile shell. There is no global beige
or warm washed overlay.

Core colors:

| Role | Value |
|---|---|
| Canvas | `#F8F9F5` |
| Raised surface | `#FEFFF9` |
| Soft control surface | `#F1F3EF` |
| Ink | `#1D211D` |
| Muted text | `#687069` |
| Momentum lime | `#D9ED72` |
| Soft lime | `#F1F7CF` |
| Verified | `#2A725B` |
| Pending | `#A36C24` |
| Destructive | `#A34A42` |

Activity accents:

| Template | Accent |
|---|---|
| Build and Ship | `#D9ED72` |
| Fitness and Movement | `#F2A84A` |
| Reading | `#D9A6B8` |
| Study and Focus | `#69BDB2` |
| Practice and Create | `#82ABD4` |

Activity accents apply to media, occurrence progress, proof identity, and
contextual selection. They never recolor global navigation, wallet,
settlement, refunds, or operations.

### 6.3 Typography

Mulish Variable remains the product family. Fira Mono is reserved for compact
financial and occurrence metadata.

| Role | Size and leading |
|---|---|
| Outcome display | 40px / 40px |
| Screen heading | 30px / 31px |
| Section heading | 22px / 25px |
| Card title | 16px / 21px |
| Body | 14px / 20px |
| Supporting | 12px / 17px |
| Metadata | 10px / 13px |

Input, textarea, and selectable form values remain at least 16px to prevent
iOS focus zoom.

### 6.4 Spacing

| Token | Value |
|---|---|
| Screen inset | 20px |
| Micro gap | 6px |
| Control gap | 12px |
| Card gap | 14px |
| Card padding | 18px |
| Content group | 24px |
| Section break | 32px |
| Hero break | 40px |
| Card to action dock | At least 24px |
| Action stack | 12px |
| Scroll clearance with dock | At least 116px |

No two raised cards touch. No raised card touches a fixed action dock.

### 6.5 Shape and elevation

| Surface | Radius |
|---|---|
| Featured media | 30px |
| Decision and financial card | 22px |
| Standard row | 18px |
| Input and button | 16px |
| Status pill | Full |

Raised cards use a diffuse, tinted shadow:

```css
0 18px 48px -24px rgba(29, 33, 29, 0.20),
0 5px 14px -10px rgba(29, 33, 29, 0.12)
```

Static text groups use negative space rather than unnecessary cards. Nested
cards and visible separator-line layouts are forbidden.

## 7. Component behavior

### 7.1 Choice indicators

Unselected choices use a 28px recessed neutral circle. Selected choices use a
lime circle with an ink check. No unselected choice is a filled black circle.

### 7.2 Switches

Switches use a conventional 52 by 32 pixel track with a visible thumb. The
visitor switch appears only when Public Pod is selected.

### 7.3 Requests

Message introductions show identity, shared-Pod context, the introduction, and
explicit Accept and Decline actions. Block and report is a labeled tertiary
action.

Friend requests use explicit Accept and Decline controls. Unexplained overflow
buttons are removed.

### 7.4 NIM medallion and receipts

The commitment, refund, and settlement experiences use the official Nimiq
signet from the public `nimiq/designs` repository. The app never invents a
substitute mark.

The commitment receipt reads:

```text
3 occurrences x 0.1 NIM
Maximum upfront: 0.3 NIM
```

Settlement explanation is progressively disclosed through `How settlement
works`.

### 7.5 Publish review

Publish review uses selected template media, one contract receipt, a separate
soft-lime consent panel, and a disabled Publish action until consent is
selected. Publishing and published-success are explicit states before the
creator command center.

### 7.6 Financial afterstates

Every money screen shows:

1. amount;
2. reason;
3. current transfer state;
4. required user action, if any;
5. transaction hash only after it exists.

Funding, refund, settlement, and operations never reuse one generic
composition.

## 8. Motion

Motion communicates navigation, selection, upload, transfer progression, or
completion.

| Interaction | Duration |
|---|---|
| Screen transition | 320ms |
| Selection | 220ms |
| Press feedback | 140ms |
| Bottom sheet | 280ms |
| State progression | 420ms |
| NIM value response | 260ms |
| Settlement completion | 520ms |

Movement uses opacity and transform with exponential easing. Reduced-motion
mode preserves state changes without movement. No perpetual animation runs on
utility, financial, or operations screens.

The entry media may drift by 3 to 5 pixels because it communicates the activity
constellation. It stops under reduced motion.

## 9. Required reusable primitives

- `ChoiceCard`
- `ChoiceIndicator`
- `SwitchRow`
- `ActionDock`
- `ActionGroup`
- `RequestCard`
- `NimMedallion`
- `FinancialReceipt`
- `TransferTracker`
- `OutcomeStrip`
- `ConsentPanel`
- `TerminalOutcome`
- `UploadAvatarTile`
- `ScreenHeader`
- `JourneySwitcher`

## 10. Responsive contract

Pods is fluid across 320px to 430px CSS portrait widths. The layout is never
hardcoded for one device.

Representative validation viewports:

- 320 by 568;
- 360 by 800;
- 375 by 667;
- 390 by 844;
- 412 by 915;
- 430 by 932.

Additional checks:

- keyboard-open forms, proof editors, and composers;
- zero, 20px, and 34px bottom safe-area variants;
- 100%, 115%, and 125% text scaling;
- functional landscape fallback;
- Mobile Safari and Android Chromium.

Headers, composers, and action docks remain reachable when the available
height changes. Content scrolls inside the mobile screen rather than expanding
the whole preview document.

## 11. Accessibility

- Every action has a 44 by 44 pixel minimum target.
- All controls use semantic buttons, inputs, radios, switches, and headings.
- State never depends on color alone.
- Focus remains visible.
- Decision outcomes are announced through accessible live regions.
- Loading uses layout-matched skeletons.
- Error copy explains recovery.
- Pinch zoom remains available.

## 12. Visual acceptance gate

At every representative viewport:

- no horizontal overflow;
- no visible separator-line layouts;
- no card gap below 14px;
- no card-to-action gap below 24px;
- no explanatory text below 12px;
- no form value below 16px;
- no black unselected choice indicators;
- no hidden primary decision;
- no fixed-dock overlap;
- no screen with more than one dominant CTA;
- no repeated eyebrow, heading, and body sentence;
- no incorrect actor or selected entity after navigation;
- no applicant bypassing acceptance;
- no waiting member entering the locked room;
- no participant advancing their own review outcome;
- every terminal activity state is visible;
- every money state shows amount, reason, status, and next action;
- every terminal participant state links to My Pods or the room archive;
- every state remains understandable without color or motion.

## 13. Implementation boundary

The visual prototype is complete only after:

- all canonical journeys and required variants are selectable;
- all in-prototype actions follow the transition registry;
- responsive browser checks pass across the full device matrix;
- specification and code-quality reviews have no open Critical or Important
  findings;
- the user approves the browser prototype.

Production route migration, deployment, database mutation, wallet actions, and
Mainnet behavior remain outside this visual-only implementation.
