---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, information-architecture, routes, navigation, mobile, planning]
---

# 24: Product Information Architecture and Routes

Status: review

Related: [[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/18-participant-project-and-visitor-journeys|Actor journeys]] |
[[docs/mainnet-planning/22-data-services-and-background-processing|Service architecture]] |
[[docs/mainnet-planning/25-mainnet-testnet-and-release-topology|Release topology]] |
[[HANDOFF]] | [[README]]

## Purpose

Translate the approved object graph and actor journeys into a mobile-first
information architecture where each intent has one canonical destination,
private resources never leak through routing, and the product remains usable
as Pods grows beyond a Pod-only Testnet application.

## Navigation Contract

Authenticated mobile navigation has four primary destinations:

1. **Today:** prioritized actions and deadlines.
2. **Work:** Organizations, Teams, Events, personal Event entries, Projects,
   and Pods the person owns, represents, contributes to, or participates in.
3. **Discover:** eligible public Events, Projects, Pods, and query-driven
   people discovery.
4. **Inbox:** Messages, Requests, and Updates as distinct segments.

The header avatar owns Profile and Settings. Contextual creation appears from
Work, Discover, or an object workspace rather than as a permanent fifth tab.

This combines the earlier Messages and Updates destinations into one
navigation owner without combining their data:

- Messages owns conversations.
- Requests owns actionable invitations, applications, friendship requests, and
  message requests.
- Updates owns terminal decisions and historical notifications, including
  accepted, declined, expired, cancelled, and completed request outcomes.
- Today may project an urgent contractual requirement created after acceptance,
  such as consent, funding, clarification, proof, or a deadline action. It does
  not surface social requests, invitations, application decisions, friendship
  requests, or message requests.

## Destination Responsibilities

| Destination | Question answered | Must not become |
|---|---|---|
| Today | What needs me now? | full object inventory or notification history |
| Work | Where do I belong and what am I building? | public discovery or social inbox |
| Discover | What eligible opportunity or person can I find? | global member directory |
| Inbox | Who or what is asking for attention? | duplicate action execution surface |
| Profile | Who am I and what do I choose to show? | wallet or raw audit screen |
| Object overview | What is this and what is its current state? | room or activity log |
| Activity | What authoritative progress happened? | chat transcript |
| Room | What are people discussing? | proof, review, or finance authority |
| Contract | What was agreed and frozen? | editable settings |
| Settlement | What value is owed and what is its transfer state? | generic object overview |
| Operations | Which authorized exception needs intervention? | universal admin console |

## Public Routes

```text
/
/discover
/u/:username
/events/:slug
/projects/:slug
/pods/:slug
/s/:shareableToken
/invite/:opaqueToken
```

Rules:

- public slugs resolve to opaque IDs;
- mutations use opaque IDs, not mutable slugs;
- username aliases redirect through current profile privacy;
- no public Team or Organization directory in initial Mainnet;
- a public Pod page is a safe public projection, never a participant page with
  controls hidden;
- private, unknown, deleted, and unauthorized resources follow Document 05's
  disclosure policy;
- page metadata and unfurls use the same public authorization as page content.
- an invitation token reveals only the minimum safe invitation preview and
  returns the same safe unavailable state for invalid, expired, revoked, used,
  or unauthorized tokens;
- accepting or declining an invitation requires authentication and resumes at
  the exact invitation after onboarding.

## Authentication and Onboarding Routes

```text
/auth/sign-in
/auth/callback/:provider
/onboarding/identity
/onboarding/profile
/onboarding/consent
/onboarding/complete
/account/recovery
```

Deep links preserve the intended safe destination across sign-in and
onboarding. Financial activation is not part of basic onboarding and appears
only at the first eligible financial action.

## Main Application Routes

```text
/app/today
/app/work
/app/discover
/app/inbox/messages
/app/inbox/messages/:conversationId
/app/inbox/requests
/app/inbox/requests/:requestId
/app/inbox/updates
/app/profile
/app/people/:personId
/app/settings/account
/app/settings/privacy
/app/settings/connections
/app/settings/notifications
/app/settings/security
/app/settings/financial
```

`/app/discover` may present context filters and query-driven people search. It
does not preload every Pods Person.

