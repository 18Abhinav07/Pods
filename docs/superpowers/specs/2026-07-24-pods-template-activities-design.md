---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [design, phase-6, templates, activity, evidence]
---

# Pods Template Activities Design

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]] |
[[validation/template-activity-spike-results]]

## 1. Purpose

Pods already publishes five fixed templates, but the participant occurrence
engine currently assumes every Pod is Build and Ship. This phase makes all five
templates truthful end to end without changing the frozen funding, review, or
settlement contracts.

The approved Cycle I template contract remains:

| Template | Mode | Frozen creator rule | Participant evidence |
|---|---|---|---|
| Fitness & Movement | Repeating criterion | Activity type and measurable minimum | In-app photo and completion note |
| Reading | Repeating criterion | Book or theme, target amount, pages or minutes | Title, completed amount, reading image, optional note |
| Study & Focus | Repeating criterion | Subject and focused-session minimum | Topic, duration, focus image, takeaway |
| Build & Ship | Per-occurrence commitment | Project theme and allowed deliverables | Locked task, result summary, matching GitHub or live URL, optional image |
| Practice & Create | Per-occurrence commitment | Discipline and minimum output | Locked output goal, artifact image or HTTPS link, reflection |

Custom templates remain out of scope.

The original Cycle I specification listed photo, audio, video, or link evidence
for Practice and Create. A later approved safety and delivery amendment
removed audio and video from this cycle. This phase therefore supports an image
or safe HTTPS artifact link. Audio and video remain explicit post-Cycle-I
work, not an accidental omission.

## 2. Approaches considered

### Separate evidence table per template

This gives strong database-level field separation, but duplicates submission,
review, privacy, feed, and settlement joins five times. It would make every
shared lifecycle change risky.

### Reuse Build text fields for every template

This avoids a migration, but turns structured quantities and evidence rules
into opaque strings. It would preserve the exact shallow behavior this phase
exists to remove.

### Discriminated template payload with shared lifecycle

This is the selected approach. A typed `TemplateEvidence` JSONB payload stores
the canonical template fields. Existing result summary, artifact URL, evidence
object, privacy, review, and settlement columns remain the shared lifecycle
boundary. Legacy Build rows with no payload are projected from their existing
columns.

## 3. Domain contract

`TemplateEvidence` is a closed discriminated union:

```ts
type TemplateEvidence =
  | {
      kind: "fitness";
      activityType: string;
      completionNote: string;
    }
  | {
      kind: "reading";
      title: string;
      amountCompleted: number;
      unit: "pages" | "minutes";
      note: string;
    }
  | {
      kind: "study";
      topic: string;
      durationMinutes: number;
      takeaway: string;
    }
  | {
      kind: "build";
      resultSummary: string;
      artifactUrl: string;
    }
  | {
      kind: "create";
      reflection: string;
      artifactUrl: string | null;
    };
```

Draft validation accepts incomplete attachment state so a draft ID can exist
before image upload. Final submission validation applies the frozen Pod rule:

- Fitness, Reading, and Study require a stored image.
- Build requires a matching HTTPS artifact URL; its image is optional.
- Practice and Create requires either a stored image or a valid HTTPS artifact
  link.
- The payload discriminator must equal the Pod template.
- Reading units must equal the frozen target unit and the completed amount must
  be positive. A below-target report is still valid evidence. The creator
  decides whether it satisfies the frozen criterion during review.
- New Study Pods use a typed minimum:
  `minimumKind: "minutes" | "output"`. A minutes minimum stores a positive
  integer `minimumMinutes`; an output minimum stores a non-empty
  `minimumOutput`. Participant duration must be positive, but a below-minimum
  duration is still valid evidence for review.
- Existing Study Pods with the legacy free-text minimum remain readable. The
  application never guesses a number from that text. Their creator evaluates
  the frozen wording during review.
- Evidence cannot be changed after submission.

All length limits and URL rules live in the domain package and are reused by
draft, submission, and reviewer projections.

## 4. Commitment compatibility

Every submission continues to reference one immutable occurrence commitment.
The commitment table gains:

- `kind`: `build | create | repeating_criterion`;
- nullable `deliverableType`, retained for Build;
- typed JSONB `details`.

Build keeps the current participant lock flow. Practice and Create uses the
same immutable lock boundary with a template-specific output goal. Repeating
templates do not show a lock step. On the first saved draft, the server creates
one system criterion commitment from the already frozen Pod contract and
projects its activity card. This preserves one activity message per occurrence
without asking the participant to reconfirm a rule they already funded.

The system criterion is deterministic and cannot be supplied by the client.

## 5. Persistence and compatibility

The submissions table gains nullable `templateEvidence` JSONB. New and edited
drafts always store it. Existing Build rows remain valid with null and are read
through a legacy projection:

```ts
{
  kind: "build",
  resultSummary: submission.resultSummary,
  artifactUrl: submission.artifactUrl
}
```

The legacy `resultSummary` and `artifactUrl` columns remain populated as safe
display projections:

- Fitness: completion note, empty URL.
- Reading: optional note or a concise completed-amount summary, empty URL.
- Study: takeaway, empty URL.
- Build: unchanged.
- Practice and Create: reflection and optional link.

