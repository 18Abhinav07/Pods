---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, journeys, participants, organizers, visitors, planning]
---

# 18: Participant, Project, and Visitor Journeys

Status: review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/09-pod-occurrence-and-commitment-lifecycles|Pod lifecycle]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship]] |
[[docs/mainnet-planning/17-organizer-seasons-and-operations|Organizer operations]] |
[[HANDOFF]] | [[README]]

## Purpose

Connect every approved object and lifecycle into actor journeys where the
person always understands:

1. which identity and context they are using;
2. their exact relationship and authority;
3. the current authoritative state;
4. the one valid next action;
5. what that action changes and what it cannot change.

This document introduces no new authority. It defines destination ownership
and NextAction projections consumed by Document 24.

## Destination Responsibilities

- **Today:** the person's prioritized actionable obligations.
- **Work:** owned and joined Organizations, Teams, Events, Projects, entries,
  and Pods.
- **Discover:** eligible Events, Projects, Pods, and query-based people.
- **Inbox Messages:** conversations and message unread state.
- **Inbox Requests:** relationship, invitation, application, and message
  requests.
- **Inbox Updates:** durable decisions, outcomes, and delivery history.
- **Profile:** identity, facets, Passport, relationships, and settings.
- **Event home:** contract, entries, phases, public pulse, and operations.
- **Project home:** charter, milestones, contributors, focused Pods, journey,
  and public story.
- **Pod:** current occurrence, room, activity, people, and contract.
- **Proof review:** evidence and review only.
- **Settlement:** economic contract, entitlement, and transfer only.

No destination duplicates another complete inventory.

## New Builder Journey

Every new person begins:

```text
Google or GitHub authentication
-> username and display name
-> optional Builder facet and matching intent
-> discover an eligible target
-> inspect safe target, relationship, and contract
```

The journey then branches by target:

```text
Event
-> submit or accept EventEntryIntent
-> satisfy entry-level requirements
-> create pending EventEntry
-> accept and freeze EventEntryBuildCharter where Build and Ship applies
-> resolve individual EventParticipant intents, requirements, and consent
-> fund only where the accepted contract requires it
-> allocate and roster lock
-> freeze EventRosterSnapshot
-> activate EventEntry

Project need
-> submit or accept ProjectContribution intent
-> activate contribution
-> enter Project without requiring a Pod

Team
-> submit or accept TeamMembership intent
-> activate membership
-> enter Team without automatic Project, Event, or Pod enrollment

Pod
-> submit or accept Pod participation intent
-> satisfy consent, funding, allocation, and roster gates that apply
-> activate PodParticipation
-> enter the Pod without requiring a Project when standalone
```

When an active relationship creates an execution obligation:

```text
open Today
-> open exact ParticipantOccurrence
-> lock current commitment
-> attach source-observed or manual artifact
-> choose evidence visibility
-> submit and receive review
-> see stable ActivityMoment update
-> collaborate in the relevant room
-> repeat
-> complete applicable milestone, Pod, Project, or EventEntry
-> receive settlement where applicable
-> publish selected facet view or Project journey
```

## Returning Builder Journey

Today opens to the most urgent real action, not a dashboard summary. From it,
the builder reaches the exact Project, Pod occurrence, clarification, result,
settlement, safety, or governance action. Relationship requests remain in
Inbox Requests. Digests provide context without replacing the action.

## Project Lead Journey

```text
Create or select Project
-> create or update ProjectBuildProfile
-> publish contribution needs
-> invite or accept contributors
-> apply to Event
-> create pending EventEntry
-> accept and freeze EventEntryBuildCharter
-> resolve EventParticipant intents, requirements, terms, and applicable funding
-> allocate and lock the participant roster
-> freeze EventRosterSnapshot
-> activate EventEntry
-> create focused Pods and milestones
-> monitor structured progress and exceptions
-> publish Project chapters
-> handle contributor exit or replacement
-> complete EventEntry
-> preserve Project history
-> enter another Event
```

The Project home, not chat, owns charter, milestones, people, Pods, and public
story.

## Organizer Journey

```text
Create and configure Event
-> preview every role and consent
-> publish
-> evaluate applications
-> create pending EventEntries and freeze each EventEntryBuildCharter
-> resolve EventParticipant intents, requirements, consent, and funding
-> allocate and lock each roster
-> freeze each EventRosterSnapshot
-> activate eligible entries
-> operate kickoff and phases
-> monitor aggregate progress and exceptions
-> manage review capacity
-> close ParticipantOccurrence and milestone review
-> freeze and calculate ParticipantCommitmentSettlement
-> complete disclosed judging
-> freeze and calculate SponsorAwardSettlement
-> conservation-verify both independent entitlement sets
-> confirm transfers
-> publish showcase
-> archive Event
```

## Reviewer Journey

```text
Receive assignment
-> inspect contract and conflict
-> accept or recuse
-> view minimum necessary evidence
-> request clarification up to the configured allowed count
-> decide
-> handle dispute up to the configured allowed count
-> close assignment
```

