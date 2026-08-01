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

Review round: Abhinav's GitHub, private-repository, CLI, MCP, and
timeline-curation direction integrated on 2026-07-28.

Related: [[docs/mainnet-planning/README|Mainnet planning index]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[docs/mainnet-planning/26-integrated-mainnet-architecture|Integrated candidate architecture]] |
[[docs/mainnet-planning/27-validation-and-implementation-sequence|Validation sequence]] |
[[docs/mainnet-planning/diagrams/pods-first-launch-product-flow|Product flow diagram]] |
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

Launch **Pods for Build Seasons**, a developer-native execution record for
collaborative building.

Its promise is:

> Turn promises into proof, and proof into portable credit.

The complete product statement is:

> Pods connects assigned intent, source-backed evidence, scoped review, and
> contributor credit into one durable execution graph. Builders use it without
> leaving their normal tools, Projects use it to preserve how they were built,
> and organizers use it to understand and showcase real progress.

`Build Season` is the first packaged use case, not the permanent identity of
the whole product.

### The product has two connected experiences

1. **Builder Execution Workspace**
   - receive or make one short-horizon outcome commitment;
   - work in existing tools;
   - use the web app, Pods CLI, or Pods MCP to attach a source-observed or
     manual artifact;
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
market.

- Cycle II is the build-in-public and dogfood window. Pods may onboard a few
  volunteer Projects after the core loop becomes usable, but it should not
  promise a complete organizer-operated cohort.
- Cycle III is the recommended target for the first complete Build Season
  pilot if the product and organizer relationship are ready.

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
- one selected-repository GitHub App connection supporting public and private
  repositories;
- GitHub issue assignment to accepted-commitment bridge;
- GitHub source observation plus a manual artifact fallback;
- a first-party Pods CLI for the normal builder loop;
- an opt-in Pods MCP beta using the same execution API;
- private evidence envelopes with public-safe projections;
- stable Execution Moments;
- routine, highlight-candidate, milestone-linked, and system-event timeline
  treatment;
- one clean Project room around structured work;
- Project journey, builder timeline, Event pulse, and Shareables;
- a focused organizer progress and exception console;
- nonfinancial operation as the universally available core.

Real NIM economics should be a separately gated controlled capability, not a
dependency of the product's usefulness.

## 3. The Category Pods Should Own

Pods should own:

> **The portable execution record for collaborative building.**

This is different from:

- a task manager, which records intended work;
- a source host, which records code events;
- a chat app, which records conversation;
- a hackathon portal, which records registration and final submission;
- a portfolio, which records selected finished work;
- a social feed, which records what someone chose to post.

Pods connects intent, work evidence, review, attribution, and narrative over
time. Build Seasons are the first environment in which that record is created
and used repeatedly.

### Product language

- Public product term: **Execution Profile**
- Smallest trusted unit: **Execution Moment**
- Durable team outcome: **Project Journey**
- Time-bounded organizer program: **Build Season**
- Focused execution lane: **Pod**
- Internal architecture term only: **Passport**

The public product should not lead with "reputation score," "proof of work,"
"crypto," or "portfolio."

### The identity test

The product is correctly defined only when this distinction remains true:

> GitHub knows that source activity happened. Discord knows that people
> talked. Pods knows what was promised, which evidence supported delivery, who
> accepted the result, who deserves credit, and what may be shown publicly.

If Pods can be replaced by a Discord bot that reposts GitHub activity, the
product has failed. The defensible product is the durable, cross-Project and
cross-Event execution graph, not the notification channel.

### Three positioning approaches

1. **Accountability room:** easy to explain, but collapses into chat plus
   proof.
2. **GitHub activity portfolio:** easy to automate, but excludes non-code
   work and creates value only after building.
3. **Developer-native execution record:** commitments and proof can enter from
   GitHub, CLI, MCP, or web, while review and attribution produce portable
   Project and builder histories.

**Recommendation:** Use the third. The first two remain capabilities inside
the product, not its identity.

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

### Approach C: Developer-native build program execution layer