`/app/people/:personId` is the signed-in limited-profile route for a private
Person visible through a valid shared Team, Project, Event, Pod, application,
invitation, review, or conversation context. It uses the narrowest permitted
profile projection and never redirects to a public profile unless that profile
is independently public.

## Creation and Participation Intent Routes

```text
/app/events/create
/app/organizations/create
/app/teams/create
/app/projects/create
/app/pods/create

/app/events/:eventId/apply
/app/organizations/:organizationId/apply
/app/projects/:projectId/apply
/app/teams/:teamId/apply
/app/pods/:podId/apply

/app/applications/:applicationId
/app/applications/:applicationId/status
```

Creation begins from the relevant Work, Discover, Organization, Team, Project,
or Event context and carries that host as an explicit proposed relationship.
The server still validates whether the actor can create and host that object.

Application creation belongs to the target object. The canonical application
detail owns editable draft answers, submission, withdrawal where permitted,
and the final decision history. The status route is the compact progress
projection used after submission and through requirements, funding, capacity,
and activation. Inbox and Today link to these routes rather than duplicating
their forms.

## Event Workspace

The workspace lists in this document are a capability-dependent route catalog,
not mandatory tabs. A route exists only when the source object's frozen
contract, lifecycle, and the viewer's capability make that destination useful.
Compact contexts compose capabilities into sheets, filters, or deep-linked
details rather than rendering empty navigation.

Participant:

```text
/app/events/:eventId/overview
/app/events/:eventId/entries
/app/events/:eventId/activity
/app/events/:eventId/people
/app/events/:eventId/contract
/app/events/:eventId/room
```

Organizer:

```text
/app/events/:eventId/manage/overview
/app/events/:eventId/manage/entries
/app/events/:eventId/manage/applications
/app/events/:eventId/manage/applications/:applicationId
/app/events/:eventId/manage/reviews
/app/events/:eventId/manage/economics
/app/events/:eventId/manage/communications
/app/events/:eventId/manage/settings
```

The organizer overview summarizes structured exceptions and progress. It does
not expose every Project or Pod room.

## EventEntry Workspace

```text
/app/event-entries/:eventEntryId/overview
/app/event-entries/:eventEntryId/requirements
/app/event-entries/:eventEntryId/charter
/app/event-entries/:eventEntryId/roster
/app/event-entries/:eventEntryId/milestones
/app/event-entries/:eventEntryId/recap
```

The overview owns entry activation, phase status, and the current canonical
entry action. Requirements owns pre-activation eligibility, consent, funding,
and allocation progress. Charter and roster expose their separate immutable
snapshots. Recap appears only after a terminal entry outcome and never
substitutes for the durable Project journey.

## Project Workspace

```text
/app/projects/:projectId/overview
/app/projects/:projectId/timeline
/app/projects/:projectId/pods
/app/projects/:projectId/people
/app/projects/:projectId/contract
/app/projects/:projectId/room
/app/projects/:projectId/manage/settings
/app/projects/:projectId/manage/access
/app/projects/:projectId/manage/integrations
/app/projects/:projectId/manage/applications
/app/projects/:projectId/manage/applications/:applicationId
```

Overview shows charter, current phase, next milestone, and current action.
Timeline shows ActivityMoments. Pods shows focused execution spaces. People
shows contributions and roles. Contract shows immutable terms and current
version.

## Team and Organization Workspaces

```text
/app/teams/:teamId/overview
/app/teams/:teamId/projects
/app/teams/:teamId/people
/app/teams/:teamId/room
/app/teams/:teamId/manage/overview
/app/teams/:teamId/manage/applications
/app/teams/:teamId/manage/applications/:applicationId
/app/teams/:teamId/manage/access
/app/teams/:teamId/manage/settings

/app/organizations/:organizationId/overview
/app/organizations/:organizationId/teams
/app/organizations/:organizationId/events
/app/organizations/:organizationId/people
/app/organizations/:organizationId/room
/app/organizations/:organizationId/manage/overview
/app/organizations/:organizationId/manage/applications
/app/organizations/:organizationId/manage/applications/:applicationId
/app/organizations/:organizationId/manage/access
/app/organizations/:organizationId/manage/settings
```