The reviewer surface hides unavailable commands and handles reassignment,
clarification expiry, platform-owned initial timeout protection, dispute
timeout to grace, and terminal closure.

## Sponsor Journey

```text
Inspect sponsor contract
-> satisfy eligibility
-> fund approved pool
-> if funding is incomplete, complete funding or enter delayed activation,
   cancellation, or the pre-agreed amendment path
-> observe permitted aggregate progress
-> receive exception notice
-> inspect conservation and allocation
-> receive unused-fund or partial-completion treatment
-> follow sponsor refund from queued through confirmed where owed
-> follow award and payout exceptions where permitted
-> receive final conservation receipt
```

## Visitor Journey

```text
Open shared Event, Project, Pod, Passport, or snapshot
-> understand purpose and stage
-> follow curated public journey
-> open public artifacts
-> inspect opted-in credits and claim basis
-> choose follow, connection, or application
-> authenticate or resume canonical session
-> return to the exact target and pending intent
-> confirm action
```

Visitors never need raw chat to understand progress and never receive member
controls.

## Required Exception Journeys

The product must explicitly handle:

- application declined, expired, withdrawn, or capacity excluded;
- invitation invalid, revoked, or already used;
- accepted but eligibility, consent, funding, allocation, or roster lock
  incomplete;
- funding rejection, wrong network, mismatch, late finality, or refund;
- contributor exit with active obligations;
- Project withdrawal or Event cancellation;
- missed, rejected, clarification, dispute, grace, and timeout protection;
- reviewer conflict or inactivity;
- settlement conservation failure;
- `queued`, `prepared`, `submitted`, `confirming`, `confirmed`, `unknown`,
  `retryable_failed`, `mismatched`, `late`, `manual_review`, and
  `no_transfer_required` transfers;
- visibility revocation or public artifact removal;
- archived room or context;
- account restriction, suspension, deactivation, or deletion pending.

Each state says what is preserved, what can happen next, and what is no longer
possible.

## State-to-Experience Appendix

The tables below are normative for destination ownership. Rows may group exact
states only where actor, destination, preserved rights, and next action are
the same.

Hard deletion of an unpublished `draft` Event, Organization, Team, Project, or
Pod removes the aggregate from product navigation. A minimal security or
creation audit receipt may remain under retention policy, but there is no
post-deletion product route or NextAction to map.