Let organizers operate a Build Season, let Projects execute through
commitment and evidence loops entered through the tools builders already use,
then derive profiles, stories, and reports from the same work.

**Advantage:** Produces operational utility before reputation, serves both
builders and organizers, complements existing event platforms, and does not
require the web app to become a builder's full-time work surface.

**Problem:** Requires careful review workload, permissions, integrations, and
information architecture. The CLI and MCP must remain thin command surfaces
over the same domain rather than creating alternative truth.

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
> becoming a content creator or repeatedly opening another reporting app.

### Project lead

> Help my team keep short commitments visible, understand what is actually
> shipping, resolve blockers, and produce a coherent public Project story
> without running another task-management system. Let me keep assignable work
> in GitHub when that is where my team already works.

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
           -> RepositoryConnections
              -> issue SourceObservations
                 -> proposed commitments
           -> BuildMilestones
           -> one default Core Build Pod
           -> optional focused workstream Pods
              -> Occurrences
                 -> ParticipantOccurrences
                    -> Commitment
                    -> public or private evidence envelope
                    -> ProofCase and ProofSubmission
                    -> ReviewDecision
                    -> ActivityMoment presented as an Execution Moment

Execution Moment
  -> routine detail | highlight candidate | milestone-linked placement
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
- A GitHub issue is an external work item, not a Pods commitment. It becomes a
  locked commitment only after the assigned builder accepts a frozen snapshot.
- Significance is presentation intent, not proof quality. A builder may
  nominate a highlight, but cannot unilaterally declare a Project milestone
  achieved.

### First-launch Project onboarding contract

The Project loop is not ready until team setup works end to end:

```text
lead creates durable Project
-> defines promise and initial role needs
-> invites existing Pods people or sends bounded invitations
-> each person accepts their Project role and visibility
-> each GitHub-tracked contributor connects their own GitHub account
-> repository owner installs the Pods GitHub App on selected repositories
-> lead connects selected repositories to the Project
-> Pods maps connected GitHub accounts to accepted Project contributors
-> lead configures eligible issue labels, workstream mapping, and reviewers
-> Project becomes execution-ready
```

Important boundaries:

- A Project lead cannot connect GitHub on another person's behalf.
- GitHub repository access and Pods Project membership are separate grants.
- A person may hold several contribution roles but every command is authorized
  by a specific capability, not by the display label alone.
- A member who leaves loses future authority but keeps historical accepted
  credit.
- A repository disconnect stops new observations without deleting earlier
  review history.
- A Project can add another repository later through the same explicit
  installation, selection, and policy flow.

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
- a second Pods-owned issue tracker;
- manager productivity scoring.

### Creation sources

- the builder creates their own commitment;
- a Project lead proposes an outcome that the builder must accept before it
  locks;
- an Event or Project template suggests a commitment;
- a GitHub issue assigned to a connected Project member becomes a proposed
  commitment when the Project's issue policy makes it eligible;
- a GitHub observation can be attached to an already open commitment but does
  not create a retroactive precommitment.

### GitHub issue to commitment bridge

The first launch should read eligible GitHub issues rather than write or
silently modify repository work.

```text
Project lead creates and assigns an issue in GitHub
-> GitHub App observes assignment, labels, milestone, and issue revision
-> Pods matches the assignee to one connected Project contributor
-> builder sees a proposed commitment in web, CLI, and MCP
-> builder accepts, declines, or asks for a change
-> acceptance freezes the issue title, outcome mapping, due occurrence,
   artifact expectation, assignee, source revision, and source hash
-> later issue edits do not rewrite the accepted commitment
-> an authorized supersession creates a new commitment version when needed
```

Recommended eligibility rule:

- the issue belongs to a selected Project repository;
- the assignee is a connected Project contributor;
- the issue has the configured `pods:commitment` label or is explicitly
  imported by an authorized Project lead;
- the issue is open and not already bound to an active commitment.

GitHub permits people with repository write access to assign issues, but the
set of assignable users depends on repository and organization access. Pods
must therefore show an unassignable-member failure instead of assuming every
Pods contributor can receive a GitHub issue.

