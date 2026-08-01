---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, cli, agents, mcp, planning]
---

# First Slice 07: CLI and Agent Workflow

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01: Onboarding and setup]] |
[[docs/mainnet-planning/First-Slice/02-tasks-commitments-and-issues|02: Tasks, commitments and issues]] |
[[docs/mainnet-planning/First-Slice/09-open-decisions|09: Open decisions]] |
[[HANDOFF]]

## Core CLI Surface For This Slice

- `pods init` — new/join Project, repo linking, GitHub App install check,
  and an **inline prompt to add people** from Contacts or by GitHub
  username before finishing (see
  [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]) — the
  initial roster is part of creation, not a separate step run afterward.
- `pods link` — device-flow OAuth identity linking, modeled directly on
  `gh auth login`: opens one browser tab, user approves, CLI receives the
  token, done. **Comes before every other command** — if any command runs
  without an active session, it triggers this flow first rather than
  failing (see
  [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]).
- `pods whoami` — shows your own linked GitHub identity and which Projects
  you're part of; the CLI counterpart to the Account screen.
- `pods contacts` — lists your personal Contacts (everyone you've shared a
  Project with, plus anyone you've explicitly added), the CLI counterpart
  to the Contacts picker used in `pods init` and the Roster screen's Add
  Person action.
- `pods add <github-username>` — adds someone onto a Project's roster
  after creation (the same action `pods init`'s inline prompt performs at
  creation time), creating a placeholder Person record for them if they've
  never used Pods (see
  [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]]), and
  completing the GitHub collaborator invite via the lead's local `gh`
  session in one command.
- `pods roster` — lists everyone on the current Project and their status
  (active / pending GitHub invite / placeholder), plus the same add action
  as `pods add`; the CLI counterpart to the Roster screen.
- `pods accept-invites` — accepts pending GitHub collaborator invitations
  using the person's own linked token. This grants repo access only — it
  is separate from and does not require Pods authentication.
- `pods commitments` — lists commitments on the current Project (assignee,
  status), the CLI counterpart to the Commitments screen in
  [[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]].
- `pods proof list` — shows every commitment's proof trail (PR link + review
  state, or manual artifact + decision), the CLI counterpart to the Proof
  screen.
- `pods submit` — attaches a manual proof artifact (image/video) to a
  commitment, for the non-code proof path in
  [[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]].
- `pods review approve <commitment-id>` / `pods review reject
  <commitment-id> [--reason]` — the reviewer-side counterpart for manual
  proof, since that path has no GitHub PR to review on GitHub itself.
- `pods room post "<message>"` / `pods room read` — lightweight terminal
  parity for the Room screen; not a full chat client, just enough for a
  CLI-only session to post an update or catch up without opening the web
  app.
- `pods timeline [--me|--project]` / `pods profile` — prints the personal
  or project timeline, and the public shareable profile link, matching the
  timeline screens in
  [[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]].

**Not on the critical path for code-based work.** Because a commitment is
created by GitHub assignment and proven by a merged, reviewed PR, the core
loop for code contributions runs entirely through GitHub webhooks — a
builder writing code never needs to open the CLI at all. The CLI's real job
in this slice is the two things GitHub can't do on its own: manual-artifact
proof, and setup.

## Why There's No Native MCP Server In This Slice

A full MCP server (a separate protocol implementation with its own tool
schemas, exposed over stdio/SSE) was considered and deliberately left out.
The CLI + AGENTS.md manifest pattern above already gives a coding agent
everything it needs to participate — it reads the manifest, calls `pods`
commands, and confirms with the human in the same conversation. Building a
second, parallel integration surface for the same capability would be
duplicate engineering, not a missing piece. If a native MCP server is
wanted later — e.g. because agents need structured tool responses the CLI's
text output can't give them cleanly — that's a real, separate feature to
brainstorm on its own merits, not something this slice is incomplete
without.

## The Agent-Discoverable Manifest

`pods init` writes a short stanza into whichever agent-instructions file
the repo already uses — `AGENTS.md`, `CLAUDE.md`, `.cursorrules` — creating
`AGENTS.md` if none exists, since it's the emerging vendor-neutral
convention. The stanza is short and direct, e.g.:

> This project tracks execution via Pods. When you complete an assigned
> task, log it with `pods submit` before considering the task finished.

Any coding agent that already reads its instructions file — which most
current agents do as a matter of course — picks this up naturally and
incorporates it into its own workflow, the same way it already runs tests
or commits code. The builder using an agent doesn't have to remember to
open Pods; their agent does the reporting as part of finishing the task.

## Preserving Consent for Agent-Driven Submission

Fully autonomous, zero-confirmation submission is explicitly **not**
supported in this slice. Even when an agent is the one calling `pods
submit`, it should ask in the same conversation — "log this as proof to
Pods?" — before running the command. This costs no real friction (it's one
more line in a conversation the builder is already having with their
agent, not a context switch to another app) and keeps proof submission
consensual rather than silent.

## Explicitly Deferred, Not In This Slice

The following were raised during design discussion and are real, valuable
ideas — each is deferred to its own future brainstorm rather than folded in
here as an underdeveloped add-on:

- **`pods review help`** — an agent-assisted review command that fetches
  proof a person is assigned to review so their own agent can help assess
  it.
- **Daily commitment/review notification and scheduling service** — fixed
  windows (e.g. commitment 09:00–21:00, review 22:00–08:00) with reminders
  so nothing is missed. This is real infrastructure (a scheduler, a
  delivery channel, timezone handling) independent of the core loop.
- **Commit-message-driven auto-classification** — having an agent author
  commit/PR messages in a way that signals significance (Canonical /
  Milestone / Daily Task) directly, rather than relying purely on
  lead-set milestone structure.
- **Builder reputation/accountability system** — handling non-performing
  members, flagging, and any cross-project reputation signal.

Each is tracked in
[[docs/mainnet-planning/First-Slice/09-open-decisions|09]].
