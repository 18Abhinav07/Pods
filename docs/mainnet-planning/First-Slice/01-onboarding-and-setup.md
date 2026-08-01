---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, onboarding, github, cli, planning]
---

# First Slice 01: Onboarding and Setup

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/00-overview|00: Overview]] |
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02: Tasks, commitments and issues]] |
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06: GitHub integration architecture]] |
[[docs/mainnet-planning/First-Slice/07-cli-and-agent-workflow|07: CLI and agent workflow]] |
[[docs/mainnet-planning/19-github-identity-and-proof-integration|19: GitHub identity and proof integration]] |
[[HANDOFF]]

## Purpose

Define exactly how a person and a Project go from "never used Pods" to
"fully set up and working" — **on the web app and via the CLI, as two
equally complete, independent paths, neither one a prerequisite for the
other.**

The web app is the front door for anyone who has never used Pods and has
no reason to know a CLI tool exists — sign in, create or join a Project,
done, no install required. The CLI is a convenience layer for people who
already have an account and want to skip the browser for routine
day-to-day actions, borrowing patterns developers already have muscle
memory for (`git`, `gh`). It is not, and must never be treated as, the
only way to get started.

## Authentication

Pods uses **GitHub-only auth**. There is no separate Pods password or email
signup — logging in with GitHub both authenticates the person and gives
Pods the identity it needs to attribute work correctly later. This is a
deliberate simplification for this slice: one identity provider, no account
recovery flows, no separate credential to manage.

**Authentication always comes first — before `pods init`, before anything
else, for every person, lead or not.** There is no path through this
product that doesn't start with a real Person record. If `pods init` (or
any other command) runs without an active session, it does not proceed
silently or error unhelpfully — it triggers the same auth flow `pods link`
would (opens the browser OAuth screen, or on the web, redirects to
`/login`), then continues automatically once that completes. The ordering
is: **authenticate, then everything else** — every walkthrough of this
product should say so explicitly rather than assuming it.

## The Two-Layer Access Model

GitHub splits repository access into two things that are easy to conflate,
and this slice depends on keeping them separate:

1. **App installation** — a repo or org admin installs the Pods GitHub App
   on the specific repo(s) a Project needs. This is a one-time action, done
   through GitHub's own install-consent screen (unavoidably a browser step,
   since GitHub Apps are only installable through GitHub's UI). Without
   this, Pods cannot see issues, PRs, or reviews on that repo at all.
2. **Identity linking** — each individual member separately connects their
   own GitHub account via OAuth, so Pods knows "this GitHub user is this
   Pods person." This is what lets an issue assignment or a PR be attributed
   to the right builder.

Both are required. App installation alone tells Pods a repo exists; identity
linking alone tells Pods who someone is, but grants no repo access.

## Repo Governance: Centralized Only (v1 Decision)

**For this slice, a Project's repos are centrally administered by the
Project Lead.** The lead owns or has admin rights on every repo in the
Project, installs the Pods GitHub App on each one, and invites other members
as collaborators (see below). Member-owned repos — where each person
administers their own repo and links it into a shared Project — are
explicitly **not** supported in this slice. This was a deliberate choice to
avoid the added complexity of mixed per-repo admin state and multiple
GitHub App installers within one Project, given the Cycle II/III timeline.
It is tracked as a deferred item in
[[docs/mainnet-planning/First-Slice/09-open-decisions|09: Open decisions]].

## Contacts

Every person has a personal Contacts list — the people they've worked with
on Pods before, or explicitly added. This is what makes adding people to a
*new* Project fast the second and third time, instead of re-typing GitHub
usernames from memory every time. It's personal, not a public directory —
your Contacts aren't Jordan's Contacts.

Two ways someone ends up in your Contacts, neither requiring a
request/accept ceremony:

1. **Automatic.** Anyone who's ever shared a Project with you is in your
   Contacts — no action needed, it's just a query over Project membership
   you already have.