Source:
https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/assigning-issues-and-pull-requests-to-other-github-users

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
- image, short video, PDF, or safe external link.

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

### Private repository evidence

Private repositories are a first-launch requirement, not a later exception.
The GitHub App can be installed on selected repositories with fine-grained
permissions, and installation access tokens are short-lived. Pods must request
only the permissions needed for the exact enabled source types.

Sources:
https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps
and
https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app

The recommended private-evidence contract is:

1. Pods stores normalized source metadata, immutable hashes, visibility,
   attribution basis, and review provenance.
2. Pods does not clone or durably store an entire private repository.
3. A reviewer can inspect raw private GitHub material only when both are true:
   - Pods grants that person review access for the exact ProofCase;
   - GitHub confirms that the person and the App can access the repository.
4. A builder who cannot expose raw source may submit an encrypted screenshot,
   image, video, PDF, or redacted extract as `reviewer_only` evidence.
5. Builder-uploaded private media uses protected object storage, explicit
   retention, access logging, and no public URL.
6. A public projection may say that private evidence was reviewed, but it
   excludes repository name, branch, issue text, commit message, diff, raw
   media, and URL unless separately made public by an authorized owner.
7. Revocation stops new fetching immediately. The historical review decision,
   source digest, and exact claim basis remain with a
   `source_unavailable` label under retention policy.

This creates a dual-key boundary. Project review authority alone does not
grant access to private source, and GitHub access alone does not grant access
to the Pods ProofCase.

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
-> install the Pods CLI
-> optionally connect the Pods MCP to an AI client
-> define 2 to 4 meaningful Build Milestones
-> accept the default Core Build Pod
-> optionally add focused Pods for frontend, backend, design, research,
   launch, contracts, or documentation
-> assign routine reviewers
```

### 14.4 Execute each occurrence

```text
Project lead assigns a labeled GitHub issue or builder creates an outcome
-> Pods proposes the commitment in web, CLI, and MCP
-> builder accepts and locks the frozen outcome
-> work in GitHub, Figma, local tools, or another source
-> Pods proposes observed artifacts where available
-> attach artifacts and confirm contribution through CLI, MCP, or web
-> add private image, video, document, or redacted evidence when needed
-> preview claim, contributors, and visibility
-> explicitly submit
-> reviewer decides
-> stable Execution Moment updates
-> Project room receives the structured card
-> eligible timelines and summaries update
```

The normal builder should be able to complete this loop without opening the
web app. The app remains the best surface for onboarding, media privacy,
review, Project setup, curation, timelines, and exception recovery.

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
-> configure eligible issue labels and commitment mapping
-> enter Build Season
-> freeze Season-specific charter
-> define milestones
-> start Core Build Pod
-> add a focused Pod only when work separation is useful
-> assign reviewers
-> create and assign normal work in GitHub
-> see commitment coverage, reviewed outcomes, and blockers
-> respond in Project room
-> curate Project chapters from already eligible work
-> resolve contributor changes without rewriting history
-> complete EventEntry
-> continue durable Project
```

The Project lead may curate eligible Project facts and propose GitHub-backed
commitments but cannot:

- claim another person's contribution;
- lock a proposal on behalf of its assignee;
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

### Project workspace composition

The Project should not open as an undifferentiated chat transcript:

- **Now:** current milestone, the viewer's commitments, pending review, and
  team exceptions;
- **Work:** filterable structured commitments and Execution Moments by member,
  workstream, milestone, type, and state;
- **Room:** human conversation, announcements, replies, and compact references
  to structured work;
- **Journey:** curated chapters, highlights, milestones, releases, demos, and
  Event results;
- **Team:** contributors, roles, GitHub connection state, reviewer coverage,
  and invitations.

CLI and MCP actions update the same structured Work records. The Room receives
one compact event card or reference when the product policy says teammates
need to notice it. Pods never posts every commit, webhook, upload step, or
worker transition into chat.

