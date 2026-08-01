---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, github, architecture, webhooks, planning]
---

# First Slice 06: GitHub Integration Architecture

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01: Onboarding and setup]] |
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02: Tasks, commitments and issues]] |
[[docs/mainnet-planning/19-github-identity-and-proof-integration|19: GitHub identity and proof integration]] |
[[docs/mainnet-planning/06-commands-domain-facts-and-audit|06: Commands, domain facts and audit]] |
[[HANDOFF]]

## Permission Set

The Pods GitHub App requests the minimum permissions this slice actually
uses:

- Issues: read (assignment, labels, comments, closure).
- Pull requests: read (opened, review state, merge).
- Discussions: read, plus write scoped to the specific escalation flow in
  [[docs/mainnet-planning/First-Slice/05-discussions-and-room|05]].
- Metadata: read (repository/org info needed for the App itself to
  function).

**No issue-write, no PR-write, no deployments, no repository administration
or creation scope.** The App never requests "Administration" permission at
all — repo creation and collaborator invitations are delegated entirely to
the acting person's own local `gh` CLI session (see
[[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]), not
proxied through the App's installation token or a user OAuth grant. This
keeps the App's own footprint strictly read-plus-one-narrow-exception
(Discussions write) — Administration is a broad permission bucket (it also
covers deleting the repo and changing settings) that this slice has no
feature narrow enough to justify requesting.

## Ingestion: Webhook-First, API-Reconciled

Real-time ingestion runs on GitHub webhooks: `issues.assigned`,
`issues.closed`, `pull_request.opened`, `pull_request_review.submitted`,
`pull_request.closed` (merged), `discussion.created`. Each webhook event
becomes a domain fact, persisted immediately.

Webhooks can occasionally be missed (delivery failures, downtime). The
**Issue Timeline API** (`/issues/{n}/timeline`) and standard issue/PR `GET`
endpoints serve as the reconciliation backstop — since closed issues remain
fully queryable forever (see
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02]]),
Pods can always re-derive the full history for a given issue if a webhook
was dropped, rather than silently losing a fact.

**Reconciliation is triggered, not a blanket periodic sweep.** A naive
"re-poll every tracked issue on a timer" approach is a real rate-limit risk
once there's more than a handful of active Projects, and it's not actually
necessary. Reconciliation runs in two narrower cases instead: (1) on-demand,
whenever a person runs `pods status`/`pods sync` or opens the Commitments
screen for a Project that hasn't been refreshed recently — cheap, scoped to
one Project's active issues; and (2) opportunistically, whenever *any*
webhook arrives for a repo, Pods re-derives just that specific issue's
current state as a side effect, catching drift on the one issue it already
has reason to look at rather than sweeping everything. GitHub's own webhook
delivery logs and redelivery mechanism are the signal for "something was
missed," not a fixed polling interval.

## Frozen-Fact Durability

Pods stores each fact the moment it's observed — it does not depend on
being able to re-query GitHub indefinitely. Access can be revoked later
(a collaborator removed, the App uninstalled, a repo made private and
unlinked); at that point Pods loses the ability to fetch anything new, but
whatever was already captured stays valid and visible in the builder's
record. This is the same "frozen fact" principle used for commitment
snapshots, applied here as an infrastructure constraint rather than a
product preference.

## Private Repository Evidence: Simplified for v1

The broader workbook describes a configurable three-tier privacy model
(full detail / structural-only / redacted) for private-repo evidence. **This
slice uses a simpler binary default**: work observed from a private repo
stays internal to the Project (visible to the builder and their teammates)
by default, and nothing from it crosses into a public shareable profile
unless the builder explicitly marks that specific moment as shareable. No
per-project configurable privacy tier exists yet — that configuration is
deferred, tracked in
[[docs/mainnet-planning/First-Slice/09-open-decisions|09]].

**Publishing a moment sourced from a private repo requires sanitization,
not just a visibility flag.** When a builder marks such a moment shareable,
Pods must not expose raw `github.com/{org}/{private-repo}/...` links or
hotlink privately-stored media on the public shareable — an external viewer
following either would hit a 404 at best, or at worst reveal that a
specific private repo/org exists and is tied to the builder. Concretely:
absolute GitHub URLs to the private repo are replaced with a non-linking
tag (e.g. `[Private Repo] #12`) rather than a clickable reference, and any
attached Build Card image/clip is copied to public-safe storage rather than
served from wherever the private-origin asset lives. See
[[docs/mainnet-planning/First-Slice/04-timelines-and-shareables|04]] for
where this applies on the shareable surface itself.

## Why This Split Matters

GitHub owns who-did-what — identity, assignment, code, review, discussion
content. Pods never re-implements any of it. Pods owns what GitHub
structurally can't express: that an issue became someone's accepted
commitment, that a merged PR is a fulfilled promise rather than just a code
change, and that it all compounds into a portable, attributed record. This
architecture is the mechanism by which that split actually holds up under
real GitHub API behavior, not just as a design intention.
