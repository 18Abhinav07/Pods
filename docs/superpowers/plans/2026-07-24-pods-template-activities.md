---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [implementation-plan, phase-6, templates, activity, evidence]
---

# Pods Template Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-24-pods-template-activities-design]] |
[[validation/template-activity-spike-results]]

**Goal:** Make Fitness, Reading, Study, Build, and Practice participant,
creator-review, room, proof-list, and visitor flows truthful to their frozen
template contracts.

**Architecture:** A closed domain union validates template evidence. New
submissions persist the canonical payload as JSONB while shared legacy columns
remain safe display projections. Every submission still references one
immutable occurrence commitment, with system-generated criterion commitments
for repeating templates and participant-locked commitments for Build and
Practice.

**Tech Stack:** TypeScript, React, Next.js App Router, Drizzle ORM, PostgreSQL,
Vitest, Testing Library, Playwright, existing private evidence storage.

---

## Locked boundaries

- Branch: `add/phase-template-activities`, based on `5812d83`.
- The five templates and their evidence modes are frozen.
- No custom template, new currency, new review state, or settlement formula.
- Existing Build contracts and submissions remain readable without mutation.
- Repeating templates never ask a participant to lock the creator's frozen
  criterion again.
- Practice uses a participant-locked output goal.
- Fitness, Reading, and Study require an evidence image before final submit.
- Build requires a matching HTTPS artifact and keeps its optional image.
- Practice requires an image or HTTPS link.
- Practice's image-or-link evidence is the later approved Cycle I safety and
  delivery amendment; audio and video remain deferred.
- Privacy choice freezes at final submission.
- Existing wallet flows receive regression coverage only.
- Time moves only through the audited Clock boundary.

## Task 0: Typed evidence and commitment contract

**Files:**

- Create: `packages/domain/src/template-evidence.ts`
- Modify: `packages/domain/src/activity.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `packages/domain/tests/template-evidence.test.ts`

- [ ] Write failing tests for valid normalized Fitness, Reading, Study, Build,
  and Practice drafts.
- [ ] Write failing tests for a wrong discriminator, non-positive Reading
  progress, reading unit mismatch, non-positive Study duration, missing
  required image, invalid Build URL, invalid Practice link, and Practice with
  neither image nor link.
- [ ] Prove below-target Reading progress and below-minimum Study duration are
  valid submissions that reach creator review rather than becoming missed.
- [ ] Define the closed union:

```ts
export type TemplateEvidence =
  | { kind: "fitness"; activityType: string; completionNote: string }
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
  | { kind: "build"; resultSummary: string; artifactUrl: string }
  | { kind: "create"; reflection: string; artifactUrl: string | null };