At large membership counts, filters and personal views are mandatory. A person
must be able to view `Mine`, one contributor, one workstream, one milestone,
or only `Needs review` without scrolling through the whole Project.

## 21. GitHub Integration

### Required launch behavior

1. GitHub authentication can create or access a Pods identity.
2. GitHub work connection is separately authorized.
3. A repository owner installs the Pods GitHub App.
4. A Project lead selects exact repositories.
5. The Project configures an eligible issue label and work-item policy.
6. Pods receives permission-scoped source observations.
7. An eligible issue assignment may create a proposed commitment.
8. The builder explicitly accepts the proposal.
9. The builder sees suggested evidence for the locked commitment.
10. The builder explicitly attaches the observation.
11. A reviewer decides the commitment.

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

### Permission recommendation

Start with the smallest viable capability bundle:

- repository metadata: read;
- issues: read;
- pull requests: read;
- contents: read only where commit, tree, or diff validation requires it;
- deployments: excluded until its spike passes;
- issue write: excluded from first launch.

GitHub Apps have no permissions by default, selected repositories can be
granted independently, and permission sets determine which APIs and webhooks
the App can use. Pods must show the exact reason for every requested
permission.

Source:
https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app

### Why Pods should not write GitHub tasks initially

The Project lead can continue creating and assigning issues in GitHub. Pods
observes those issues and turns an eligible assignment into an accepted
commitment contract. Requesting issue-write permission just to recreate the
same task in GitHub adds trust and reconciliation cost without improving the
first loop.

Writing issues, comments, labels, or status checks from Pods can be added only
after teams prove they need the reverse direction.

## 21A. Developer-Native Interfaces

The website cannot be the only interface to Pods. Builders should be able to
use the execution loop from the terminal and from an authorized AI agent while
the web product remains the best place to understand and curate the complete
record.

### One headless execution API

Web, CLI, and MCP call the same authenticated command layer:

```text
interface command
-> authorize actor, scope, lifecycle, consent, and visibility
-> mutate one aggregate
-> persist domain fact, audit record, and outbox atomically
-> update Project room, timelines, organizer views, and notifications
```

No interface owns separate commitment, proof, room, or timeline state. Every
mutation carries an idempotency key so retries from terminals and agents do
not duplicate work.

### Pods CLI

The CLI is required in the first launch. Its minimum workflow is:

```text
pods auth login
pods status
pods assignments
pods accept <proposal>
pods submit <commitment> --commit <sha> | --pr <url> | --file <path>
pods share draft <moment>
pods open <project-or-review>
```

The exact command grammar remains a validation choice, but the capability
boundary is fixed:

- authenticate through an interactive browser or device flow;
- list current Project, milestone, commitment, and review context;
- accept or decline a proposed commitment;
- create a self-authored commitment;
- inspect GitHub evidence candidates;
- attach commit, pull request, issue, URL, image, video, PDF, or other allowed
  evidence;
- choose reviewer-only, Project-shared, and public fields;
- preview the exact claim and visibility before submission;
- submit with upload progress, retry, and idempotency;
- open the relevant web page for complex review, curation, or recovery.

The CLI does not become a Git wrapper. It never pushes code, changes branches,
stores repository credentials, makes review decisions, publishes publicly
without confirmation, or moves funds.

### Pods MCP

The MCP is an opt-in beta in the first launch, built over the same execution
API after the CLI contract is stable.

Recommended read tools:

- `pods_get_project_context`;
- `pods_list_assignments`;
- `pods_list_commitments`;
- `pods_find_evidence_candidates`;
- `pods_get_execution_moment`;
- `pods_preview_shareable`.

Recommended mutation workflows:

- draft a commitment;
- accept or decline a proposal;
- prepare a proof submission;
- add a structured Project update;
- prepare a shareable.

Every externally visible mutation uses a two-step server contract:

```text
prepare action
-> return exact target, evidence, contributors, visibility, and effects
-> user confirms
-> confirm action with short-lived single-use token
```

Review decisions, public publishing, permission changes, Project membership,
and financial actions remain unavailable through MCP in the first launch.

