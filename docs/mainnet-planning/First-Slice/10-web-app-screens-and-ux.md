---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, web-app, ux, screens, planning]
---

# First Slice 10: Web App Screens and UX

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/00-overview|00: Overview]] |
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02: Tasks, commitments and issues]] |
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03: Proof, review and execution moments]] |
[[docs/mainnet-planning/First-Slice/04-timelines-and-shareables|04: Timelines and shareables]] |
[[docs/mainnet-planning/First-Slice/05-discussions-and-room|05: Discussions and room]] |
[[docs/mainnet-planning/24-product-information-architecture-and-routes|24: Product information architecture and routes]] |
[[HANDOFF]]

## Why This Doc Exists

Every doc before this one specified *what* the first slice does. This one
specifies *where a person actually does it* on the web, and what the whole
thing should feel like. A feature that's fully specified in the backend but
has no real interface isn't complete — this doc is the check against that.

This is a screen inventory and a UX brief, not a visual design file. Exact
layout, typography, and color are a separate design pass once this set is
locked — that work benefits from dedicated design tooling and shouldn't be
faked inline in a markdown spec.

## Tone and Vibe

Pods should read as calm and credible — closer to GitHub or Linear than to
a hackathon-platform leaderboard or a gamified dashboard. No badges-and-XP
aesthetic, no leaderboards, no loud color-coded scores. The product's whole
premise is that execution speaks for itself; the UI should get out of the
way of the evidence, not decorate it. The one screen that's allowed to feel
genuinely "produced" rather than purely functional is the Public Shareable
Profile — that's the one place presentation quality directly serves the
product's purpose (something worth pointing someone to).

## Screen Inventory

**Login / Entry** — GitHub OAuth, nothing else. This is the actual front
door for the product — most people meeting Pods for the first time start
here, not in a terminal.

**Create Project** (`/projects/new`) — name a Project, connect a repo
(triggering the one-time GitHub App install-consent redirect if it isn't
already installed on that repo), done. This is a complete, primary flow on
its own — the web equivalent of `pods init`, not a stripped-down fallback
for people who don't have the CLI. See
[[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]] for the
full mechanics, identical whichever surface starts it.

**First-run state, explicitly, not left blank.** Right after a brand-new
person's first login, if they're not yet part of any Project, they do not
land on an empty or broken-looking screen. They see a plain, direct state
pointing at Create Project: "You're not part of any Pods Project yet — if
you're expecting an invite, check with whoever's leading it, or create
your own." This is a state, not a tutorial — no onboarding wizard, no
multi-step walkthrough, just an honest answer to "why is there nothing
here," with the obvious next action right there.

**Account** (`/account`) — the private "this is you" screen: your linked
GitHub identity, which Projects you're part of, and basic settings. This is
distinct from the **Public Shareable Profile** below — Account is for you,
the Public Profile is for whoever you send it to. Every person needs
somewhere to confirm they're actually connected and see their own Project
list; it doesn't need to be more than that in this slice.

**Room** (`/projects/[slug]`) — the first surface a person lands on for a
Project. Real-time-feeling chat for day-to-day conversation, with the
"Start GitHub Discussion from this" escalation action available on any
message (see
[[docs/mainnet-planning/First-Slice/05-discussions-and-room|05]]). Room
never shows commitment or proof state directly — it can reference them
(a message linking to a specific commitment), but the actual status lives
on the Commitments and Proof screens, not here. This is the one screen in
the product where near-real-time delivery is expected and worth the
narrow, scoped exception to the no-live-sync default (see
[[docs/mainnet-planning/First-Slice/05-discussions-and-room|05]]).

**Commitments** (`/projects/[slug]/commitments`) — the assignment and
status view: every commitment on the Project (assigned issue, assignee,
current status — active / superseded / fulfilled), milestone context, and
linked repos. This is where "what's everyone working on and where does it
stand" gets answered. It is read-mostly — creating or assigning tasks stays
on GitHub, per
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02]];
this screen reflects that state, it doesn't originate it.