Only routes justified by a granted capability appear. Membership never
implies visibility into every Project, Event, or Pod.

The Organization room is an official broadcast surface, not a general
membership chat by default. Its publishing capability is separate from
Organization membership.

## Pod Workspace

```text
/app/pods/:podId/overview
/app/pods/:podId/today
/app/pods/:podId/room
/app/pods/:podId/activity
/app/pods/:podId/people
/app/pods/:podId/contract

/app/pods/:podId/manage/overview
/app/pods/:podId/manage/applications
/app/pods/:podId/manage/applications/:applicationId
/app/pods/:podId/manage/roster
/app/pods/:podId/manage/reviews
/app/pods/:podId/manage/economics
/app/pods/:podId/manage/room
/app/pods/:podId/manage/settlement
/app/pods/:podId/manage/settings
```

These destinations are semantically separate capabilities:

- Overview: purpose, state, current occurrence summary, and visitor context.
- Today: the current participant action only.
- Room: conversation and activity cards.
- Activity: structured occurrence and milestone history.
- People: roster and permitted progress.
- Contract: frozen terms, review authority, visibility, and economics.

The default compact Pod experience uses Room as its primary workspace, a
current-occurrence strip that opens the canonical commitment or proof action,
and contextual Activity, People, and Contract sheets or deep links. It does not
show six persistent tabs. A more complex Pod may expose additional navigation
only when the protocol proves it useful. Content is never duplicated merely to
populate every route in the catalog.

Event, Project, and Team room routes exist only when Document 14 enables that
context capability. Event rooms are bounded official broadcast and Q&A,
Projects may enable a contributor workspace, and Teams may use a durable Team
room. EventEntry has no primary room in the initial topology.

## Proof and Review Routes

Participant:

```text
/app/commitments/:commitmentId
/app/commitments/:commitmentId/evidence
/app/submissions/:submissionId
/app/submissions/:submissionId/clarify
/app/submissions/:submissionId/dispute
```

Build and Ship:

```text
/app/artifacts/:artifactId
/app/artifacts/:artifactId/eligibility
/app/milestones/:milestoneId
/app/milestones/:milestoneId/submit
/app/milestone-submissions/:milestoneSubmissionId
/app/milestone-submissions/:milestoneSubmissionId/clarify
/app/milestone-submissions/:milestoneSubmissionId/dispute
```

Reviewer:

```text
/app/reviews
/app/reviews/:assignmentId
```

Proof routes use owner, reviewer, or group-safe DTOs. Opening a shared Activity
card never exposes the owner-only review panel.

`/app/submissions/:submissionId` is reserved for occurrence ProofCase
submissions. MilestoneSubmission uses its own routes and authority dispatcher
because its terminal result also updates BuildMilestone and may gate sponsor
award settlement. BuildArtifact detail shows provenance and eligibility, not a
context-specific proof acceptance. A milestone route owns one BuildMilestone
definition and outcome, while the milestone-submission route owns evidence,
clarification, dispute, and review state.

## Financial Routes

```text
/app/contracts/:contractId/fund
/app/deposits/:depositIntentId
/app/settlements/:settlementRunId
/app/transfers/:transferLegId
```

Funding uses a progressive flow with one current action and expandable details.
Refresh and WebView closure recover from authoritative state.

Financial routes:

- never infer credit from a client callback;
- always show network and asset;
- separate principal, bonus, forfeiture, fee, refund, and transfer;
- give unknown and exception states first-class screens;
- remain accessible during product restrictions where obligations exist.

## Operations Routes

```text
/ops/reviews
/ops/moderation
/ops/integrations
/ops/finance/deposits
/ops/finance/settlements
/ops/finance/transfers
/ops/security
/ops/incidents
/ops/audit
```

Each queue is role-scoped and supports:

- filter by authoritative state;
- age and SLA;
- safe context;
- permitted commands;
- audit trail;
- escalation.

There is no generic edit-any-record screen.

## Canonical Action Ownership

1. Today links to the action but does not duplicate its full form.
2. Messages owns active conversations. Requests owns pending intent decisions.
   Updates owns terminal and historical notification records.
3. Inbox links to the canonical action but cannot execute it inline unless the
   source aggregate defines a safe compact command.