The official MCP specification recommends human control over tool invocation
and defines OAuth-based authorization for HTTP servers. The Pods MCP therefore
uses user-scoped authorization, least-privilege scopes, short-lived
credentials, explicit mutation previews, and auditable actor attribution.

Sources:
https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
and
https://modelcontextprotocol.io/specification/2025-06-18/server/tools

### Why both CLI and MCP

- CLI is deterministic, inspectable, scriptable, and useful without an AI
  client.
- MCP lets a builder's chosen agent understand Project context and prepare
  Pods actions without learning a proprietary command syntax.
- The shared execution API prevents two product implementations.
- MCP is not a replacement for the CLI because an agent should never be
  required to use Pods.

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
- featured milestone and highlight Execution Moments;
- expandable recent execution chapters;
- Project and Event history;
- contribution roles and evidence-backed patterns with denominators;
- up to six pinned Projects, milestones, or artifacts;
- availability and contact policy.

There is no global score, universal rank, or public failure wall.

### Why this cannot become a GitHub contribution wall

The Execution Profile should lead with build arcs, not activity volume:

1. what the person helped build;
2. which outcome they owned;
3. which milestone or release changed because of that work;
4. which evidence and review basis supports the claim;
5. who collaborated with them;
6. how the work developed over time.

Routine approved work remains inspectable but collapses into daily or weekly
chapters. The profile never equates number of commits, lines, hours, or
messages with execution quality.

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

### Timeline significance model

Not every accepted commitment deserves equal visual weight. The participant
selects `significance_intent` when committing or submitting:

- `routine`: normal execution record;
- `highlight_candidate`: a result the contributor believes materially changed
  the Project;
- `milestone_linked`: evidence intended to support an existing
  BuildMilestone.

Separate system events cover release, deployment, demo, Event phase, award,
and final result. `Canonical` is not a user-selectable truth label.

Timeline placement follows:

| Input | Full private ledger | Project Journey | Execution Profile | Event Pulse |
|---|---|---|---|---|
| Approved routine moment | individual record | collapsed into a chapter by default | available in expanded history | aggregate only |
| Approved highlight candidate | individual record | lead or authorized editor may promote | contributor may feature | organizer may select if public |
| Achieved milestone-linked moment | individual record | first-class milestone chapter | eligible to feature | eligible Event highlight |
| Release, deployment, demo, award, or result | system event | first-class Project event | shown when contributor attribution exists | first-class Event event |
| Rejected, missed, grace, or timeout-protected | exact private state | excluded unless a safe policy explicitly says otherwise | excluded from public profile | excluded from public pulse |

The builder may nominate their work. The Project lead may curate eligible
Project presentation. The organizer may curate eligible Event presentation.
None of them can change the proof outcome, contributor credit, or visibility
ceiling.

### Narrative generation

Pods may draft a weekly chapter or milestone story only from frozen facts and
approved public-safe material. The draft must cite its source moments,
distinguish authored text from verified facts, and require human approval
before publication.

This is a narrative compiler, not an AI memory oracle. It cannot invent
importance, authorship, quality, or causal claims.

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

Use two separate phases instead of overpromising Cycle II:

**Cycle II: build, dogfood, and recruit**

1. Build Pods itself through the proposed GitHub, CLI, proof, and timeline
   loop.
2. Publish the resulting Pods Project Journey into the Nimiq community.
3. Onboard 1 to 3 volunteer Projects only after their required loop works.
4. Observe setup friction, private-repository concerns, review load, and
   whether builders return without reminders.
5. Pitch Pods as a companion execution layer, not an official replacement.

**Cycle III: complete Build Season pilot**

1. Run the first complete 5 to 10 Project cohort if product validation and
   organizer access pass.
2. Publish a weekly Event pulse.
3. Generate final Project stories, contributor Execution Profiles, and a
   community showcase.
4. Measure organizer reconstruction time, builder reporting time, attribution
   quality, retention, and public-share use.

### Launch narrative