### Event, Entry, and Participant

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| Event `draft` | owner | Event setup | Continue setup or delete | no participant exposure; `configured` or `deleted` |
| Event `configured` | owner | Event preview | Validate and publish | draft remains editable; `registration_open` or `cancelled` |
| Event `registration_open`, entrant view | entrant | Event application | Apply under the frozen contract | no seat or EventEntry exists; submitted intent or registration closure |
| Event `registration_open`, organizer view | organizer | Event manage applications | Invite or manage the funnel | published contract fixed; `registration_closed` or cancellation |
| Event `registration_closed` | organizer or entrant | Event overview | Explain registration closure and pending decisions | existing intents preserved; `activation_review` |
| Event `activation_review` | organizer | Event manage overview | Resolve eligibility, capacity, sponsor, consent, and roster gates | accepted intents and funding preserved; `scheduled` or cancellation |
| Event `scheduled` | participant | Event overview | Show kickoff and required pre-start action | contract and roster preserved; `active` |
| Event `active`, participant view | participant | Event overview | Open the current participant action | history and obligations preserved; organizer controls phase advancement |
| Event `active`, organizer view | organizer | Event manage overview | Operate the current phase or begin finalization | participant rights and frozen policy preserved |
| Event `finalizing`, participant view | participant | Event finalization status | Resolve only an assigned requirement or wait | no silent completion; own review and financial rights preserved |
| Event `finalizing`, organizer view | organizer | Event manage finalization | Resolve reviews, judging, economics, and transfers | `completed` or cancellation only after every gate closes |
| Event `completed` | any authorized viewer | Event recap | No action beyond eligible publishing or receipts | complete history; `archived` |
| Event `archived` | any authorized viewer | Event archive | Read-only explanation | contracts, public story, and receipts preserved |
| Event `cancellation_pending` | affected actor | Event cancellation status | Show reason and dependent obligations | withdrawal, proof, and money rights preserved; refund or settlement branch |
| Event `refunding_if_required` or `refunding_or_settling` | affected actor | Event financial status | Follow own refund or settlement | financial access preserved; `cancelled` after closure |
| Event `cancelled` | affected actor | Event cancelled recap | No new participation | history, refunds, and receipts preserved |
| Event overlay `suspended` | affected actor | Event status | Explain paused capabilities and deadline treatment | obligation-preserving actions continue; return to base state or cancel |
| Event overlay `governance_blocked`, owner or authorized organizer view | owner or authorized organizer | Event governance recovery | Restore accountable representation | participant and financial rights continue; return to base state |
| Event overlay `governance_blocked`, participant view | affected participant | Event governance status | Follow an allowed obligation, withdrawal, refund, or cancellation action | no governance authority; participant and financial rights continue |
| Entry intent `draft` created by applicant | applicant | application draft | Submit or cancel | no EventEntry exists |
| Entry intent `draft` created by inviter | inviter | invitation draft | Send or cancel | no EventEntry exists |
| Entry intent `applied` | applicant | Event application status | Wait or withdraw | no active participation; acceptance or terminal intent |
| Entry intent `invited` | invitee | Inbox Requests | Accept or decline | no active participation; acceptance or terminal intent |
| Entry intent `accepted_pending_requirements` | accepted subject | Event requirements | Complete requirements | no secured roster claim; requirements satisfied, withdrawal, or revocation |
| Entry intent `requirements_satisfied` | accepted subject | Event activation status | Wait for EventEntry, allocation, or an explained exclusion | accepted requirements preserved; pending EventEntry or terminal resolution |
| Entry intent `declined`, `revoked`, `expired`, or `withdrawn` | subject | Event application result | Explain terminal result | source history preserved; new intent only if policy permits |
| EventEntry `pending_activation`, lead view | entry lead | Event entry requirements | Complete lead-owned charter, roster, consent, and funding duties | Project continuity preserved; `active`, `excluded`, or `cancelled` |
| EventEntry `pending_activation`, organizer view | organizer | Event manage entry | Evaluate only organizer-owned eligibility, capacity, funding-coverage, and activation gates | lead obligations remain assigned to the entry; `active`, `excluded`, or `cancelled` |
| EventEntry `active` | entry participant | EventEntry overview | Current Event phase action | durable Project remains separate and linked; completion or exit branch |
| EventEntry `withdrawal_pending` or `exclusion_pending` | affected actor | Event entry resolution | Resolve obligations | proof and economics preserved; withdrawn or excluded |
| EventEntry `completed`, participant view | participant | EventEntry recap | Publish an eligible result where authorized | Project continues |
| EventEntry `completed`, visitor view | visitor | public EventEntry recap | View the published result | no private roster, proof, or financial access |
| EventEntry `withdrawn`, `excluded`, `disqualified`, or `cancelled` | affected actor | Event entry outcome | Explain consequences and receipts | attribution and owed value preserved |
| EventParticipantIntent `applied` | applicant | Event participation status | Wait or withdraw | no EventParticipant or roster power |
| EventParticipantIntent `invited` | invitee | Inbox Requests | Accept or decline | no EventParticipant or roster power |
| EventParticipantIntent `accepted_pending_requirements` | accepted person | Event participant requirements | Complete consent and individual requirements | no roster power until allocation and activation |
| EventParticipantIntent `requirements_satisfied` | accepted person | Event participation activation status | Wait for allocation and pending participation creation | consent and requirements preserved |
| EventParticipantIntent `declined`, `revoked`, `expired`, or `withdrawn` | subject | Event participation result | Explain terminal intent | no EventParticipant or roster power |
| EventParticipant `pending_activation` | person | Event participation status | Wait for allocation, roster lock, and activation | accepted intent and requirements preserved; no active roster powers |
| EventParticipant `active` | person | Event or Project overview | Current Event action | exact role and history preserved |
| EventParticipant `exit_pending`, person view | person | Event participation resolution | Complete an assigned obligation or wait | clarification, dispute, and money rights continue |
| EventParticipant `exit_pending`, organizer view | organizer | Event participant management | Resolve only organizer-owned exit gates | participant clarification, dispute, and money rights continue |
| EventParticipant `declined`, `revoked`, or `excluded` | person | Event participation result | Explain why activation did not occur | intent, consent, and any refund rights preserved |
| EventParticipant `completed`, `left`, `removed`, `disqualified`, or `cancelled` | person | Event participation history | No new Event action | attribution and receipts preserved |