4. Object overview summarizes but links to proof, settlement, or management.
5. Room ActivityCards open the authoritative Activity or proof projection.
6. Public share pages link to public object projections, never private app
   routes.
7. One NextAction is computed from authoritative state and permission.

## Route Authorization

Every request evaluates:

- authenticated actor;
- exact opaque target;
- relationship and role grant;
- lifecycle state;
- source visibility;
- consent and contract version;
- eligibility and account status;
- representative scope;
- public disclosure policy.

Controls hidden in the client are never authorization.

An authorization change while a page is open:

- prevents the next protected fetch or mutation;
- clears sensitive local state;
- presents a safe current-state message;
- preserves any owed financial destination.

## Mobile and WebView Contract

- support the practical width range from 320 CSS pixels upward rather than
  designing for two fixed devices;
- validate common compact, standard, tall, and large mobile viewports;
- respect safe-area insets and dynamic viewport height;
- keep primary actions reachable without horizontal overflow;
- use at least 44 by 44 CSS pixel touch targets;
- avoid input font sizes that trigger mobile zoom;
- persist drafts and recover after WebView closure;
- keep bottom navigation fixed without covering content;
- move secondary actions into a reachable bottom sheet;
- support reduced motion, screen readers, large text, keyboard, and contrast;
- never encode state through color alone.

Desktop is a responsive extension of the same destination model, not a
different product.

## Route Matrix Gate

Before lock, test every relevant route against:

- anonymous visitor;
- signed-in visitor;
- applicant;
- invitee;
- accepted pending requirements;
- participant;
- contributor;
- lead;
- owner;
- organizer;
- reviewer;
- sponsor;
- moderator;
- financial operator;
- youth user;
- restricted, suspended, deactivated, and deleted-person projections.

For each combination record:

- discoverability;
- view result;
- DTO class;
- allowed actions;
- safe denial;
- deep-link behavior;
- post-lifecycle behavior.

## Failure and Empty States

- no current action;
- no Work objects;
- no discovery matches;
- no Inbox items;
- invalid or expired invitation;
- private or unavailable object;
- authorization changed;
- projection updating;
- offline with cached safe state;
- deleted source;
- archived object;
- financial exception;
- service unavailable with exact recovery.

## Current Testnet Contradictions

- routes are Pod-first and do not model Organization, Team, Event, Project,
  EventEntry, or contribution;
- Today, My Pods, Messages, Updates, Pod room, feed, activity, and Pod Today
  contain overlapping projections;
- route guards assume a wallet session and Pod membership;
- public visitor and participant routes remain closely coupled;
- consumer and operations surfaces share one application and a shared-secret
  operations session.

## Non-goals

- Desktop-only administration patterns.
- One giant object page.
- Showing every status on every card.
- Discover as a complete public people directory.
- A route per database table.
- Relying on hidden UI for permission.

## Interdependencies

- Document 05 owns safe disclosure and route authorization.
- Documents 07 through 11 own route-visible lifecycle state.
- Documents 12 through 15 own Activity, Passport, Room, Inbox, and Today
  projections.
- Documents 16 through 18 own Build and Ship destinations and journeys.
- Document 22 owns DTO and projection delivery.
- Document 23 owns operator separation and financial access.
- Document 25 owns public origins and environment routing.
- Document 26 checks that every object, actor, and command has one destination.

## Review Findings

- Today, Work, Discover, Inbox, Profile, and object workspaces each own one
  distinct user question.
- Relationship requests, historical updates, conversations, execution actions,
  proof, and settlement do not compete for the same destination.
- EventEntry, BuildArtifact, BuildMilestone, MilestoneSubmission, ProofCase,
  and financial records have explicit authoritative routes.
- Route catalogs are capability-dependent and do not force empty tabs or
  overloaded mobile screens.
- Signed-out, visitor, participant, contributor, organizer, reviewer, and
  operator projections remain separately authorized.

## Closure Condition

Lock after the complete actor-by-state route matrix, deep-link recovery,
authorization changes, empty and exception states, mobile viewport range,
accessibility, WebView closure, and no-duplicate-action review pass for the
selected Mainnet v1 slice.