**Proof** (`/projects/[slug]/proof`) — the evidence and verification view:
every commitment's proof trail in one place. For PR-based proof this is
read-only (the actual review happens on GitHub itself, per
[[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]]);
for manual-artifact proof, this is where the reviewer sees the attached
artifact and the frozen claim basis side by side and approves/rejects.
Commitments answers "what's assigned"; Proof answers "what's been shown for
it, and is it accepted" — those are two different questions and stay two
different screens, even though every item on Proof also appears on
Commitments.

**Personal Timeline** (`/me`) — the raw, complete Execution Moment ledger
for the logged-in person, across whichever Projects they're part of.

**Project Rollup Timeline** (`/projects/[slug]/timeline`) — the same
underlying moments from every contributor, recombined into the Project's
story, per [[docs/mainnet-planning/First-Slice/04-timelines-and-shareables|04]].

**Public Shareable Profile** (`/p/[username]`) — the external-facing page.
Only moments the builder has explicitly published appear here; private-repo
origin is sanitized per
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06]].
This is the one screen a builder should be comfortable sending to someone
who has never heard of Pods.

**Roster** (`/projects/[slug]/roster`) — every person on the Project, their
status (active / pending GitHub invite / placeholder — added but never yet
authenticated with Pods, see
[[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]), their
role, and an **Add Person** action — the same Contacts-picker-plus-username
flow used during Project creation. Not being able to see who's on your own
team, or add to it, from the app was a genuine gap, not a deliberate
simplification — this closes it.

**What the web Add Person action actually does, precisely:** it records the
Contact/placeholder and shows a direct link to that repo's GitHub
collaborator-settings page for the lead to complete the invite there — it
does not fire the GitHub invite API call itself. The CLI's `pods add`
performs the exact same invite as one command, because it can delegate to
the lead's local, already-authenticated `gh` session — a mechanism that
only exists on a machine with a terminal. A server-rendered web app can't
reach into someone's local `gh` session, so it guides the person to GitHub
instead of pretending to complete an action it structurally can't. Both
paths end at the same place — the person becomes a collaborator on GitHub
and shows up correctly on this Roster screen either way.

## UX Principles

- **One clear question per screen.** Room asks "what's being discussed,"
  Commitments asks "what's assigned and where does it stand," Proof asks
  "what's been shown and is it accepted," the timelines ask "what's the
  history," the Public Profile asks "what can I show someone outside the
  team." If a screen is answering two of these, it should be split.
- **No screen duplicates another's data ownership.** Room references work,
  it doesn't display its state. Commitments shows status, not evidence.
  Proof shows evidence and review decisions, not general assignment status.
  None of them re-implement each other.
- **Evidence is the visual focus on Proof**, not the chrome around it — the
  artifact and the frozen claim basis should be the largest, most prominent
  things on that screen, not a sidebar detail.
- **CLI and web are equally real, not primary/secondary — with one named
  exception.** Every screen in this inventory has a CLI counterpart
  specified in
  [[docs/mainnet-planning/First-Slice/07-cli-and-agent-workflow|07]] —
  Create Project ↔ `pods init`, Commitments ↔ `pods commitments`, Proof ↔
  `pods proof list` / `pods review approve/reject`, Room ↔ `pods room
  post/read`, the timelines ↔ `pods timeline`/`pods profile`, Roster ↔
  `pods roster`, Account ↔ `pods whoami`. Both surfaces read and write
  against the same records, and **neither is the entry point the other
  depends on** — a person can do everything in this product for the rest
  of their time using it having never once opened a terminal, including
  adding people, whether at Project creation or afterward on the Roster
  screen. The one real difference: the CLI's `pods add` completes the
  GitHub invite in one command via the lead's local `gh` session; the web
  action records the same Contact/placeholder and hands off a direct link
  to finish the invite on GitHub itself, for the structural reason given
  above — a different last step, not a missing feature.