### Organization, Team, Project, and Relationship

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| Organization `draft` | owner | Organization setup | Continue or delete | no members or public authority created |
| Organization `active`, member view | member | Organization overview | Open a granted Organization capability | memberships, affiliations, and hosted Events remain explicit |
| Organization `active`, representative view | representative | Organization manage overview | Operate granted Organization capabilities | representation and ownership remain separate |
| Organization `dormant`, member view | member | Organization overview | Wait or exit where permitted | history, memberships, affiliations, and obligations preserved |
| Organization `dormant`, representative view | representative | Organization manage overview | Reactivate or begin dissolution if authorized | history and obligations preserved |
| Organization `dissolution_pending`, member view | member | Organization status | Follow own relationship and obligation resolution | Events, Projects, Teams, and Pods do not cascade-cancel |
| Organization `dissolution_pending`, owner view | owner | Organization manage status | Resolve every dependent obligation | archive only after explicit closure |
| Organization `archived` | authorized former member | Organization archive | Read-only | membership and attribution history preserved |
| Organization overlay `governance_blocked`, owner view | owner | Organization governance recovery | Restore accountable representation | exit and obligation-preserving actions continue |
| Organization overlay `governance_blocked`, member view | affected member | Organization governance status | Follow an allowed exit or obligation action | no discretionary governance power |
| Team `draft` | owner | Team setup | Continue or delete | no members created |
| Team `forming`, owner view | owner | Team overview | Form membership and ownership | `active` or dissolution |
| Team `forming`, invitee view | invitee | Inbox Requests | Accept or decline the membership intent | no Team membership until activation |
| Team `active` | member | Team overview | Team-specific action | Projects and Events remain independent |
| Team `dormant` | member | Team overview | Reactivate if authorized | history and links preserved |
| Team `dissolution_pending`, owner view | owner | Team manage status | Resolve Team obligations | Projects and entries not cascade-cancelled |
| Team `dissolution_pending`, member view | member | Team status | Follow own relationship and obligations | no management authority implied |
| Team `archived` | member | Team archive | Read-only | membership and attribution history preserved |
| Team overlay `governance_blocked`, owner view | owner | Team governance recovery | Restore owner representation | exit and obligation actions continue |
| Team overlay `governance_blocked`, member view | member | Team governance status | Follow an allowed exit or obligation action | no discretionary governance power |
| Project `draft` | owner | Project setup | Complete ProjectBuildProfile or delete | no contribution implied |
| Project `forming`, owner view | owner | Project overview | Form contributors and sources | `active` or `cancelled` |
| Project `forming`, contributor view | contributor | Project contribution status | Complete assigned activation requirements or wait | no owner authority implied |
| Project `active` | contributor | Project overview | Current milestone or Pod action | Event entries remain separate |
| Project `paused` | contributor | Project overview | Resume or complete | history and obligations visible |
| Project `completed`, contributor view | contributor | Project journey | Publish eligible completion or, if authorized, propose a named phase | completion record preserved |
| Project `completed`, visitor view | visitor | public Project journey | View the published completion | no private contribution or source access |
| Project `cancelled` | contributor | Project outcome | Explain preserved history | active Pods and finances resolve separately |
| Project `archived` | authorized viewer | Project archive | Read-only | story and attribution preserved |
| Project overlay `governance_blocked`, owner view | owner | Project governance recovery | Restore representation | contributor exit and obligations continue |
| Project overlay `governance_blocked`, contributor view | contributor | Project governance status | Follow an assigned obligation or exit action | no owner authority implied |
| Membership or contribution intent `draft`, applicant-authored | prospective subject | context application draft | Submit or cancel | no relationship until activation |
| Membership or contribution intent `draft`, inviter-authored | inviter | context invitation draft | Send or cancel | no relationship until activation |
| OrganizationMembership, TeamMembership, or ProjectContribution intent `applied` | applicant | context application status | Wait or withdraw | no relationship until activation |
| OrganizationMembership, TeamMembership, or ProjectContribution intent `invited` | invitee | Inbox Requests | Accept or decline | no relationship until activation |
| OrganizationMembership, TeamMembership, or ProjectContribution intent `accepted` | subject | relationship activation status | Complete applicable requirements | pending relationship may activate, cancel, or decline |
| OrganizationMembership, TeamMembership, or ProjectContribution intent `declined`, `revoked`, `expired`, or `withdrawn` | subject | request result | Explain terminal intent | new intent only if policy permits |
| OrganizationMembership, TeamMembership, or ProjectContribution `pending_activation` | subject | Organization, Team, or Project relationship status | Complete requirements | `active`, `cancelled`, or `declined` |
| OrganizationMembership, TeamMembership, or ProjectContribution `cancelled` or `declined` | subject | relationship result | Explain why activation did not occur | no active access; intent history preserved |
| OrganizationMembership, TeamMembership, or ProjectContribution `active` | subject | Organization, Team, or Project People | Context action | exact role and attribution preserved |
| OrganizationMembership, TeamMembership, or ProjectContribution `exit_pending` | subject | relationship resolution | Resolve frozen obligations | `left` or `removed` |
| OrganizationMembership, TeamMembership, or ProjectContribution `completed`, `left`, or `removed` | subject | history | No new access | earlier attribution preserved |