> GitHub shows what changed. Hackathons show what was submitted. Pods shows
> what was promised, how it was built, and who made it happen.

## 29. Decisions for Abhinav

Fill `Approve`, `Change`, or a short replacement in the last column.

| ID | Choice | Options | Recommendation | Abhinav decision |
|---|---|---|---|---|
| D01 | Product category | full hackathon platform / builder profile / build-program execution layer | portable execution record delivered through a build-program execution layer | Direction accepted; sharpen identity |
| D02 | Initial acquisition | official organizer contract first / Cycle II build-and-dogfood / immediate full community pilot | Cycle II build and limited volunteer alpha; Cycle III complete cohort | Change to Cycle II build and Cycle III pilot |
| D03 | Event-platform relationship | replace registration and judging / complement existing platforms | complement existing platforms | |
| D04 | Project availability | only inside Events / event-led but usable outside and after Events / fully general Project network | event-led, durable, and usable after the Event | |
| D05 | Organization scope | full Organization membership / minimal Event host / no Organization | minimal Event host | |
| D06 | Team object in launch | full durable Teams / Project contributors only | Project contributors only; retain Team in architecture for later | |
| D07 | Default Pod structure | one Pod only / one Core Build Pod plus optional workstream Pods / mandatory Pod per discipline | Core Build plus optional workstreams | |
| D08 | Room topology | Project room only / room per Pod / both by default | one Project room with Pod filters | |
| D09 | Commitment cadence | organizer fixed / Project fixed / Event minimum plus Project choice | Event minimum plus Project choice | |
| D10 | Commitment source | self-created / direct lead proposal / eligible GitHub issue assignment / all with participant acceptance | self-created plus GitHub or lead proposal requiring acceptance | Change to GitHub task bridge plus acceptance |
| D11 | GitHub requirement | mandatory for everyone / Project repository required and code roles connect / entirely optional | at least one repository per Build and Ship Project; connected GitHub required only for GitHub-tracked contributors | Change to Project repository plus role-sensitive connection |
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
| D28 | Public activity density | every approved occurrence / weekly chapters only / significance-aware layers | complete private ledger plus routine chapters, promoted highlights, and first-class milestones | Change to significance-aware curation |
| D29 | AI narrative | auto-publish / editable draft / no AI | editable draft only after source facts are frozen | |
| D30 | Standalone Project creation | at launch / after first Event pilot | after the first Event pilot unless a design partner requires it | |
| D31 | Private repositories | public only / private metadata only / full private proof support | full private proof support with dual-key access and public-safe projection | |
| D32 | Private source storage | clone and retain code / normalized metadata and digest / no retained proof | normalized metadata and digest; fetch raw source on demand; protected submitted media only | |
| D33 | GitHub task direction | GitHub to Pods read bridge / two-way issue writing / Pods-only tasks | GitHub to Pods read bridge first | |
| D34 | GitHub issue mapping | every assignment auto-locks / eligible assignment proposes / manual import only | eligible labeled or imported assignment proposes; builder accepts | |
| D35 | CLI launch status | required / beta / deferred | required first-party interface | |
| D36 | MCP launch status | required full interface / opt-in limited beta / deferred | opt-in beta after CLI contract stabilizes | |
| D37 | MCP mutation safety | direct agent mutations / client confirmation only / server prepare-confirm | server-side prepare-confirm plus client human control | |
| D38 | Timeline significance | user tag decides / lead decides / layered nomination and curation | builder nominates, lead curates Project, organizer curates Event, proof state remains immutable | |
| D39 | Public timeline label | regular, milestone, canonical / routine, highlight candidate, milestone linked plus system events | second option; never make canonical a self-awarded truth | |
| D40 | Daily work surface | web-first / CLI-first / multi-interface | CLI and GitHub for normal work, web for setup, review, curation, and recovery | |

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

- Public and private GitHub repositories must both work. Private source can
  back an approved claim without becoming public.
- Builders need a Pods CLI so commitments and proof can be handled from the
  environment in which they already build.
