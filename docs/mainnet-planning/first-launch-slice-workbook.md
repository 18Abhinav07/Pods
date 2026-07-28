---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, launch-slice, product-strategy, decision-workbook]
status: decision-workbook
---

# Pods First Launch Slice Decision Workbook

Status: proposal for Abhinav's review

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[docs/mainnet-planning/26-integrated-mainnet-architecture|Integrated candidate architecture]] |
[[docs/mainnet-planning/27-validation-and-implementation-sequence|Validation sequence]] |
[[HANDOFF]]

## 1. How to Use This Workbook

This is the single working document for selecting the first Pods Mainnet
product. It consolidates:

- the recommended launch product;
- why builders and organizers would use it;
- the complete first-launch user experience;
- the smallest coherent object and capability set;
- research findings and product hypotheses;
- what is deliberately excluded;
- every decision that still needs Abhinav's call;
- my recommendation for every open decision;
- the validation required before implementation planning.

This document is not:

- an approved product specification;
- an implementation plan;
- a silent amendment to locked Documents 01 through 04;
- authorization for Mainnet deployment, custody, or fund movement.

Abhinav can edit any section directly. The fastest review path is to fill the
`Abhinav decision` column in Section 29 and add product ideas under Section 30.
After that review, the approved decisions will be reconciled into the affected
numbered planning documents. Only validated scope can proceed to an
implementation plan.

## 2. Executive Recommendation

### Recommended launch product

Launch **Pods Build Season**, an execution layer for builder programs.

Its promise is:

> Turn real work across GitHub and other tools into a reviewed execution
> record that teams use to stay aligned, builders use to prove contribution,
> and organizers use to understand and showcase a build program.

### The product has two connected experiences

1. **Builder Execution Workspace**
   - make one short-horizon outcome commitment;
   - work in existing tools;
   - attach a source-observed or manual artifact;
   - receive review;
   - preserve attributable credit;
   - automatically build an Execution Profile and Project journey;
   - generate public updates without rewriting the work.

2. **Organizer Build Program Console**
   - establish a minimum execution protocol for an Event;
   - enroll Projects and contributors;
   - see structured progress and exceptions without reading rooms;
   - operate milestone and review capacity;
   - publish an Event pulse, showcase, and final evidence packet.

Both experiences use the same execution facts. There is no separate builder
portfolio database and no organizer reporting database.

### Recommended first market

Use the Nimiq Mini Apps Competition community as the first design-partner
market. The first live program should run alongside a real Build Season, with
Cycle II as the immediate target if timing and organizer access permit.

The product should complement the competition's existing registration,
community, and final submission surfaces. It should not try to replace them in
the first launch.

### Recommended launch boundary

The first launch includes:

- Google or GitHub Pods identity;
- a complete Builder facet and optional public Execution Profile;
- one opinionated Build Season Event type;
- durable Projects entered into an Event;
- explicit Project contributors and roles;
- one default Core Build Pod and optional focused workstream Pods;
- commitment, artifact, proof, clarification, review, and outcome;
- GitHub source observation plus a manual artifact fallback;
- stable Execution Moments;
- one clean Project room around structured work;
- Project journey, builder timeline, Event pulse, and Shareables;
- a focused organizer progress and exception console;
- nonfinancial operation as the universally available core.

Real NIM economics should be a separately gated controlled capability, not a
dependency of the product's usefulness.

## 3. The Category Pods Should Own

Pods should own:

> **Proof-backed execution history for time-bounded build programs.**

This is different from:

- a task manager, which records intended work;
- a source host, which records code events;
- a chat app, which records conversation;
- a hackathon portal, which records registration and final submission;
- a portfolio, which records selected finished work;
- a social feed, which records what someone chose to post.

Pods connects intent, work evidence, review, attribution, and narrative over
time.

### Product language

- Public product term: **Execution Profile**
- Smallest trusted unit: **Execution Moment**
- Durable team outcome: **Project Journey**
- Time-bounded organizer program: **Build Season**
- Focused execution lane: **Pod**
- Internal architecture term only: **Passport**

The public product should not lead with "reputation score," "proof of work,"
"crypto," or "portfolio."

## 4. Research Findings

### 4.1 Current hackathon products are strongest at event administration

Devpost describes its core flow as publishing events, registering
participants, collecting project submissions, and running judging. Its Project
Gallery is primarily a submitted-project surface, normally opened after the
submission deadline and moderation.