### Build Artifact and Milestone

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| BuildArtifact `proposed` | contributor | artifact setup | Choose observed source or manual attestation | no eligibility or proof claim yet |
| BuildArtifact `source_observed` or `manually_attested` | contributor | artifact detail | Request eligibility evaluation or link required context | exact provenance basis preserved |
| BuildArtifact `eligibility_pending`, contributor view | contributor | artifact status | Wait for eligibility evaluation | no context acceptance claimed |
| BuildArtifact `eligibility_pending`, evaluator view | authorized evaluator | artifact eligibility | Apply the objective frozen rules | provenance and context acceptance remain separate |
| BuildArtifact `eligible` | contributor | artifact detail | Attach to a commitment or milestone | eligibility is not proof acceptance |
| BuildArtifact `ineligible` | contributor | artifact result | Correct with a new artifact version where allowed | reason and provenance preserved |
| BuildArtifact `invalidated`, contributor view | contributor | artifact correction status | Submit an allowed replacement or follow the named correction path | prior ProofCase and settlement never rewrite silently |
| BuildArtifact `invalidated`, context-lead view | affected context lead | affected context status | Resolve only that context through its named correction process | no authority to rewrite prior proof, milestone, or settlement history |
| BuildArtifact overlay `source_unavailable` | authorized viewer | artifact detail | Retry reconciliation or use allowed fallback | historical provenance and eligibility decision preserved |
| BuildMilestone `planned`, lead view | Project lead | Project milestones | Activate, withdraw, or cancel under policy | charter and milestone definition preserved |
| BuildMilestone `planned`, contributor view | contributor | Project milestones | Review the planned requirement | no milestone-management authority implied |
| BuildMilestone `active` | contributor | Project milestone | Open submission at the scheduled boundary | required outcome and policy visible |
| BuildMilestone `submission_open` | contributor | milestone submission | Submit evidence before deadline | no submission means `not_met` |
| BuildMilestone `review_pending`, contributor view | contributor | milestone status | Respond only when requested or wait | review and dispute clocks visible |
| BuildMilestone `review_pending`, reviewer view | reviewer | milestone review assignment | Decide under the frozen policy | minimum necessary evidence and deadline visible |
| BuildMilestone `achieved`, contributor view | contributor | Project journey | Publish the eligible outcome where authorized | exact accepted submission and credits preserved |
| BuildMilestone `achieved`, visitor view | visitor | public Project journey | View the published outcome | no private evidence or review access |
| BuildMilestone `not_met` | contributor | milestone outcome | No action unless frozen correction policy permits | not punitive-public by default; sponsor ineligible |
| BuildMilestone `timeout_protected` or `grace` | contributor | milestone outcome | No action unless named correction process exists | neutral or protected wording; not achievement or sponsor eligible |
| BuildMilestone `withdrawn` or `cancelled` | contributor | milestone history | Explain closure | prior work and applicable sponsor return treatment preserved |
| MilestoneSubmission `draft` | contributor | milestone submission draft | Continue, submit, or withdraw | private draft and evidence choices preserved |
| MilestoneSubmission `submitted` or `integrity_checking` | contributor | milestone submission status | Wait or use an explicit fallback when offered | platform-owned time counts toward protection |
| MilestoneSubmission `reviewing`, contributor view | contributor | milestone-submission status | Wait for a decision | hard deadline, evidence boundary, and timeout protection visible |
| MilestoneSubmission `reviewing`, reviewer view | reviewer | milestone review assignment | Decide or request the permitted clarification | minimum necessary evidence and hard deadline visible |
| MilestoneSubmission `needs_clarification` | contributor | milestone clarification | Respond before exact deadline | original evidence and response right preserved |
| MilestoneSubmission `rejected` with dispute open | contributor | milestone rejection | Dispute before exact expiry | rejection remains nonterminal for award settlement |
| MilestoneSubmission `disputed`, contributor view | contributor | milestone dispute status | Wait for resolution | inactivity reaches `grace` |
| MilestoneSubmission `disputed`, reviewer view | reviewer | milestone dispute assignment | Resolve under the frozen policy | prior rejection, new context, and hard deadline preserved |
| MilestoneSubmission `accepted`, `not_met_final`, `timeout_protected`, `grace`, `withdrawn`, or `cancelled` | contributor | milestone outcome | No action unless named correction process exists | BuildMilestone outcome changes in the same transaction |