```

- [ ] Add `CommitmentKind = "build" | "create" |
  "repeating_criterion"` and typed commitment details.
- [ ] Implement `validateTemplateEvidenceDraft()` and
  `validateTemplateEvidenceSubmission()` so final validation receives
  `hasEvidenceImage`.
- [ ] Implement `legacySubmissionProjection()` returning safe
  `resultSummary` and `artifactUrl` values for shared feeds.
- [ ] Run:

```bash
pnpm --filter @pods/domain test -- template-evidence.test.ts
```

Expected: the new suite passes and existing Build validators remain green.

- [ ] Commit:

```bash
git add packages/domain
git commit -m "feat: define typed template evidence"
```

## Task 1: Additive persistence and legacy bridge

**Files:**

- Modify: `packages/db/src/schema.ts`
- Modify: `packages/db/src/activity-repository.ts`
- Modify: `packages/db/src/repository.ts`
- Generate: `packages/db/migrations/0016_*.sql`
- Create: `packages/db/tests/phase6-template-activities.integration.test.ts`

- [ ] Write a failing integration test that creates one Pod for every template
  and proves:

```ts
expect(fitness.commitment.kind).toBe("repeating_criterion");
expect(reading.submission.templateEvidence.kind).toBe("reading");
expect(study.submission.templateEvidence.kind).toBe("study");
expect(build.submission.templateEvidence.kind).toBe("build");
expect(create.commitment.kind).toBe("create");
```

- [ ] Add `occurrence_commitments.kind`, nullable
  `occurrence_commitments.deliverable_type`, and
  `occurrence_commitments.details`.
- [ ] Add nullable `submissions.template_evidence`.
- [ ] Backfill only the commitment kind for existing rows as `build`. Do not
  synthesize evidence payloads or rewrite old submissions.
- [ ] Generate the migration with:

```bash
pnpm --filter @pods/db db:generate
```

- [ ] Add a repository helper that creates a deterministic system criterion
  commitment from the frozen contract. It must ignore all client criterion
  fields and use the transaction that saves the first draft.
- [ ] Preserve one activity message per commitment with the existing unique
  relation.
- [ ] Make Build and Practice commitment writes explicit and immutable.
- [ ] Store canonical `templateEvidence` plus safe legacy projections in one
  draft transaction.
- [ ] Read a null payload on an existing Build row through
  `legacySubmissionProjection()`.
- [ ] Run:

```bash
pnpm exec vitest run packages/db/tests/phase6-template-activities.integration.test.ts --config vitest.integration.config.ts
```

Expected: all template, legacy, and rollback cases pass.

- [ ] Commit:

```bash
git add packages/db
git commit -m "feat: persist template activity evidence"
```

## Task 2: Template-aware activity mutations

**Files:**

- Modify:
  `apps/web/src/app/api/pods/[podId]/occurrences/[occurrenceId]/commitment/route.ts`
- Modify:
  `apps/web/src/app/api/pods/[podId]/occurrences/[occurrenceId]/draft/route.ts`
- Modify:
  `apps/web/src/app/api/pods/[podId]/submissions/[submissionId]/submit/route.ts`
- Modify:
  `apps/web/src/app/api/pods/[podId]/occurrences/[occurrenceId]/evidence/route.ts`
- Create: `apps/web/tests/template-activity-routes.test.ts`

- [ ] Write failing route tests proving:

```ts
expect(repeatingCommitment.status).toBe(400);
expect(buildCommitment.status).toBe(201);
expect(createCommitment.status).toBe(201);
expect(wrongTemplateDraft.status).toBe(400);
expect(missingRequiredImageSubmit.status).toBe(400);
```

- [ ] Change the commitment request to accept Build `{ task,
  deliverableType }` or Practice `{ goal }`, with the repository deriving the
  template from the Pod.
- [ ] Change draft requests to accept `{ templateEvidence, proofShareMode }`.
  Ignore client-provided template IDs, membership IDs, commitment IDs, and
  attachment keys.
- [ ] Keep upload authorization bound to the session-owned editable draft.
- [ ] Revalidate the canonical payload and attachment requirement inside final
  submission, not only in the client.
- [ ] Preserve the current deadline, immutability, review-deadline, realtime,
  and activity-message transitions.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- template-activity-routes.test.ts
pnpm exec vitest run packages/db/tests/phase6-template-activities.integration.test.ts --config vitest.integration.config.ts
```

- [ ] Commit:

```bash
git add apps/web/src/app/api apps/web/tests/template-activity-routes.test.ts
git commit -m "feat: route template activity mutations"
```

## Task 3: Split the participant occurrence studio

**Files:**

- Modify: `apps/web/src/components/activity-occurrence.tsx`
- Create: `apps/web/src/components/activity-editor/types.ts`
- Create: `apps/web/src/components/activity-editor/proof-controls.tsx`
- Create: `apps/web/src/components/activity-editor/build-editor.tsx`
- Create: `apps/web/src/components/activity-editor/fitness-editor.tsx`
- Create: `apps/web/src/components/activity-editor/reading-editor.tsx`
- Create: `apps/web/src/components/activity-editor/study-editor.tsx`
- Create: `apps/web/src/components/activity-editor/create-editor.tsx`
- Modify: `apps/web/tests/activity-occurrence.test.tsx`
- Create: `apps/web/tests/template-activity-editors.test.tsx`

- [ ] Keep `ActivityOccurrence` responsible only for the shared header,
  occurrence facts, terminal status, and template dispatch.
- [ ] Extract shared proof privacy, camera/image upload, upload progress, draft
  status, and submit control into `ProofControls`.
- [ ] Write failing component tests proving each editor uses its exact fields:

```ts
expect(screen.getByLabelText("Completion note")).toBeVisible();
expect(screen.getByLabelText("Amount completed")).toBeVisible();
expect(screen.getByLabelText("Focus duration")).toBeVisible();
expect(screen.getByLabelText("Result summary")).toBeVisible();
expect(screen.getByLabelText("Reflection")).toBeVisible();
```

- [ ] Prove Fitness, Reading, and Study contain no commitment-lock CTA.
- [ ] Prove Build and Practice contain one lock CTA before evidence.
- [ ] Prove image-required editors block final submission until upload
  completes.
- [ ] Preserve autosave with a per-request version so stale responses cannot
  overwrite later input.
- [ ] Keep one primary action and use the existing adaptive template classes.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- activity-occurrence.test.tsx template-activity-editors.test.tsx
```

- [ ] Commit:

```bash
git add apps/web/src/components/activity-occurrence.tsx apps/web/src/components/activity-editor apps/web/tests
git commit -m "feat: add five template occurrence studios"
```

## Task 4: Server page and Today action truthfulness

**Files:**

- Modify: `apps/web/src/app/pods/[podId]/activity/[occurrenceId]/page.tsx`
- Modify: `apps/web/src/app/today/page.tsx`
- Modify: `apps/web/src/lib/today-priority.ts`
- Modify: `apps/web/src/lib/room-activity-presentation.ts`
- Modify: `apps/web/tests/today-priority.test.ts`
- Modify: `apps/web/tests/today-page.test.tsx`
- Modify: `apps/web/tests/room-activity-presentation.test.ts`
- Create: `apps/web/tests/template-activity-page.test.tsx`

- [ ] Write failing tests proving the occurrence page dispatches from
  `contractData.templateId`, never a query parameter or client payload.
- [ ] Pass only the selected template's frozen configuration to the client
  editor.
- [ ] Update Today action derivation:

```ts
const needsCommitment =
  templateId === "build" || templateId === "create";
```

- [ ] Update room action derivation from the same frozen evidence mode so a
  repeating template opens evidence capture instead of rendering a lock action
  that its server rejects.
- [ ] Use template-aware copy for commitment, evidence, review, approved,
  rejected, timeout-protected, and upcoming states.
- [ ] Ensure Today still exposes only one primary action.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- template-activity-page.test.tsx today-priority.test.ts today-page.test.tsx room-activity-presentation.test.ts
```

- [ ] Commit:

```bash
git add apps/web/src/app/pods apps/web/src/app/today apps/web/src/lib/today-priority.ts apps/web/tests
git commit -m "feat: route template activity actions"
```

## Task 5: Template-aware creator review

**Files:**

- Modify: `packages/db/src/activity-repository.ts`
- Modify:
  `apps/web/src/app/pods/[podId]/admin/reviews/[submissionId]/page.tsx`
- Create: `apps/web/src/lib/template-evidence-presentation.ts`
- Modify: `apps/web/tests/creator-review-page.test.tsx`
- Create: `apps/web/tests/template-evidence-presentation.test.ts`

- [ ] Create a pure allowlisted presentation helper returning template name,
  frozen criterion, labeled evidence rows, safe artifact link, and
  image-required status.
- [ ] Write tests for all five presentations and a legacy Build submission.
- [ ] Include `templateEvidence` and `templateId` in the creator-only repository
  projection without exposing any additional participant identity or
  financial data.
- [ ] Render the exact frozen rule and template fields in the reviewer
  workspace.