Source:
[Devpost: How hackathons work](https://help.devpost.com/article/307-how-hackathons-on-devpost-work),
"What is Devpost?"

Source:
[Devpost: Project Gallery](https://help.devpost.com/article/80-what-is-the-project-gallery),
"What is the project gallery?"

HackQuest's organizer dashboard covers event setup, applications, project
submissions, judging, announcements, and traffic distribution.

Source:
[HackQuest Organizer Guide](https://www.docs.hackquest.io/guide/hackathon/organizer),
"Create Hackathon" and "Manage Hackathon"

DoraHacks' organizer materials cover event setup, promotion, participant
support, submissions, team coordination, and judging.

Source:
[DoraHacks Organizer Guide](https://hellodorahacks.github.io/dorahacks-wiki/hackathon-organizer-guide/),
"Hackathon Organizer's Guide"

**Research inference:** These products already establish a strong baseline for
registration, submission, judging, and announcement. The official flows
reviewed above do not present a cross-tool, contributor-attributed daily
execution record as their central product. Pods should complement them during
the build period rather than attempt to rebuild their entire event stack.

### 4.2 GitHub records activity, but not the complete execution story

GitHub profiles expose contribution activity, but contribution visibility
depends on repository, branch, collaborator, account-email, and other
criteria. GitHub also limits some displayed contribution items. A contribution
event does not explain the intended outcome, non-code work, review context, or
why the work mattered to an Event.

Source:
[GitHub Profile Contributions Reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference),
"What counts as a contribution"

GitHub Apps can receive repository events such as pushes and pull requests
through permission-scoped webhooks. This makes GitHub a strong source
observer, but the observation still cannot prove work quality or complete
authorship.

Source:
[GitHub Apps and Webhooks](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps),
"About webhooks and GitHub Apps"

**Product implication:** Pods should not recreate GitHub activity. It should
let GitHub propose eligible artifacts, then add commitment context, human
attribution, scoped review, and an Event or Project narrative.

### 4.3 Internal project-update tools validate structured progress

Linear supports structured Project updates, history, health, reminders, and
Slack delivery. This validates the value of concise progress units and
stakeholder-ready summaries.

Source:
[Linear Initiative and Project Updates](https://linear.app/docs/initiative-and-project-updates),
"Overview" and "Progress reports"

**Product implication:** Pods should generate structured progress from
execution facts rather than require a lead to author every update manually. It
should also make the result portable to the builder and Event, not keep it
only inside one company workspace.

### 4.4 Automatic developer metrics reduce effort but can reward the wrong thing

WakaTime automatically detects editor activity and shows time, project,
language, goals, and leaderboards.

Source:
[WakaTime Developer Dashboards](https://wakatime.com/remote-developers),
"Projects and Languages" and "Leaderboards"

**Product implication:** Automatic collection matters, but Pods should not
rank people by time, commits, or message volume. An artifact is useful only
when connected to a declared outcome and exact claim basis.

### 4.5 The initial community already wants connection, feedback, and shipping

The Nimiq Mini Apps Competition community explicitly describes its purpose as
helping builders meet collaborators, share ideas, get feedback, join live
sessions, and ship real products.

Source:
[Nimiq Mini Apps Competition Community](https://www.skool.com/miniappscompetition/about),
"Inside the community"

**Product implication:** Pods should not replace this community. It should
turn each participating Project's actual execution into a structured layer
that can be shared back into the community.

## 5. The Market Gap

The current workflow for a builder team is fragmented:

```text
event registration in one platform
-> team discussion in Discord, Skool, or WhatsApp
-> issues and plans in GitHub, Linear, or Notion
-> code in GitHub
-> design in Figma
-> demos on deployment platforms
-> manual progress posts on X or community channels
-> final submission assembled from memory
-> finished Project added to a portfolio, if anyone has time
```

No source gives one accurate answer to:

- What did this builder commit to?
- What did they actually deliver?
- Which artifact supports that claim?
- Who reviewed or accepted it?
- Which teammate contributed what?
- How did the Project evolve during the Event?
- Which facts can be shown publicly?
- Can the organizer understand progress without reading every chat?

Pods should answer those questions without asking teams to replace their
existing specialist tools.

## 6. Approaches Considered

### Approach A: Full hackathon platform

Build registration, team formation, applications, submissions, judging,
prizes, community, and execution.

**Advantage:** One platform owns the entire Event.

**Problem:** It competes directly with established products, creates a very
large first scope, and makes the execution innovation only one feature among
many.

**Decision:** Do not choose for first launch.

### Approach B: Builder portfolio and social profile

Connect GitHub, generate a timeline, and let builders share it.

**Advantage:** Smaller build and easy public explanation.

**Problem:** It creates value after work but does not become a tool teams need
while working. It risks becoming another profile builders set up once and
abandon.

**Decision:** Do not choose as the complete product.

### Approach C: Build program execution layer

Let organizers operate a Build Season, let Projects execute through
commitment and evidence loops, then derive profiles, stories, and reports from
the same work.

**Advantage:** Produces operational utility before reputation, serves both
builders and organizers, and complements existing event platforms.

**Problem:** Requires careful review workload, permissions, integrations, and
information architecture.

**Recommendation:** Choose this approach.

### Where Pods sits beside existing tools

| Existing tool category | What it remains best for | What Pods adds |
|---|---|---|
| Skool, Discord, WhatsApp | community discussion and announcements | structured reviewed work that does not disappear in a message stream |
| GitHub | source, collaboration events, and repository history | commitment context, non-code work, scoped review, Event meaning, and portable attribution |
| Linear, Notion, Jira | internal planning and task management | proof-backed execution history and public-safe narrative |
| Devpost, DoraHacks, HackQuest | registration, submissions, judging, and Event administration | the live execution layer between acceptance and final submission |
| X and other social platforms | audience and distribution | accurate editable content generated from the work record |

Pods is valuable only if teams can keep those tools and reduce duplicate
reporting.

## 7. Product Jobs

### Builder

> Help me make my intended contribution clear, capture the work I already do,
> retain fair credit, and turn my execution into something I can share without
> becoming a content creator.

### Project lead

> Help my team keep short commitments visible, understand what is actually
> shipping, resolve blockers, and produce a coherent public Project story
> without running another task-management system.

### Organizer

> Help me see which Projects are active, blocked, behind, or ready to
> showcase without reading every room or asking every team for a status
> update.

### Reviewer

> Give me the exact commitment, evidence, claim basis, and decision controls
> needed to make a fair scoped decision quickly.

### Visitor, judge, sponsor, or future collaborator

> Show me a clean, attributable build journey with inspectable artifacts
> instead of a final claim that hides how the Project was built.

### Commercial user and future buyer

The builder should be able to establish identity, join a Project, execute, and
retain their attributable history without an organizer purchasing a seat.

The likely first buyer is the Event organizer or community running a Build
Season. They would eventually pay for the operational result:

- structured Project enrollment;
- program progress and exception visibility;
- review-capacity operations;
- public Event pulse and Project spotlights;
- final showcase and evidence export;
- durable Event reporting.

This workbook does not set pricing, packaging, or feature gates. It identifies
the user receiving value and the operator with a plausible reason to buy.

## 8. The First Launch Promise

### Builder promise

By the end of a Build Season, every participating builder can leave with:

- an attributable record of what they delivered;
- an Execution Profile that shows selected work across Projects;
- a Project Journey showing how the team built;
- share-ready progress and milestone updates;
- clear credit on multi-contributor artifacts;
- history that remains after the Event ends.

### Organizer promise

During and after a Build Season, the organizer can:

- know which Projects have started meaningful work;
- see the latest reviewed execution per Project;
- identify missing commitments, stale Projects, review backlog, and milestone
  risk;
- publish accurate phase highlights;
- produce a showcase and evidence packet without reconstructing the Event from
  scattered messages.

### Trust promise

Pods will state only what its evidence supports:

- GitHub observed an artifact;
- a named participant attached it to a commitment;
- a named authorized reviewer accepted or rejected that commitment;
- selected contributors consented to a public projection.

Pods will not claim that:

- every line was written by the named person;
- the work is original, secure, useful, or high quality;
- a large commit count means better execution;
- a private failure should become a public reputation penalty.

## 9. Canonical First-Launch Object Graph

```text
Organization, optional minimal Event host
  -> Build Season Event
     -> EventEntry
        -> one durable Project
           -> ProjectContribution records
           -> BuildMilestones
           -> one default Core Build Pod
           -> optional focused workstream Pods
              -> Occurrences
                 -> ParticipantOccurrences
                    -> Commitment
                    -> ProofCase and ProofSubmission
                    -> ReviewDecision
                    -> ActivityMoment presented as an Execution Moment

Execution Moment
  -> Builder Execution Profile
  -> Project Journey
  -> Organizer Program Pulse
  -> Public Shareable
```

Important boundaries:

- The Project is durable and can outlive or enter multiple Events.
- EventEntry owns Event-specific roster, rules, milestones, and outcome.
- A Pod is an execution lane, not a child Project or generic folder.
- The room is a conversation projection around Project work.
- No visual nesting grants permission.
- One source fact can power several safe projections without being copied into
  several sources of truth.

## 10. The Smallest Trusted Unit: Execution Moment

An **Execution Moment** is the Build and Ship product presentation of one
stable `ActivityMoment`. It is not a second source-of-truth record. It is
produced when:

1. a participant locks a concrete short-horizon outcome;
2. the participant submits one or more eligible artifacts;
3. the participant confirms their contribution and any co-contributors;
4. an authorized reviewer reaches a terminal decision;
5. visibility and publication consent are resolved.

The same card updates in place through:

```text
committed
-> evidence attached
-> under review
-> clarification if needed
-> approved | rejected | timeout protected | grace | missed
```

Only an approved result qualifies as a reviewer-accepted Execution Moment.
Timeout protection and grace retain their exact labels. Rejected and missed
work remain private by default.

### Execution Moment fields

- actor and declared contribution role;
- Project, EventEntry, Pod, milestone, and occurrence context;
- commitment outcome;
- artifact references;
- source-observation basis;
- review decision and policy version;
- contributor attribution;
- effective and recorded time;
- private, shared-context, and public projection eligibility;
- concise authored outcome summary;
- correction and supersession references.

### Observed Contribution

GitHub or another authorized integration may detect useful work that had no
prior commitment. Pods presents the eligible `SourceObservation` and
`BuildArtifact` as an **Observed Contribution**, not as a new canonical object
or reviewed Execution Moment.

It may:

- appear privately in the builder's evidence inbox;
- be attached to an open commitment;
- support a milestone submission;
- be included in a Project Journey with its weaker claim basis where policy
  permits.

It may not silently receive the same claim as precommitted, reviewed work.

## 11. Commitment Design

Commitments must be lighter than tasks.

### Required fields

- one outcome sentence;
- Pod or workstream;
- applicable milestone;
- due occurrence;
- expected artifact type;
- optional co-contributor;
- evidence and public-visibility defaults.

### Not supported

- subtasks;
- story points;
- dependency graphs;
- priority matrices;
- sprint backlogs;
- time estimates;
- arbitrary issue assignment;
- manager productivity scoring.

### Creation sources

- the builder creates their own commitment;
- a Project lead proposes an outcome that the builder must accept before it
  locks;
- an Event or Project template suggests a commitment;
- a GitHub observation can be attached to an already open commitment but does
  not create a retroactive precommitment.

## 12. Artifact and Proof Model

### Launch artifact types

- Git commit or commit range;
- pull request;
- issue resolution;
- release;
- deployment or live demo URL;
- design link or export;
- research or decision document;
- documentation;
- image, PDF, or safe external link.

### Proof submission

A submission asks only:

1. What did you deliver?
2. Which artifacts support it?
3. What was your contribution?
4. Who else should receive credit?
5. What can teammates or the public see?

Blockers and learning notes are optional narrative fields. They do not change
the decision.

### Visibility layers

- `reviewer_only`: evidence needed only for the decision;
- `project_shared`: safe material visible to active contributors;
- `public`: selected material eligible for Project, Event, profile, and
  Shareable projection.

The participant chooses visibility before submission. A Project lead cannot
raise another person's visibility.

## 13. Review Model

### Recommended authority

- A Project names one or more reviewers.
- A reviewer may be a Project lead, contributor, mentor, or Event reviewer
  with the exact grant.
- A reviewer cannot decide their own submission.
- A teammate reviewer handles routine occurrences.
- An Event reviewer handles solo Projects or declared conflicts.
- Organizers manage reviewer coverage and exceptions, not every daily
  decision.

### Review actions

- approve;
- request one clarification;
- reject with a specific reason;
- recuse for conflict;
- reconsider once where the participant disputes a rejection.

### Claim levels

Pods must show a claim basis, not one universal badge:

1. `source_observed`
2. `participant_attested`
3. `reviewer_accepted`
4. `milestone_achieved`
5. `event_result_recorded`

Higher levels do not erase the lower-level source details.

## 14. Complete Builder Journey

### 14.1 Establish identity

```text
Sign in with Google or GitHub
-> choose globally unique username and display name
-> accept current product terms and age flow
-> optionally enable Builder facet
-> add roles, skills, collaboration interests, and availability later
```

GitHub sign-in and GitHub work access remain separate permissions.

### 14.2 Enter a Build Season

```text
Open Event link
-> understand purpose, dates, protocol, public terms, and official Event link
-> create a new Project or select an eligible existing Project
-> invite or confirm contributors
-> accept the EventEntry charter
-> activate the entry after required roster and consent gates
```

The first launch does not need to replace the organizer's official eligibility
or prize application system. An organizer may invite or approve already
accepted Projects.

### 14.3 Set up the Project

```text
Define Project promise and intended user
-> connect selected GitHub repositories
-> define 2 to 4 meaningful Build Milestones
-> accept the default Core Build Pod
-> optionally add focused Pods for frontend, backend, design, research,
   launch, contracts, or documentation
-> assign routine reviewers
```

### 14.4 Execute each occurrence

```text
Today shows one next action
-> lock one outcome
-> work in GitHub, Figma, local tools, or another source
-> Pods proposes observed artifacts where available
-> attach artifacts and confirm contribution
-> submit
-> reviewer decides
-> stable Execution Moment updates
-> Project room receives the structured card
-> eligible timelines and summaries update
```

The target interaction is short enough to complete after the real work, not
another reporting session.

### 14.5 Publish without reconstructing the story

```text
Open approved Execution Moment or weekly Project chapter
-> inspect included facts and credits
-> add optional narrative
-> choose public audience
-> generate image, link, and editable text
-> use native share, copy, or download
```

### 14.6 Finish the Event

```text
Complete final milestone
-> freeze EventEntry result
-> generate Project Build Report
-> approve contributor credits and public sections
-> publish Project Journey and Event showcase
-> retain Project for the next Event
-> retain selected work on each contributor's Execution Profile
```

## 15. Complete Project Lead Journey

```text
Create or select Project
-> define Project promise
-> invite contributors with explicit roles
-> connect repositories and public links
-> enter Build Season
-> freeze Season-specific charter
-> define milestones
-> start Core Build Pod
-> add a focused Pod only when work separation is useful
-> assign reviewers
-> see commitment coverage, reviewed outcomes, and blockers
-> respond in Project room
-> curate Project chapters from already eligible work
-> resolve contributor changes without rewriting history
-> complete EventEntry
-> continue durable Project
```

The Project lead may curate eligible Project facts but cannot:

- claim another person's contribution;
- approve their own evidence;
- expose private artifacts;
- edit a terminal review result;
- turn chat volume into execution credit.

## 16. Complete Organizer Journey

### 16.1 Create the Build Season

The opinionated setup wizard asks for:

- Event identity and official external Event link;
- build period, timezone, phases, and deadlines;
- Project entry policy and capacity;
- required Project profile fields;
- minimum commitment cadence;
- 2 to 4 required Event milestones;
- artifact and proof policy;
- reviewer and conflict policy;
- public Event pulse and contributor-consent terms;
- external final submission and judging handoff;
- optional externally fulfilled reward reference.

It does not expose a generic workflow builder.

### 16.2 Enroll Projects

```text
Invite accepted Projects or open bounded Project registration
-> review minimum entry data
-> confirm exact contributors
-> collect Event and public-story consent
-> activate EventEntries
```

### 16.3 Operate the Event

The organizer console answers:

- How many Projects are active?
- Which Projects have no recent reviewed work?
- Which Projects have not covered the current commitment window?
- Which milestones are at risk?
- Which proof cases or clarifications are waiting?
- Which reviewers are overloaded?
- Which public updates are ready?
- Which Projects are ready for final submission or showcase?

Each risk is explainable and private. Message volume, commit count, money, and
follower count are not health metrics.

### 16.4 Communicate progress

The organizer can generate:

- kickoff roster;
- weekly Event pulse;
- milestone highlight;
- Project spotlight;
- final showcase;
- judge or sponsor evidence packet;
- Event recap.

Only already eligible facts and opted-in contributors can be selected.

### 16.5 Complete the program

```text
Close required milestones
-> identify incomplete or unresolved entries
-> export or link final evidence to official judging
-> record external result when authorized
-> publish final showcase
-> archive Event
-> preserve Projects and builder execution history
```

## 17. Complete Reviewer Journey

```text
Open review assignment
-> inspect exact commitment and evidence requirements
-> confirm no conflict
-> view minimum necessary artifacts
-> approve, clarify, reject, or recuse
-> if clarified, inspect only the new evidence and original context
-> if disputed, reconsider under the same frozen rule
-> close assignment
```

The review surface should show:

- who made the commitment;
- what they promised;
- what they say they delivered;
- source-observation status;
- declared co-contributors;
- evidence visibility;
- decision deadline;
- exact consequence of each action.

## 18. Complete Visitor Journey

```text
Open Event, Project, builder, or Execution Moment link
-> understand what is being built and current stage
-> inspect selected public artifacts
-> see who contributed to each public moment
-> inspect claim basis
-> follow the Project journey
-> share the public page
-> sign in only when applying, connecting, or creating
```

Visitors do not see:

- raw member chat;
- reviewer-only proof;
- rejected or missed work by default;
- hidden contributors;
- private repositories;
- participant finances;
- internal risk labels.

## 19. Information Architecture

### 19.1 Global application

Recommended mobile navigation:

- **Today:** exact current obligations and review actions;
- **Work:** Events, Projects, and Pods the person belongs to;
- **Explore:** public Events, Projects, and query-based builder discovery;
- **Inbox:** Requests, Updates, and Messages;
- profile avatar opens identity, Execution Profile, integrations, and settings.

### 19.2 Context ownership

| Surface | Owns |
|---|---|
| Today | prioritized actions only |
| Work | relationship inventory and status |
| Event | protocol, Projects, phases, pulse, and organizer operations |
| Project | promise, contributors, milestones, Pods, room, and journey |
| Pod | cadence, occurrences, commitments, and activity lane |
| Review | proof evidence and decision |
| Publishing Studio | audience, narrative, credits, and output |
| Execution Profile | selected attributable history and facet claims |
| Organizer Console | aggregate progress and exceptions |

No screen reproduces another surface's full inventory.

### 19.3 Recommended room topology

Use one Project room as the default conversation surface.

It contains:

- human messages and replies;
- announcements;
- stable Execution Moment cards;
- milestone cards;
- reactions that do not affect review;
- filters for All, Work, Announcements, and a selected Pod.

Pods remain focused execution lanes. They do not receive separate chatrooms in
the first launch. This prevents a Project with five Pods from becoming six
fragmented chats.

This recommendation requires a scoped amendment to Document 14 if approved.

### 19.4 Delivery surfaces

Use one responsive product and one backend with two optimized entry
environments:

- builders use the mobile-first product in Nimiq Pay or a mobile browser;
- organizers use the same product in a normal browser with a desktop-efficient
  console;
- public Event, Project, profile, and Shareable pages work without Nimiq Pay;
- authenticated builder actions retain complete mobile layouts;
- no organizer capability exists only through a desktop hover interaction.

Authentication and deep-link behavior across the normal browser and Nimiq Pay
WebView remain validation requirements.

## 20. Keeping the Product Clean Instead of Becoming Chat Plus Proof

The following rules are non-negotiable:

1. Chat never owns work state.
2. Each commitment and review appears as one stable card that updates in
   place.
3. The Project Journey contains only Execution Moments, milestones, releases,
   selected NarrativeUpdates, and official Event results.
4. Routine messages never enter timelines.
5. Project room filters separate conversation from structured work.
6. Today shows one next action, not every possible Project statistic.
7. Organizer views aggregate facts and exceptions, not room transcripts.
8. Public pages show curated activity, never raw member chat.
9. Dense periods collapse into weekly chapters while preserving drill-down.
10. A user proves work once. Every eligible projection reuses that fact.

## 21. GitHub Integration

### Required launch behavior

1. GitHub authentication can create or access a Pods identity.
2. GitHub work connection is separately authorized.
3. A repository owner installs the Pods GitHub App.
4. A Project lead selects exact repositories.
5. Pods receives permission-scoped source observations.
6. The builder sees suggested evidence for an open commitment.
7. The builder explicitly attaches the observation.
8. A reviewer decides the commitment.

### Initial observations

- commits;
- pull requests;
- issues;
- releases;
- deployments only if the validation spike proves a reliable supported event.

### Required fallback

Manual link, image, PDF, design, documentation, and demo evidence must remain
available. GitHub cannot become a gate for designers, researchers, writers,
product contributors, or non-code milestones.

### Required honesty

The interface must distinguish:

- observed by GitHub;
- attributed to a connected GitHub account;
- attached by the participant;
- accepted by a Pods reviewer.

## 22. Distribution and Publishing Studio

Pods should turn one approved fact into several user-controlled outputs:

- short progress update;
- Project milestone announcement;
- weekly build recap;
- Event highlight;
- final Project story;
- builder Execution Profile entry;
- image card;
- canonical public link.

Initial destinations:

- X;
- Discord;
- Skool;
- Telegram;
- WhatsApp;
- any native share target.

Initial behavior:

- native Web Share where supported;
- copy editable text;
- copy public link;
- download image card;
- download Project or Event recap.

Pods should not auto-post in the first launch. It cannot prove external
publication through a resolved native share promise, and each platform creates
additional permission and reconciliation risk.

## 23. Execution Profile

The Execution Profile is not a traditional portfolio.

It shows selected evidence-backed answers to:

- Which Projects has this person contributed to?
- Which roles did they hold?
- What outcomes did they repeatedly deliver?
- Which artifacts and milestones support those claims?
- Which Events were those contributions part of?
- What did teammates or authorized reviewers accept?

### Recommended profile composition

- compact identity and Builder facet;
- roles, skills, interests, and current collaboration intent;
- selected active Project;
- recent approved Execution Moments;
- Project and Event history;
- facet-specific evidence-backed signals with denominators;
- up to six pinned Projects, milestones, or artifacts;
- availability and contact policy.

There is no global score, universal rank, or public failure wall.

## 24. Project Journey

The Project Journey is the durable build story generated from the same facts:

- Project promise and intended user;
- current phase;
- Build Milestones;
- approved Execution Moments;
- important Observed Contributions with their weaker claim basis;
- releases, deployments, and demos;
- contributor credit by outcome;
- authored weekly chapters;
- Event entries and results;
- next direction after the Event.

A visitor should understand the Project without reading the room.

## 25. Event Pulse and Organizer Output

The public Event pulse may show:

- Event purpose and current phase;
- activated Projects;
- public contributors;
- recent approved moments;
- milestone progress;
- Project spotlights;
- releases and demos;
- final showcase.

The private organizer view may additionally show:

- missing commitment coverage;
- stale Projects;
- review and clarification backlog;
- milestone risk;
- incomplete final evidence;
- visibility or moderation exceptions.

Private risk is never projected as public reputation.

## 26. Privacy, Consent, and Attribution

### Defaults

- New profiles are private.
- New evidence is reviewer-only unless the participant changes it.
- Project room access requires an active Project relationship.
- Public Project building is opt-in.
- Public Event participation terms are accepted before entry activation.

### Event-required public building

An Event may require a public-safe progress summary as a condition of
participation only when:

- the requirement is visible before entry acceptance;
- the exact public data categories are named;
- raw evidence and room chat remain excluded;
- each contributor confirms their own public identity projection;
- a contributor can decline participation instead of being silently exposed.

### Attribution

- Every artifact retains its source authors, participant claims, and accepted
  contributor credits separately.
- A Project lead cannot remove a contributor from historical accepted work.
- Co-contributor credit requires each named person's confirmation where
  feasible.
- Leaving a Project stops new authority but never removes historical credit.
- Corrections supersede presentation without deleting audit history.

## 27. Economic Boundary

### Recommendation

Launch the complete execution product in nonfinancial mode. Add real NIM only
as a controlled capability after the financial validation gates pass.

### Why

- The product must prove that teams return for execution value, not only
  because money is at risk.
- Mainnet custody, signer, legal, limits, reconciliation, and incident
  ownership remain unresolved.
- Making money mandatory would exclude youth and increase onboarding friction.
- A nonfinancial Event can still use externally fulfilled prizes.

### Controlled NIM lane

If selected later, the first financial lane should be exactly one of:

- participant-funded commitment;
- organizer-funded objective completion reward.

It should be:

- adult-only;
- NIM-only;
- allowlisted;
- low-limit;
- separately activated;
- isolated from nonfinancial execution;
- incapable of changing review or reputation rules.

USDT, mixed assets, hybrid pools, and public unrestricted financial Events
should not enter the first controlled launch.

## 28. Recommended Launch Program

### Pilot shape

- 1 Build Season;
- 5 to 10 active Projects;
- 2 to 5 contributors per Project;
- 3 to 4 weeks;
- one default Core Build Pod per Project;
- optional additional workstream Pods;
- at least 2 required Event milestones;
- GitHub plus manual evidence;
- one public weekly Event pulse;
- one final Project report and Event showcase.

### Recommended Nimiq use

Run the product alongside Nimiq Mini Apps Competition Cycle II if the timing is
feasible:

1. Pitch Pods as a companion execution layer, not an official replacement.
2. Recruit a small design-partner cohort even if organizer integration is not
   official.
3. Let each Project preserve its Cycle II build history.
4. Publish a weekly public pulse back into Skool.
5. Generate final Project stories and a community showcase.
6. Use measured organizer and builder outcomes to propose a larger Cycle III
   partnership.

### Launch narrative

> Hackathons show the final project. Pods shows how it was actually built and
> who made it happen.

## 29. Decisions for Abhinav

Fill `Approve`, `Change`, or a short replacement in the last column.

| ID | Choice | Options | Recommendation | Abhinav decision |
|---|---|---|---|---|
| D01 | Product category | full hackathon platform / builder profile / build-program execution layer | execution layer | |
| D02 | Initial acquisition | official organizer contract first / community-run pilot first / open public launch | community-run design-partner pilot while pitching organizers | |
| D03 | Event-platform relationship | replace registration and judging / complement existing platforms | complement existing platforms | |
| D04 | Project availability | only inside Events / event-led but usable outside and after Events / fully general Project network | event-led, durable, and usable after the Event | |
| D05 | Organization scope | full Organization membership / minimal Event host / no Organization | minimal Event host | |
| D06 | Team object in launch | full durable Teams / Project contributors only | Project contributors only; retain Team in architecture for later | |
| D07 | Default Pod structure | one Pod only / one Core Build Pod plus optional workstream Pods / mandatory Pod per discipline | Core Build plus optional workstreams | |
| D08 | Room topology | Project room only / room per Pod / both by default | one Project room with Pod filters | |
| D09 | Commitment cadence | organizer fixed / Project fixed / Event minimum plus Project choice | Event minimum plus Project choice | |
| D10 | Commitment source | self-created only / lead-assigned / self-created plus lead proposal requiring acceptance | self-created plus accepted proposal | |
| D11 | GitHub requirement | mandatory for all / optional globally but contract-configurable / no GitHub in launch | optional globally, required only by a disclosed Event or milestone rule | |
| D12 | Manual evidence | allow / GitHub only | allow for non-code and fallback | |
| D13 | Routine reviewer | organizer / Project lead or assigned teammate / peer vote | assigned Project reviewer; organizer covers solo Projects and exceptions | |
| D14 | Self-review | allow equal claim / forbid and block / allow self-attested lower claim | lower claim unless another reviewer accepts | |
| D15 | Rejection appeal | no appeal / one reconsideration / full dispute panel | one reconsideration | |
| D16 | Public default | public / private / Event decides silently | private; Event may require a disclosed safe summary before entry | |
| D17 | Execution credit | commits and time / approved commitment plus proof / lead-authored summary | approved commitment plus proof | |
| D18 | Retroactive work | equal Execution Moment / Observed Contribution with weaker claim / exclude | weaker Observed Contribution | |
| D19 | Public product term | Builder Passport / Builder Profile / Execution Profile | Execution Profile | |
| D20 | External distribution | auto-post / draft and native handoff / links only | editable draft, card, link, and native handoff | |
| D21 | Social scope | DMs, follows, friends, feed / builder discovery and Project invitations only / no social | discovery, matching intent, and Project invitations only | |
| D22 | Organizer judging | full scoring engine / evidence packet and export / no judging support | evidence packet and external handoff | |
| D23 | Organizer surface | mobile only / desktop only / responsive with desktop-dense console | responsive, builder-mobile-first and organizer-desktop-efficient | |
| D24 | Economics at launch | mandatory NIM / optional controlled NIM / nonfinancial only forever | nonfinancial core plus separately gated NIM pilot | |
| D25 | First controlled financial mode | participant-funded / organizer-funded / both | choose one only after product pilot and financial gates | |
| D26 | Initial cohort | 3 to 5 Projects / 5 to 10 / 20+ | 5 to 10 | |
| D27 | Event milestones | fully custom / fixed three / organizer chooses 2 to 4 from typed templates | typed templates with 2 to 4 selected | |
| D28 | Public activity density | every approved occurrence / weekly chapters only / both with collapse | moments with automatic weekly collapse | |
| D29 | AI narrative | auto-publish / editable draft / no AI | editable draft only after source facts are frozen | |
| D30 | Standalone Project creation | at launch / after first Event pilot | after the first Event pilot unless a design partner requires it | |

## 30. Abhinav Additions and Corrections

Add:

- missing builder need;
- missing organizer need;
- feature that is essential to the first launch;
- feature that should be removed;
- correction to the hierarchy;
- correction to review or attribution;
- correction to the launch audience;
- any product language that does not match the intended identity.

### Additions

1.
2.
3.

### Corrections

1.
2.
3.

## 31. Explicit First-Launch Scope

### Required

- canonical Person and minimal profile;
- Builder facet, roles, skills, and matching intent;
- Build Season Event;
- durable Project and EventEntry;
- ProjectContribution roster and invitations;
- Build Milestones;
- Core Build Pod and optional workstream Pods;
- occurrences and participant commitments;
- GitHub work connection and selected repositories;
- manual artifact fallback;
- proof, clarification, review, and exact terminal outcomes;
- Execution Moments and Observed Contributions;
- Project room with structured activity cards;
- Today, Work, Explore, Inbox, and Profile;
- Project Journey;
- Execution Profile;
- Event pulse and organizer exception console;
- Shareables and native distribution handoff;
- public, shared-context, and private projections;
- audit and correction history;
- mobile builder experience and responsive organizer experience.

### Deliberately deferred

- full generic hackathon registration replacement;
- complete judging and prize platform;
- sponsor management;
- universal Organization and Team collaboration suite;
- DMs, friend graph, following feed, and social popularity metrics;
- Move, Reading, Study, and other activity domains;
- automatic X, Discord, or Skool posting;
- Figma, Linear, Notion, Discord, and wearable source integrations;
- AI work-quality judgment;
- AI-generated facts;
- universal execution score;
- task-management hierarchy;
- code hosting;
- video meetings;
- marketplace;
- custom workflow builder;
- account merging;
- unrestricted Mainnet economics;
- USDT and mixed-asset contracts.

## 32. Product Success Criteria

These are pilot hypotheses, not guaranteed market facts.

### Builder activation

- A builder reaches their first commitment without setup assistance.
- A connected repository produces understandable suggested evidence.
- A builder can complete proof submission in less than two minutes after the
  real work is done.

### Repeat use

- Most activated Projects produce at least three reviewed Execution Moments.
- Builders return across at least three separate occurrence windows.
- Project leads continue using the room and progress surfaces without creating
  duplicate status spreadsheets.

### Attribution

- Every public moment names exact contributors and claim basis.
- A builder can point to a canonical page showing their role in a Project.
- Project leads cannot erase historical accepted credit.

### Organizer utility

- The organizer can identify inactive, blocked, and showcase-ready Projects
  without opening member rooms.
- Weekly pulse creation takes minutes rather than manual reconstruction.
- Final Project evidence is available before the official submission
  deadline.

### Distribution

- Builders or leads use generated Shareables.
- Shared links lead visitors to understandable Project or builder context.
- Public pages remain meaningful without exposing raw chat.

## 33. Failure Conditions That Should Stop or Change the Product

The wedge is not validated if:

- builders use the room but ignore commitments;
- proof submission feels like duplicate reporting;
- GitHub suggestions create more cleanup than saved effort;
- reviewers cannot keep up with the selected cadence;
- solo builders cannot obtain a credible review;
- organizers still need to read rooms for basic progress;
- public timelines resemble commit walls;
- contributor attribution creates repeated disputes;
- builders do not share or revisit their Execution Profile;
- the organizer sees no value beyond an existing spreadsheet;
- the product is useful only when money is at risk.

Each failure changes the product before expanding scope.

## 34. Required Validation Before Implementation Planning

### Product validation

1. Walk the complete flow with 5 builders, 2 Project leads, and 1 organizer.
2. Use real GitHub artifacts from at least 3 different contribution roles.
3. Manually generate the proposed Execution Profile, Project Journey, Event
   pulse, and final report from those facts.
4. Measure reporting effort and reviewer load.
5. Test the solo-builder review path.
6. Confirm that visitors understand the Project without room access.

### Architecture-killing spikes

Document 27 already requires:

- Spike A: canonical Google and GitHub authentication plus safe linking;
- Spike B: GitHub App installation, observation, attribution, revocation, and
  reconciliation;
- Spike C: durable command, fact, outbox, replay, and idempotency.

All selected capabilities remain blocked until their required spikes record
PASS.

### Additional slice-specific validation

- Project room with filtered stable activity cards;
- one fact projecting safely to builder, Project, Event, and Shareable;
- contributor publication consent;
- native Web Share and fallback behavior in Nimiq Pay WebView;
- mobile builder flow and responsive organizer console;
- Event import or invitation handoff from an existing platform;
- public-page redaction for private repositories and hidden contributors.

### Conditional financial validation

If D24 selects a real NIM pilot, custody, legal, signer, limits,
reconciliation, environment isolation, incident response, and physical-device
financial gates become blocking. They are not bypassed by the working Testnet
implementation.

## 35. Reconciliation With the Existing Mainnet Package

| Document | First-launch treatment |
|---|---|
| 01 Person, Account, Identity | use locked contract |
| 02 Profile Facets | use Builder facet and matching intent |
| 03 Actors and Roles | select builder, Project lead, reviewer, organizer, visitor, and services |
| 04 Object Graph | use locked graph; omit Team UI without removing the object |
| 05 Access and Consent | required dependency |
| 06 Commands and Facts | required dependency |
| 07 Event Lifecycle | narrow first public Event type to Build Season |
| 08 Project Lifecycle | required; Project persists after Event |
| 09 Pod and Commitment | required; select Build and Ship subset |
| 10 Proof and Review | required; first launch uses one clarification and reconsideration |
| 11 Economics | nonfinancial core; real NIM remains conditional |
| 12 Activity and Shareables | required and central |
| 13 Passport | public language becomes Execution Profile; no global score |
| 14 Rooms | proposed amendment: one Project room, Pods as filtered execution lanes |
| 15 Attention | Today, Inbox, and reliable projection invalidation required |
| 16 Build and Ship | primary domain contract |
| 17 Organizer Operations | narrow from full Season platform to execution-layer console |
| 18 Journeys | replace broad candidate flow with selected launch journeys |
| 19 GitHub | architecture-killing dependency |
| 20 Distribution | native handoff and public links required |
| 21 Domain Extensions | deferred except preserving the extension boundary |
| 22 Data and Workers | required for authoritative facts and projections |
| 23 Security and Operations | required; financial portion conditional |
| 24 Information Architecture | narrow to the selected surfaces |
| 25 Release Topology | Mainnet and Testnet isolation required |
| 26 Integrated Architecture | amend after decisions are approved |
| 27 Validation Sequence | select exact spikes, then write no plan until PASS |

## 36. Recommended Decision Order

Review the choices in this order:

1. D01 to D04: product and market boundary;
2. D06 to D10: Project, Pod, room, and commitment shape;
3. D11 to D18: proof, review, and execution-credit semantics;
4. D19 to D23: public product, distribution, social, and organizer surface;
5. D24 to D25: economic boundary;
6. D26 to D30: pilot shape and later expansion.

Once these decisions are recorded:

```text
update this workbook
-> map approved changes into Documents 05 through 27
-> run cross-document consistency review
-> freeze the candidate first-launch promise
-> select required spikes
-> run and record every spike
-> lock only validated scope
-> write implementation plan
```

## 37. Current Recommendation in One Paragraph

Pods should first launch as the execution layer for a Build Season. An
organizer runs an opinionated program around Projects. Each Project uses a
default Core Build Pod and optional focused Pods. Builders make lightweight
outcome commitments, attach GitHub-observed or manual artifacts, receive
scoped review, and create stable Execution Moments. Those same moments power a
clean Project room, builder Execution Profiles, Project Journeys, organizer
progress and exception views, Event pulses, and ready-to-share updates. The
product complements existing hackathon and project tools, stays useful without
money, and adds controlled NIM economics only after the execution loop and
financial operating model are independently proven.

## 38. Approval Boundary

Nothing in this workbook is approved merely because it is recommended.

The next action is Abhinav's edit and decision pass. No implementation plan,
Mainnet branch implementation, production deployment, or fund movement follows
until the accepted slice is reconciled and every selected validation gate
passes.