### Pod, Occurrence, Participation, and Commitment

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| Pod `draft` | creator | Pod builder | Continue or delete | no participant exposure |
| Pod `enrollment_open`, entrant view | eligible entrant | Pod public or private preview | Apply under the published contract | no invitation or applicant-management authority implied |
| Pod `enrollment_open`, creator or authorized-lead view | creator or authorized lead | Pod manage enrollment | Invite eligible people or manage applicant decisions | published contract frozen; no applicant action implied |
| Pod `activation_evaluating`, creator view | creator | Pod manage activation | Resolve creator-owned capacity and roster gates | participant deposits, consent, and intents preserved |
| Pod `activation_evaluating`, accepted-person view | accepted person | Pod activation status | Complete the exact assigned requirement or wait | deposit and intent status preserved |
| Pod `roster_locked` | participant | Pod overview | Wait for or acknowledge start | roster and schedule snapshot frozen |
| Pod `active` | participant | Pod compact workspace | Open current ParticipantOccurrence | room and activity available by policy |
| Pod `final_review`, participant view | participant | Pod final review status | Respond only to an assigned clarification or dispute | no settlement until all cases are terminal |
| Pod `final_review`, reviewer view | reviewer | Pod review queue | Resolve assigned outstanding cases | minimum necessary evidence and hard deadlines visible |
| Pod `outcome_ready` | participant | Pod outcome | Inspect terminal activity and economic preview | settlement may begin |
| Pod `settling_if_required` | participant | Settlement | Follow entitlement and transfer | activity outcome cannot change silently |
| Pod `completed`, participant view | participant | Pod recap | Publish an eligible story where authorized | room follows contract |
| Pod `completed`, visitor view | visitor | public Pod recap | View the published story | no private activity, room, or financial access |
| Pod `archived` | authorized viewer | Pod archive | Read-only | contract, activity, and receipts preserved |
| Pod `cancellation_pending` or `resolving_obligations` | affected actor | Pod cancellation status | Resolve review, refund, or settlement | no orphaned obligations |
| Pod `cancelled` | affected actor | Pod cancelled recap | Follow any outstanding transfer | history and receipts preserved |
| Pod overlay `suspended` or `governance_blocked` | affected actor | Pod status | Explain allowed recovery action | clarification, dispute, refund, and reconciliation continue |
| Occurrence `scheduled` | participant | Pod upcoming | No action until opened | schedule version preserved |
| Occurrence `open` | participant | Pod current occurrence | Open own ParticipantOccurrence | shared window has no group outcome |
| Occurrence `closed` | participant | Pod activity | Explain review still pending | participant cases continue independently |
| Occurrence `finalized` | participant | Pod activity | Inspect authorized aggregate | exact participant outcomes preserved |
| Occurrence `cancelled` | participant | Pod activity | No action | participant obligations resolve `cancelled` |
| ParticipantOccurrence `scheduled` | participant | Pod upcoming activity | No action until the commitment window opens | exact schedule, requirement, and consequence preserved |
| ParticipantOccurrence `commitment_open` | participant | commitment | Lock commitment where required | Today deep-links here; exact deadline and consequence |
| ParticipantOccurrence `evidence_open` | participant | evidence flow | Submit evidence | draft and visibility choices preserved |
| ParticipantOccurrence `review_pending` | participant | submission status | Respond only when requested | review clocks and protection visible |
| ParticipantOccurrence `review_pending` with rejected ProofCase and `disputeAvailability=open` | participant | rejection detail | Submit the one allowed dispute before expiry | settlement and sponsor-award finalization remain blocked; participant-funded or hybrid slices are only provisionally forfeited, sponsor-only reward eligibility is held, and nonfinancial mode has no money consequence |
| ParticipantOccurrence terminal `approved` | participant | activity outcome | No action unless a named correction process exists | participant-funded or hybrid principal is protected and bonus eligible; an occurrence-based sponsor reward is eligible where the frozen policy permits; nonfinancial mode records the outcome only |
| ParticipantOccurrence terminal `timeout_protected` | participant | activity outcome | No action unless a named correction process exists | participant-funded or hybrid principal is protected; no participant-funded bonus or sponsor reward; nonfinancial mode records the protected outcome only |
| ParticipantOccurrence terminal `grace` | participant | activity outcome | No action unless a named correction process exists | participant-funded or hybrid principal is protected; occurrence excluded from success and streak denominators; no bonus or sponsor reward; nonfinancial mode has no money consequence |
| ParticipantOccurrence terminal `rejected` with `disputeAvailability=not_permitted` | participant | activity outcome | No action unless a named correction process exists | permitted only by a frozen nonfinancial policy; no deposit, slice, bonus, or reward consequence |
| ParticipantOccurrence terminal `rejected` with `disputeAvailability=used` or `expired` | participant | activity outcome | No action unless a named correction process exists | participant-funded or hybrid slice is provisionally forfeited; sponsor-only mode has no participant principal and no reward eligibility; nonfinancial mode has no money consequence |
| ParticipantOccurrence terminal `missed` | participant | activity outcome | No action unless a named correction process exists | participant-funded or hybrid slice is provisionally forfeited; sponsor-only mode has no participant principal and no reward eligibility; nonfinancial mode has no money consequence |
| ParticipantOccurrence terminal `cancelled` | participant | activity outcome | No action unless a named correction process exists | applicable participant-funded or hybrid slice returns; no bonus or sponsor reward; nonfinancial mode has no money consequence |
| Commitment `available` | participant | commitment | Start or accept not-required rule | `draft` or `not_required` |
| Commitment `draft` | participant | commitment draft | Continue, lock, or abandon | saved private draft |
| Commitment `locked` | participant | commitment detail | Wait for evidence window or use a published pre-deadline correction | immutable task and earlier versions preserved |
| Commitment `evidence_due` | participant | evidence flow | Submit against immutable task | exact deadline and evidence requirement |
| Commitment `terminal`, `abandoned`, `not_required`, or `cancelled` | participant | occurrence activity | Explain closure | prior versions preserved |
| PodParticipationIntent `draft`, applicant-authored | prospective participant | Pod application draft | Submit or cancel | no PodParticipation, room, roster, or financial power |
| PodParticipationIntent `draft`, inviter-authored | inviter | Pod invitation draft | Send or cancel | no PodParticipation, room, roster, or financial power |
| PodParticipationIntent `applied` | applicant | Pod application status | Wait or withdraw | no room, roster, or financial power |
| PodParticipationIntent `invited` | invitee | Inbox Requests | Accept or decline | no room, roster, or financial power |
| PodParticipationIntent `accepted_pending_requirements` | accepted person | Pod requirements | Complete consent, eligibility, or other nonfinancial gate | no secured place until every gate and allocation pass |
| PodParticipationIntent `requirements_satisfied` | accepted person | Pod activation status | Wait for pending participation creation | requirements and acceptance preserved; no active powers |
| PodParticipationIntent `declined`, `revoked`, `expired`, or `withdrawn` | subject | Pod intent result | Explain terminal intent | no PodParticipation or financial power |
| PodParticipation `pending_activation` | person | Pod activation status | Complete the next applicable gate | accepted intent preserved; funding or allocation follows |
| PodParticipation `funding_if_required` | person | Pod funding | Complete the exact funding flow | accepted status is not a secured place; refund policy visible |
| PodParticipation `allocated` | person | Pod allocation status | Wait for roster lock or follow exclusion correction | allocation and funded rights visible |
| PodParticipation `roster_locked` | person | Pod waiting status | Wait for activation | immutable roster position and refund policy visible |
| PodParticipation `active` | participant | Pod workspace | Current execution action | exact contract governs |
| PodParticipation `exit_pending` | participant | Pod exit resolution | Resolve obligations | proof and money rights preserved |
| PodParticipation `cancellation_resolving` | participant | Pod cancellation status | Follow assigned proof, review, settlement, refund, or transfer resolution | no access or obligation is silently dropped; `cancelled` only after closure or durable binding |
| PodParticipation `completed`, `left`, or `removed` | person | Pod relationship history | No new participant action | attribution and own receipts preserved |
| PodParticipation `excluded_at_cutoff` or `cancelled` | person | Pod activation outcome | Follow any separately owed refund | no active access; intent, deposit, and refund history preserved |