- [ ] Keep creator-only image retrieval on the existing authenticated route.
- [ ] Keep approve and reject state transitions unchanged.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- creator-review-page.test.tsx template-evidence-presentation.test.ts
```

- [ ] Commit:

```bash
git add packages/db/src/activity-repository.ts apps/web/src/app/pods apps/web/src/lib/template-evidence-presentation.ts apps/web/tests
git commit -m "feat: present template proof for creator review"
```

## Task 6: Owner, Pod, room, and visitor projections

**Files:**

- Modify: `packages/db/src/activity-repository.ts`
- Modify: `packages/db/src/messaging-repository.ts`
- Modify: `packages/db/src/public-room-repository.ts`
- Modify: `apps/web/src/app/pods/[podId]/activity/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/submissions/[submissionId]/page.tsx`
- Modify: `apps/web/src/components/pod-room.tsx`
- Modify: `apps/web/src/components/public-visitor-room.tsx`
- Modify: `apps/web/tests/pod-activity-page.test.tsx`
- Modify: `apps/web/tests/participant-submission-page.test.tsx`
- Modify: `apps/web/tests/pod-room.test.tsx`
- Modify: `apps/web/tests/public-visitor-room.test.tsx`
- Modify: `packages/db/tests/visitor-public-read.integration.test.ts`

- [ ] Write failing DTO tests for the complete audience matrix:
  owner, creator/reviewer, roster member with private proof, roster member with
  Pod-shared proof, visitor with Pod-shared proof, visitor with public proof,
  and unrelated actor.
- [ ] Prove `resultSummary`, `artifactUrl`, all structured metrics, and the
  attachment are absent whenever the proof share mode does not authorize that
  audience.
- [ ] Project template ID and allowlisted group-safe evidence presentation into
  authorized member room cards and proof lists.
- [ ] Keep owner-only details on the authenticated submission page.
- [ ] Render distinct card labels, accessible summaries, evidence examples,
  template empty states, and feed-card treatments for all templates.
- [ ] Add sanitized template-specific share-card data that follows the same
  evidence audience rule and never embeds raw evidence media by default.
- [ ] Preserve public visibility checks before any visitor image or structured
  proof field is returned.
- [ ] Preserve the same activity message ID as a proof moves from draft to
  reviewing to terminal state.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- pod-activity-page.test.tsx participant-submission-page.test.tsx pod-room.test.tsx public-visitor-room.test.tsx
pnpm exec vitest run packages/db/tests/visitor-public-read.integration.test.ts --config vitest.integration.config.ts
```

- [ ] Commit:

```bash
git add packages/db apps/web
git commit -m "feat: project template proofs safely"
```

## Task 7: Creation and contract review polish

**Files:**

- Modify: `apps/web/src/components/activity-form.tsx`
- Modify: `apps/web/src/lib/wizard-payloads.ts`
- Modify: `apps/web/src/app/pods/create/review/page.tsx`
- Create: `apps/web/tests/activity-form.test.tsx`
- Modify: `apps/web/tests/wizard-payloads.test.ts`
- Create: `apps/web/tests/review-page.test.tsx`
- Modify: `packages/domain/tests/pod-contract.test.ts`

- [ ] Verify every creator form captures the exact fixed template rule and
  never displays Build-specific language for another template.
- [ ] New Study Pods capture a typed `minimumKind`. Minutes stores a positive
  integer `minimumMinutes`; output stores non-empty `minimumOutput`.
- [ ] Keep legacy Study free-text minimums readable and reviewer-evaluated.
  Never parse a number from free text.
- [ ] Show the exact participant evidence list on the review screen before
  publication.
- [ ] Show each template's approved evidence examples and share-card treatment
  without implying automated or cryptographic verification.
- [ ] Prove the materialized occurrence count and NIM total remain unchanged.
- [ ] Run:

```bash
pnpm --filter @pods/web test -- activity-form.test.tsx wizard-payloads.test.ts review-page.test.tsx
pnpm --filter @pods/domain test -- pod-contract.test.ts
```

- [ ] Commit:

```bash
git add apps/web packages/domain/tests
git commit -m "fix: align template creation contracts"
```

## Task 8: Browser gate and branch completion

**Files:**

- Create: `apps/web/tests/e2e/phase6-template-activities.spec.ts`
- Create: `validation/phase-6-template-activities-results.md`
- Modify: `HANDOFF.md`
- Modify: `history/session-log.md`

- [ ] Run the full automated gate:

```bash
pnpm check
```

- [ ] Run a mobile Safari journey for Reading:
  create or seed a frozen Reading occurrence, enter completed quantity, save
  a draft, upload an image, choose privacy, submit, and render creator review.
- [ ] Run an Android Chromium journey for Practice:
  lock an output goal, add reflection plus image or link, submit, and render
  the stable room activity card.
- [ ] Verify Build still completes its existing lock, draft, upload, submit,
  review, settlement, and payout projections.
- [ ] Run a source scan proving no product copy contains U+2014.
- [ ] Record automated and browser evidence separately from any future physical
  Nimiq Pay regression.
- [ ] Commit only after every automated and browser requirement passes. Do not
  push or deploy without explicit authorization.