- Builders should be able to connect an authorized Pods MCP to their chosen AI
  agent.
- GitHub issue assignments should become proposed Pods commitments for the
  registered assignee.
- The first slice must deeply support Project creation, team roles, repository
  connection, task-to-commitment mapping, artifact capture, review, and
  contributor attribution.
- The main defensible output is the builder Execution Profile and Project
  Journey generated from normal execution, not a manually maintained
  portfolio.
- Timeline generation must distinguish routine work, highlight candidates,
  milestones, and important system events.
- Builder and Project history must be interactive, curated, source-backed, and
  materially more useful than a commit wall.

### Corrections

1. The product identity is broader than one Build Season template. Build
   Seasons are the first wedge for a portable execution record.
2. Cycle II is primarily for building, dogfooding, public demonstration, and
   limited volunteer onboarding. Cycle III is the realistic complete cohort
   target.
3. The website should not be required for every commitment and proof action.
   GitHub, CLI, MCP, and web are interfaces to one execution graph.

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
- GitHub work connection and selected public or private repositories;
- eligible GitHub issue assignment to accepted-commitment bridge;
- source observation for commits, pull requests, issues, and releases;
- first-party Pods CLI using the canonical execution API;
- opt-in Pods MCP beta with read tools and prepare-confirm mutations;
- protected private-evidence envelope and public-safe claim projection;
- manual artifact fallback;
- proof, clarification, review, and exact terminal outcomes;
- Execution Moments and Observed Contributions;
- Project room with structured activity cards;
- Today, Work, Explore, Inbox, and Profile;
- Project Journey;
- Execution Profile;
- routine chapters, promoted highlights, milestone-linked moments, and system
  events;
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
- Pods-created or modified GitHub issues, comments, labels, and status checks;
- autonomous agent proof submission or public publishing without explicit
  confirmation;
- reviewer decisions, membership changes, permission changes, or financial
  actions through MCP;
- durable cloning or indexing of complete private repositories;
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
- An eligible assigned issue becomes an understandable proposed commitment.
- A connected public or private repository produces understandable suggested
  evidence.
- A builder can complete proof submission in less than two minutes after the
  real work is done.
- A builder can complete the routine loop through CLI without opening the web
  app.
- An MCP user can inspect context and prepare an action without granting
  unbounded mutation authority.

### Repeat use

- Most activated Projects produce at least three reviewed Execution Moments.
- Builders return across at least three separate occurrence windows.
- Project leads continue using the room and progress surfaces without creating
  duplicate status spreadsheets.

### Attribution

- Every public moment names exact contributors and claim basis.
- A builder can point to a canonical page showing their role in a Project.
- Project leads cannot erase historical accepted credit.
- Private repository evidence produces a useful claim without revealing
  private source identifiers or content.
- Visitors can distinguish routine work, Project highlights, milestones, and
  system events without interpreting raw activity volume.

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
- issue assignments and Pods commitments drift or require duplicate updates;
- builders avoid the CLI because setup or command grammar is harder than the
  web flow;
- builders do not trust Pods with selected private-repository access;
- the MCP can mutate or publish without meaningful user understanding;
- reviewers cannot keep up with the selected cadence;
- solo builders cannot obtain a credible review;
- organizers still need to read rooms for basic progress;
- public timelines resemble commit walls;
- Project leads must manually reconstruct every highlight despite the
  execution record;
- contributor attribution creates repeated disputes;
- builders do not share or revisit their Execution Profile;
- the organizer sees no value beyond an existing spreadsheet;
- the product is useful only when money is at risk.

Each failure changes the product before expanding scope.

## 34. Required Validation Before Implementation Planning

### Product validation

1. Walk the complete flow with 5 builders, 2 Project leads, and 1 organizer.
2. Use real GitHub artifacts from at least 3 different contribution roles.
3. Include at least one private repository and one non-code contribution.
4. Create GitHub issues, assign them, accept them as commitments, edit one
   issue after acceptance, and prove that the commitment does not silently
   change.
5. Complete at least half of builder actions through the proposed CLI
   interaction.