### Proof, Deposit, Settlement, and Transfer

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| ProofCase `integrity_checking` | participant | submission status | No action unless fallback offered | platform delay counts toward protection |
| ProofCase `reviewing`, participant view | participant | submission status | Wait for a decision | hard deadline and timeout protection visible |
| ProofCase `reviewing`, reviewer view | reviewer | review assignment | Decide or request the permitted clarification | minimum necessary evidence and hard deadline visible |
| ProofCase `needs_clarification` | participant | clarification | Respond before exact deadline | original evidence and response right preserved |
| ProofCase `rejected` with `disputeAvailability=open` | participant | rejection detail | Dispute before exact expiry | reason, evidence, and provisional outcome preserved |
| ProofCase `disputed`, participant view | participant | dispute status | Wait for resolution | dispute timeout to grace |
| ProofCase `disputed`, reviewer view | reviewer | dispute assignment | Resolve under the frozen policy | prior rejection, new context, and hard deadline preserved |
| ProofCase `approved`, `rejected` with `disputeAvailability=used`, `expired`, or `not_permitted`, `timeout_protected`, or `grace` | participant | proof outcome | No action unless named correction process | ReviewDecision and ParticipantOccurrence aligned |
| ProofCase `cancelled` | participant | proof outcome | No action | occurrence cancellation and any financial return remain authoritative |
| Deposit `intent_created` or `wallet_approval_pending` | funder | funding flow | Confirm wallet or cancel | no credit claimed |
| Deposit `submitted`, `observed`, or `finalized` | funder | deposit tracker | Wait and inspect bounded detail | independent observation status |
| Deposit `credited` or `allocated` | funder | funding or waiting status | Wait for roster lock | liability and cutoff visible |
| Deposit `closed` | funder | financial history | No action | transaction and allocation preserved |
| Deposit `expired` or `rejected` | funder | funding result | Create corrected new intent when eligible | no credited value |
| Deposit `exception_review`, funder view | funder | deposit exception status | Wait for reconciliation | funds cannot be silently credited or lost |
| Deposit `exception_review`, operator view | financial operator | operations deposit exception | Reconcile recipient, asset, amount, reference, source, and finality | no credit or refund without an attributable command |
| Deposit `excluded_at_cutoff`, `refund_queued`, `refund_prepared`, or `refund_submitted` | funder | refund tracker | Wait or complete exact safe action | original funding source and refund obligation |
| Deposit `refund_confirmed` | funder | refund receipt | No action | transaction receipt preserved |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `snapshot_pending`, beneficiary view | participant or sponsor as entitled | settlement status | Complete only an assigned upstream requirement or wait | no entitlement yet; each lane remains independent |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `snapshot_pending`, operator view | financial operator | operations settlement blockers | Resolve the exact operator-owned nonterminal input | no entitlement until the typed barrier closes |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `calculated` or `conservation_verified`, beneficiary view | participant or sponsor as entitled | settlement preview | Inspect the typed calculation or wait | immutable typed snapshot reference visible |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `calculated` or `conservation_verified`, operator view | financial operator | operations settlement run | Verify conservation or investigate a mismatch | no entitlement mutation outside the named command |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `entitlements_created` or `transfers_executing` | beneficiary or returning sponsor | settlement tracker | Follow own transfers | entitlement cannot be silently changed or netted across lanes |
| ParticipantCommitmentSettlement or SponsorAwardSettlement `completed` | beneficiary or returning sponsor | settlement receipt | No action | complete typed conservation and transfer history |
| Hybrid settlement coordination waiting on one lane, beneficiary view | participant or sponsor as entitled | settlement status | Inspect which lane remains pending | completed lane and pool remain immutable and independent |
| Hybrid settlement coordination waiting on one lane, operator view | financial operator | operations settlement coordination | Resolve only the blocked lane's owned exception | completed lane cannot be reopened or netted |
| Transfer `queued` or `prepared` | recipient | transfer tracker | Wait | entitlement preserved |
| Transfer `submitted` or `confirming` | recipient | transfer tracker | Wait and inspect transaction | no blind retry |
| Transfer `confirmed` | recipient | transfer receipt | No action | terminal transaction identity |
| Transfer `unknown`, recipient view | recipient | transfer tracker | Wait for reconciliation | entitlement preserved; no blind retry |
| Transfer `unknown`, operator view | financial operator | operations transfer exception | Prove chain presence or absence | entitlement preserved; retry only after proved absence |
| Transfer `retryable_failed`, recipient view | recipient | transfer tracker | Wait for the next authorized attempt | same entitlement preserved |
| Transfer `retryable_failed`, operator view | financial operator | operations transfer exception | Authorize one bounded retry | same entitlement and a new identified attempt |
| Transfer `mismatched`, recipient view | recipient | transfer tracker | Wait for incident resolution | entitlement preserved and no duplicate transfer |
| Transfer `mismatched`, operator view | financial operator | operations transfer incident | Reconcile the conflicting effect | no retry until exact effect and liability are known |
| Transfer `late`, recipient view | recipient | transfer tracker | Wait for delayed confirmation | entitlement preserved |
| Transfer `late`, operator view | financial operator | operations transfer exception | Reconcile to confirmed, unknown, or manual review | no blind retry |
| Transfer `manual_review`, recipient view | recipient | transfer tracker | Wait for an attributable resolution | entitlement preserved |
| Transfer `manual_review`, operator view | financial operator | operations transfer exception | Confirm, prove absence and retry, or approve alternate closure | complete audit and no duplicate transfer |
| Transfer `no_transfer_required` | recipient | settlement receipt | Explain alternate closure | terminal reason and audit preserved |

