---
created: 2026-07-31
last-updated: 2026-07-31
project: pods
ecosystem: full-stack
tags: [mainnet, first-slice, discussions, room, github, planning]
---

# First Slice 05: Discussions and Room

Status: draft — pending review

Related: [[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01: Onboarding and setup]] |
[[docs/mainnet-planning/First-Slice/06-github-integration-architecture|06: GitHub integration architecture]] |
[[docs/mainnet-planning/14-social-rooms-and-relationships|14: Social rooms and relationships]] |
[[HANDOFF]]

## Room Is a Full V1 Screen — and the First One

Every Project has a real, in-house chat room, and it's the surface a
person lands on first when they open a Project. This was flagged as an
open question earlier (was a full chat product worth building versus
something lighter), and it's now resolved: build it, as a first-class
screen, not a lightweight stand-in — see
[[docs/mainnet-planning/First-Slice/10-web-app-screens-and-ux|10]] for
where it sits alongside Commitments and Proof.

**It still never owns work state.** Messages can reference a commitment or
a proof, but the commitment and proof objects themselves live on GitHub,
observed by Pods, and are shown on their own dedicated screens — never
inside chat. Being the first surface someone sees doesn't change this: Room
is where people talk, Commitments is where work status lives, Proof is
where evidence and review live. Being "first" means it's the entry point,
not that it absorbs the other screens' jobs.

**On chat liveness:** a chat screen that requires a manual refresh to see
new messages feels broken in a way that a commitments list refreshing on
load doesn't — conversation has a reasonable expectation of near-real-time
delivery that status views don't. This is a narrow, scoped exception to the
"no WebSocket/SSE event bus" decision in
[[docs/mainnet-planning/First-Slice/00-overview|00]]: Room can use simple
polling (or a lightweight live-update mechanism scoped to chat messages
only) without reopening that decision for commitments, proof, or timelines,
which remain refresh-on-load.

## Escalation: Chat to GitHub Discussion

When a conversation in the room turns into a real technical discussion that
deserves to live somewhere durable and linkable, an authorized person
(Project Lead or Reviewer tier) can spawn a GitHub Discussion directly from
it.

**Mechanics:**

1. The person clicks an explicit "Start GitHub Discussion from this"
   action — this is always **manual**. Pods never auto-detects that a
   conversation "got heavy"; that would be Pods making a judgment call
   about conversation quality, the same thing it deliberately avoids for
   significance tagging (see
   [[docs/mainnet-planning/First-Slice/03-proof-review-and-execution-moments|03]]).
2. A widget lets them enter the discussion's title/body and pick a category
   from whichever ones already exist on the repo (GitHub requires a
   category), defaulting to whichever was used last for that Project.
3. The Discussion is created via GitHub's GraphQL `createDiscussion`
   mutation, using the **triggering person's own GitHub token** — so it
   shows on GitHub as authored by them, not by a "Pods" bot. This matters:
   the whole product is built around correct attribution, and a bot-posted
   discussion would quietly contradict that.
4. Pods appends a short footer to the body — "Created via Pods: [pod]
   [project]" — as a human-readable breadcrumb for anyone who finds it
   directly on GitHub. This footer is **not** the mechanism Pods uses to
   classify or link the discussion later; Pods stores the discussion's
   URL and ID against the pod/project/room in its own database at creation
   time. The footer is cosmetic traceability, not structured data.
5. The resulting link is pinned in the room.

## Permission Model

Only Lead/Reviewer tier can trigger this — the same role tier that already
reviews commitments, not every room member. Triggering it requires the
person to have granted Pods discussion-write scope, which is folded into
the same initial GitHub identity-linking consent from
[[docs/mainnet-planning/First-Slice/01-onboarding-and-setup|01]] — one
consent moment, not a second prompt the first time someone tries to use
this feature.

## Why This Is a Scoped Exception, Not a Policy Change

Every other GitHub integration in this slice is read-only. Discussion
creation is the one deliberate write exception, and it's safe specifically
because a Discussion thread never touches the integrity of the
commitment/proof chain — it's purely conversational. This is different in
kind from, say, writing to issues or PRs, which this slice still never
does.