6. Test the MCP prepare-confirm interaction with two different AI clients.
7. Manually generate the proposed Execution Profile, Project Journey, Event
   pulse, and final report from those facts.
8. Measure reporting effort and reviewer load.
9. Test the solo-builder review path.
10. Confirm that visitors understand the Project without room access.

### Architecture-killing spikes

Document 27 already requires:

- Spike A: canonical Google and GitHub authentication plus safe linking;
- Spike B: GitHub App installation, observation, attribution, revocation, and
  reconciliation;
- Spike C: durable command, fact, outbox, replay, and idempotency.
- Spike D: CLI authentication, secure credential storage, upload retry,
  idempotency, and web handoff.
- Spike E: remote MCP authorization, audience-bound tokens, least-privilege
  scopes, prepare-confirm mutation, and audit attribution.

All selected capabilities remain blocked until their required spikes record
PASS.

### Additional slice-specific validation

- Project room with filtered stable activity cards;
- one fact projecting safely to builder, Project, Event, and Shareable;
- public and private repository evidence with dual-key reviewer access;
- GitHub issue proposal, acceptance snapshot, edit, close, reassignment, and
  disconnect behavior;
- CLI and MCP invoking the same command path as web;
- no agent action bypassing participant confirmation;
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
| 12 Activity and Shareables | required and central; add significance-aware chapters and promotion |
| 13 Passport | public language becomes Execution Profile; no global score |
| 14 Rooms | proposed amendment: one Project room, Pods as filtered execution lanes |
| 15 Attention | Today, Inbox, and reliable projection invalidation required |
| 16 Build and Ship | primary domain contract; add GitHub issue proposal and developer-native loop |
| 17 Organizer Operations | narrow from full Season platform to execution-layer console |
| 18 Journeys | replace broad candidate flow with selected launch journeys |
| 19 GitHub | architecture-killing dependency; add private evidence and issue bridge |
| 20 Distribution | native handoff and public links required |
| 21 Domain Extensions | deferred except preserving the extension boundary |
| 22 Data and Workers | required for authoritative facts, integrations, CLI, MCP, and projections |
| 23 Security and Operations | required; add private-source, CLI-token, and MCP authorization boundaries; financial portion conditional |
| 24 Information Architecture | narrow to selected web surfaces while defining CLI and MCP as peer interfaces |
| 25 Release Topology | Mainnet and Testnet isolation required |
| 26 Integrated Architecture | amend after decisions are approved |
| 27 Validation Sequence | select exact spikes, then write no plan until PASS |

## 36. Recommended Decision Order

Review the choices in this order:

1. D01 to D04: product and market boundary;
2. D06 to D10: Project, Pod, room, and commitment shape;
3. D11 to D18: proof, review, and execution-credit semantics;
4. D19 to D23: public product, distribution, social, and organizer surface;
5. D31 to D40: private source, GitHub task, CLI, MCP, and timeline contract;
6. D24 to D25: economic boundary;
7. D26 to D30: pilot shape and later expansion.

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

Pods should first launch for Build Seasons as the developer-native execution
record for collaborative building. A Project connects selected public or
private GitHub repositories and its contributors. GitHub issue assignments
become proposed commitments that builders accept. Builders then work normally
and submit source-observed or manual evidence through CLI, an opt-in MCP, or
web. Scoped review creates stable Execution Moments. Routine moments collapse
into chapters, contributors nominate highlights, achieved milestones receive
first-class placement, and system events preserve releases, demos, awards, and
results. The same facts power the Project room, Execution Profiles, Project
Journeys, organizer views, Event pulses, and Shareables. The product
complements GitHub and existing Event platforms, stays useful without money,
and adds controlled NIM economics only after the execution and financial
operating models are independently proven.

## 38. Approval Boundary

Nothing in this workbook is approved merely because it is recommended.

The next action is Abhinav's edit and decision pass. No implementation plan,
Mainnet branch implementation, production deployment, or fund movement follows
until the accepted slice is reconciled and every selected validation gate
passes.