### Account End States

| Aggregate and state | Viewer | Canonical destination | Primary action or explanation | Preserved rights and possible next state |
|---|---|---|---|---|
| Account `restricted` or `suspended` | person | account status | Complete allowed recovery or safety step | obligation-preserving and financial access remain |
| Account `deactivated` | person | account recovery | Reactivate within policy or view obligations | public discovery removed |
| Account `deletion_pending` | person | deletion status | Cancel where permitted or review consequences | contracts, evidence, and money preserved |
| Account `deleted` | former subject where legally available | recovery or legal request path | No ordinary product action | required records pseudonymized, obligations retained |

## Coherence Rules

1. One server-derived NextAction appears consistently everywhere.
2. A card reflects the viewer's existing relationship and never offers a
   duplicate Apply or Fund action.
3. Entity lists open detail before high-consequence decisions.
4. Consent, funding, proof, publishing, settlement, and organizer setup use
   progressive steps.
5. Secondary data moves behind explicit detail, not repeated summary cards.
6. Role changes happen within context, not a universal admin mode.
7. Pod is execution, Project is durable work, Event is program, Profile is
   person, and Room is conversation.
8. Public story is curated narrative, private ledger is complete, and chat is
   contextual.
9. Empty states explain the next meaningful path.
10. Social or projection failure never blocks proof or money.

## Interdependencies

Consumes Documents 01 through 17. Documents 19 and 20 attach integrations and
distribution. Document 24 converts destination ownership into routes.
Documents 26 and 27 use these journeys to test the integrated architecture and
carve Mainnet v1.

## Non-Goals

- Final route paths or visual styling.
- One universal dashboard.
- Showing every object in every navigation surface.
- Replacing specialist build tools.
- Making money mandatory.

## Review Findings

- Every actor has one end-to-end success path and named exception paths.
- Event, Project, Pod, room, and profile have distinct jobs.
- Visitors can understand public building without access to raw operations.
- The journey remains useful before financial Mainnet activation.

## Closure Condition

Lock after every state in Documents 07 through 11 maps to a destination and
NextAction, and Document 24 proves no duplicated route ownership.