2. **Manual.** You can explicitly add someone by GitHub username at any
   time, even before ever sharing a Project with them — e.g. you met
   someone and want to remember them for next time. This creates the same
   placeholder-Person record described below if they're new to Pods; no
   invite or repo access is implied by this alone, it's purely your own
   address book entry.

Contacts exist specifically so **adding people is a step inside Project
creation, not a separate command you run after the fact wondering how to
find someone's username again.**

## Creating a Project on the Web (the default path)

After signing in with GitHub, `/projects/new` is a complete, self-contained
flow — nothing here requires a terminal:

1. Name the Project.
2. Connect a repository: pick from repos where the Pods GitHub App is
   already installed, or trigger the install-consent redirect for a repo
   that isn't covered yet (same one-time GitHub browser step described
   above, just reached by clicking a button here instead of running a
   command).
3. **Add people, right here, not as a separate later step:** a picker over
   your Contacts (multi-select, if you've used Pods before) plus a plain
   input for anyone new by GitHub username. Anyone added this way gets the
   real GitHub collaborator invite sent (see Contacts and `pods add` below
   for the mechanism) and lands in your Contacts going forward if they
   weren't already.
4. Done — the Project exists with its initial roster already in place, and
   starts tracking commitments the moment issues get assigned on GitHub.

This is not a stripped-down or secondary version of setup. It's the same
Project record, the same GitHub App installation, the same result as
`pods init` — just reached by clicking instead of typing, for anyone who'd
rather not install a CLI at all. Most people meeting Pods for the first
time will start here, not in a terminal.

## `pods init` (the CLI equivalent)

For people who'd rather never leave the terminal, `pods init` does exactly
what the web flow above does — same Project record, same App-install
check — reached from inside a repo (or a new empty directory) instead:

1. Asks whether this repo is starting a **new Pods Project** or joining an
   **existing Project** the person is already part of.
2. If new: creates the Project record, checks whether the Pods GitHub App is
   installed on this repo — if not, opens exactly one browser tab to GitHub's
   install-consent screen. **Detection mechanism:** a foreground CLI command
   can't be pushed to by an asynchronous backend webhook, so the CLI polls a
   Pods backend "installation status" endpoint (itself updated by the
   installation webhook when GitHub sends it) at a short interval — e.g.
   every 2 seconds — with a bounded timeout (e.g. 2 minutes), rather than
   blocking indefinitely or silently assuming success. If the timeout is
   hit, `pods init` tells the person explicitly and offers to re-check
   rather than hanging.
3. If joining an existing Project: links this repo into that Project's
   existing roster and settings — no separate App-install flow needed if
   it's the same admin/org context; a new install prompt appears only if
   this repo sits under a different GitHub org/account.
4. **If starting new: prompts for people, inline, same as the web flow** —
   lists your Contacts to pick from (numbered selection in the terminal),
   plus an option to type a new GitHub username for anyone not already
   known. This is not deferred to a separate `pods add` call after `init`
   finishes; the initial roster is part of creation on both surfaces.
5. Writes a local manifest (see
   [[docs/mainnet-planning/First-Slice/07-cli-and-agent-workflow|07]]) so the
   repo and any coding agent working in it both know Pods tracking exists.

`pods init` does **not** create the GitHub repository itself. Repo creation
is left to `gh repo create` or the GitHub UI — tools that already do this
well. `pods init` can optionally shell out to an already-authenticated `gh`
session as a convenience (`pods init --create-repo <name>`), which costs
Pods zero additional GitHub permission, since it borrows the user's own `gh`
session rather than Pods holding repo-creation scope itself.

## Adding People After Creation: `pods add` and the Roster Screen

The Contacts-picker step above covers a Project's *initial* roster at
creation time. `pods add <github-username>` (CLI) and the add action on the
Roster screen (web) are the same underlying mechanism, available any time
afterward — someone joins the team in week two, you forgot someone at
setup, whatever the reason.

**Inviting someone doesn't require Pods at all — the lead can just use
GitHub's own "add a collaborator" flow directly on github.com,** exactly
as they would for any other repo, with zero Pods or CLI involvement. Pods
picks this up automatically through the read access it already has and
reflects it on the Roster screen. `pods add <github-username>` exists as a
*convenience wrapper* around that same GitHub action for people who'd
rather not leave the terminal — it is not the only way in, and nobody is
stuck without a CLI.

**The placeholder-Person mechanism is not tied to `pods add` specifically
— it fires whenever Pods observes an unfamiliar GitHub username on a
linked repo, regardless of how that person got there.** Whether the lead
invited Jordan through `pods add`, through GitHub's own website, or Jordan
simply shows up as the assignee on an issue nobody explicitly "added" him
to first, the rule is the same: if that GitHub username has no linked Pods
Person yet, Pods creates a placeholder — username only, no session, no
profile — just enough to attach whatever fact just occurred. The moment
Jordan authenticates with Pods using that same identity, the placeholder is
promoted to a real Person and everything already attributed to him
resolves.

Concretely, `pods add jordan-handle` (the convenience path):

1. Checks whether `jordan-handle` already has a linked Pods Person record;
   creates the placeholder above if not.
2. Diffs the Project's member roster against who's already a GitHub
   collaborator on the linked repo(s) — this diff only needs read access,
   already covered by the App's existing metadata/issues permissions.
3. For anyone missing, `pods add` shells out to the lead's own
   already-authenticated local `gh` CLI session to send the invitation
   (`gh api -X PUT repos/{owner}/{repo}/collaborators/{username}`), the same
   delegation pattern already used for repo creation in `pods init`.
4. Jordan can accept the **GitHub** collaborator invite immediately (via
   `pods accept-invites` or GitHub's own UI) — that only grants repo access,
   it does not require a Pods session. **Separately**, the first time Jordan
   authenticates with Pods (`pods link`, or GitHub login on the web) using
   that same GitHub identity, their placeholder Person record is promoted
   to a real, active one — any commitments or moments already attributed
   to their GitHub username retroactively resolve to them, nothing is lost
   for having authenticated "late."

This means there are two independent steps for each friend, not one:
accepting the **GitHub** invite (repo access) and authenticating with
**Pods** (identity linking) — someone can do the first without the second
and their work will still be tracked under a placeholder until they do.

**Why delegate instead of proxying through Pods' own GitHub App token:**
inviting or removing a collaborator is a repository-administration action.
Granting the Pods App an "Administration" permission to support it — even
scoped only to installed repos — is a materially broader, scarier-looking
grant than anything else this slice asks for, for a feature that's really
just "invite one person." Borrowing the person's own local `gh` session
means Pods never requests that permission at all: the invite/accept actions
are performed entirely by GitHub's own CLI, under the person's own existing
authorization, with Pods only ever reading state to compute the diff. This
is the same pattern used for GitHub Discussion creation in
[[docs/mainnet-planning/First-Slice/05-discussions-and-room|05]] — except
there it's OAuth-scoped through the App because Discussions has no
narrower alternative; here `gh` already provides one, so we use it.

If a person doesn't have `gh` installed/authenticated locally, `pods add`
falls back to printing the exact command(s) for them to run themselves —
Pods never silently fails to invite someone without saying why.

This command exists because it's the one thing GitHub genuinely cannot do
on its own: GitHub has no concept of "who's on this Pod," only "who's a
collaborator on this repo." Pods is the source of truth for team membership;
this command is how that truth gets synced onto GitHub's own permission
model.

## Non-Goals For This Slice

- Pods does not create or delete GitHub repositories.
- Pods does not manage member-owned repos across different admin contexts.
- Pods does not replace local git commands (`commit`, `push`, `branch`,
  `merge`) — only GitHub-platform-level operations (repo linking,
  collaborator invites, issue assignment, discussion creation) are wrapped.