No old contract, submission, review decision, ledger record, or settlement
snapshot is rewritten.

## 6. Participant experience

The route remains `/pods/:podId/activity/:occurrenceId`, but the server chooses
one of five explicit editors.

### Repeating templates

The first view is evidence capture, not commitment lock.

- Fitness shows the frozen activity and minimum, a camera-first image control,
  and completion note.
- Reading shows the frozen title or theme and target, completed quantity with a
  locked unit, reading image, and optional note.
- Study shows subject and minimum, topic, duration, focus image, and takeaway.

### Per-occurrence templates

- Build retains task and deliverable lock, then result and URL evidence.
- Practice and Create locks one output goal, then accepts reflection plus an
  image or HTTPS artifact link.

Every editor shows deadline, occurrence stake, streak, draft state, upload
progress, proof visibility, and one primary action. Privacy remains immutable
after submission. Public proof sharing is available only when the frozen Pod
contract allows public visitors.

The five editors are intentionally different:

| Template | Evidence examples | Empty state | Feed card | Share-card treatment |
|---|---|---|---|---|
| Fitness & Movement | Gym floor, completed run, class check-in, route-finish photo | “No movement logged for this occurrence yet.” | Activity type, completion note, decision, optional shared image | Night Run treatment with movement streak and activity label |
| Reading | Book page, e-reader progress, library session, reading notes | “No reading progress logged yet.” | Title, completed pages or minutes, decision, optional shared image | Playful Ritual treatment with title and reading streak |
| Study & Focus | Focus timer, notes, solved set, lesson workspace | “No focus session logged yet.” | Topic, minutes, takeaway, decision, optional shared image | Playful Ritual treatment with subject and focus streak |
| Build & Ship | Commit, pull request, issue, deployed URL, product screenshot | “No deliverable submitted for this task yet.” | Locked task, result, safe artifact link, decision, optional shared image | Living Momentum treatment with deliverable type and build streak |
| Practice & Create | Sketch, practice result, portfolio artifact, safe published link | “No practice artifact submitted for this goal yet.” | Locked goal, reflection, safe link, decision, optional shared image | Living Momentum treatment with discipline and practice streak |

Examples explain what reviewers can use, but never claim cryptographic
verification. Empty states keep the frozen requirement and deadline visible
and expose only the actor's valid next action.

## 7. Creator review and social projections

Review screens render the template fields with template-specific labels and
the frozen rule beside them. The creator receives private evidence through the
existing authorized object route.

Proof sharing applies to the complete group-safe proof projection, not only its
image. Room, proof-list, visitor, and owner projections use this field-level
audience matrix:

| Audience | Evidence-derived fields |
|---|---|
| Submission owner | All canonical participant fields and the owner's authorized attachment |
| Pod creator/reviewer | All canonical participant fields, reviewer evidence, and the authorized attachment |
| Roster-locked member | Group-safe fields and attachment only for `pod_shared` or `public` proof |
| Public visitor | Group-safe fields and attachment only for `public` proof on a public-read-only-enabled Pod |
| Any other audience | No evidence-derived fields |

Group-safe fields are the allowlisted template rows used by its feed card:
Fitness activity/note, Reading title/amount/note, Study topic/duration/takeaway,
Build result/safe artifact URL, or Practice reflection/safe artifact URL.
When sharing does not authorize an audience, the card may show only
non-evidence system facts such as template, occurrence, participant display
identity allowed by the existing Pod policy, and review status. It must not
show a summary synthesized from private evidence.

No projection ever returns object keys, wallet addresses, raw private
evidence, reviewer-only notes to peers, or financial details. Current visitor
projections that expose `resultSummary` or `artifactUrl` without this
authorization are a known defect and are corrected in this phase.

## 8. Error and lifecycle behavior

- A repeating participant cannot call the commitment-lock endpoint.
- A payload for the wrong template is rejected.
- An image-required template cannot submit without a stored image.
- Reading with a zero or negative amount cannot submit. Below-target progress
  reaches creator review and may be rejected there.
- Study with zero or negative duration cannot submit.
- Practice and Create cannot submit without either image or valid link.
- Today and the Pod room derive the valid next action from the frozen
  template's evidence mode. Repeating templates open evidence capture directly
  even before their deterministic criterion commitment has been materialized.
- Deadline checks use the audited Clock boundary already used by Build.
- Failed uploads preserve the draft and allow replacement.
- Review, timeout protection, settlement, and payout behavior remain unchanged.

## 9. Scope boundary

This phase does not add custom templates, audio or video proof, multiple
attachments, health-device integrations, GPS verification, AI verification,
or new review states. Practice and Create supports the later approved
image-or-link Cycle I amendment. General authorized room media and recovery
remain the next isolated phase.

## 10. Validation

The branch gate requires:

- domain tests for all template payloads and negative rules;
- database integration tests for repeating criterion materialization, creative
  commitment locking, legacy Build compatibility, final submission, privacy,
  and unchanged settlement outcomes;
- route and component tests for all five editors;
- creator-review, room, proof-list, and visitor DTO redaction tests;
- mobile Safari and Android browser journeys for one repeating template and
  Practice and Create;
- the full repository gate.

No wallet action is introduced in this phase. Existing funding and payout
wallet boundaries receive regression coverage only.
