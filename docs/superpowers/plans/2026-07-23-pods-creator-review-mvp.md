---
created: 2026-07-23
project: pods
ecosystem: nimiq
tags: [pods, phase-4, implementation-plan, creator-review, proof]
status: awaiting-execution
---

# Pods Creator Review MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace centralized proof approval with creator-scoped approval, rejection, and 24-hour timeout protection while keeping the creator outside member funding and payouts.

**Architecture:** Submission state remains authoritative in Postgres. A connected creator acts through Pod-scoped routes whose repository queries prove ownership server-side. The worker uses the same audited Clock and transactional state guard to protect reviews that reach the hard deadline. Room, Today, Updates, proof history, and participant detail remain projections of the same submission and review-decision records.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Postgres, Vitest, Testing Library, Playwright, Railway, Nimiq Pay Testnet.

**Approved design:** `docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design.md`

---

## File Structure

### Domain and persistence

- Modify `packages/domain/src/activity.ts`
  - Own the creator review command type, input validation, and submission state transitions.
- Modify `packages/domain/src/index.ts`
  - Freeze `verification.verifier = "creator"` into every new published Pod contract.
- Modify `packages/domain/tests/activity.test.ts`
  - Prove participant submission, creator decisions, system timeout, terminal immutability, and input validation.
- Modify `packages/domain/tests/pod-contract.test.ts`
  - Prove new contracts disclose creator verification.
- Modify `packages/db/src/schema.ts`
  - Add `reviewedAt`, expand review-decision types, and enforce one decision per submission.
- Create `packages/db/migrations/0012_creator_review_mvp.sql`
  - Add the terminal timestamp and replace the action-scoped uniqueness index.
- Modify `packages/db/migrations/meta/_journal.json`
  - Register migration 0012 through Drizzle generation.
- Create `packages/db/migrations/meta/0012_snapshot.json`
  - Capture the generated schema snapshot.
- Modify `packages/db/src/activity-repository.ts`
  - Add creator-scoped queue/detail/evidence queries, one terminal decision command, timeout protection, participant decision projection, and timeout-aware streaks.
- Modify `packages/db/src/public-room-repository.ts`
  - Project approved, rejected, and timeout-protected states without exposing private reasons.
- Modify `packages/db/src/inbox-repository.ts`
  - Expose the terminal review timestamp needed by Updates.
- Modify `packages/db/tests/phase4-activity.integration.test.ts`
  - Prove authorization, privacy, concurrency, rejection, timeout, streaks, and immutable room projections.
- Modify `packages/db/tests/visitor-public-read.integration.test.ts`
  - Prove visitors see only allowed public proof state and never decision reasons.

### Worker

- Create `apps/worker/src/activity/run-review-timeout-cycle.ts`
  - Resolve due reviews from the audited Clock.
- Modify `apps/worker/src/index.ts`
  - Run review timeout protection in the existing worker loop.
- Create `apps/worker/tests/run-review-timeout-cycle.test.ts`
  - Prove audited time is used and repository failures mark the worker cycle unhealthy.
- Modify `apps/worker/tests/worker-configuration.test.ts`
  - Keep the production import and worker-cycle contract green.

### Creator routes and UI

- Create `apps/web/src/app/api/pods/[podId]/admin/reviews/route.ts`
  - Return the connected creator's pending queue.
- Create `apps/web/src/app/api/pods/[podId]/admin/reviews/[submissionId]/evidence/route.ts`
  - Stream only repository-authorized creator evidence.
- Create `apps/web/src/app/api/pods/[podId]/admin/reviews/[submissionId]/decision/route.ts`
  - Validate and record one creator decision.
- Create `apps/web/src/app/pods/[podId]/admin/reviews/page.tsx`
  - Render the Pod-scoped review queue.
- Create `apps/web/src/app/pods/[podId]/admin/reviews/[submissionId]/page.tsx`
  - Render the locked task, participant identity, proof, and decision controls.
- Create `apps/web/src/components/creator-review-form.tsx`
  - Handle approve, reject, pending, error, and already-decided states.
- Modify `apps/web/src/app/pods/[podId]/admin/page.tsx`
  - Show review count and direct creator action for active Pods.
- Modify `apps/web/src/app/globals.css`
  - Style the queue, review workspace, rejection panel, and compact mobile actions.
- Create `apps/web/tests/creator-review-route.test.ts`
  - Prove session, ownership, validation, stable conflict, and safe 404 behavior.
- Create `apps/web/tests/creator-review-evidence-route.test.ts`
  - Prove private media authorization and no object-key leakage.
- Create `apps/web/tests/creator-review-page.test.tsx`
  - Prove participant profile, locked commitment, evidence, and both decision controls render.
- Modify `apps/web/tests/creator-admin-state.test.tsx`
  - Prove active creator controls expose the pending-review action.

### Participant projections and operations removal

- Modify `apps/web/src/components/activity-occurrence.tsx`
  - Rename private proof sharing to `Creator only` and render every terminal state.
- Modify `apps/web/src/app/pods/[podId]/submissions/[submissionId]/page.tsx`
  - Show creator approval, private rejection reason, or timeout protection.
- Modify `apps/web/src/app/pods/[podId]/activity/page.tsx`
  - Render consistent proof-state labels.
- Modify `apps/web/src/lib/room-activity-presentation.ts`
  - Treat rejected and timeout-protected proofs as terminal room states.
- Modify `apps/web/src/lib/today-priority.ts`
  - Add participant terminal states and a creator proof-review action.
- Modify `apps/web/src/app/today/page.tsx`
  - Prioritize pending creator proof reviews and use creator-review wording.
- Modify `apps/web/src/lib/inbox-events.ts`
  - Emit submitted, approved, rejected, and timeout-protected events.
- Modify `apps/web/src/components/public-visitor-room.tsx`
  - Display public terminal status without private reasons.
- Modify `apps/web/src/components/invitation-landing.tsx`
- Modify `apps/web/src/components/landing-previews.tsx`
- Modify `apps/web/src/components/funding-commitment.tsx`
- Modify `apps/web/src/components/pod-waiting-room.tsx`
- Modify `apps/web/src/components/community-form.tsx`
- Modify `apps/web/src/app/pods/[podId]/page.tsx`
- Modify `apps/web/src/app/pods/[podId]/rules/page.tsx`
- Modify `apps/web/src/app/pods/create/review/page.tsx`
  - Replace centralized-review copy with the approved creator disclosure.
- Delete `apps/web/src/app/api/ops/reviews/[submissionId]/approve/route.ts`
- Delete `apps/web/src/app/api/ops/reviews/[submissionId]/evidence/route.ts`
- Delete `apps/web/src/app/ops/reviews/page.tsx`
- Delete `apps/web/src/app/ops/reviews/[submissionId]/page.tsx`
- Delete `apps/web/src/components/review-approval-form.tsx`
- Modify `apps/web/src/app/ops/connect/page.tsx`
- Modify `apps/web/src/app/api/ops/session/route.ts`
- Modify `apps/web/src/app/ops/public-safety/page.tsx`
  - Keep operations limited to public safety and reports.
- Modify the affected web unit tests and `apps/web/tests/e2e/phase4-activity.spec.ts`.

## Task 1: Freeze the Creator Review Domain Contract

**Files:**
- Modify: `packages/domain/src/activity.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/tests/activity.test.ts`
- Test: `packages/domain/tests/pod-contract.test.ts`

- [ ] **Step 1: Write the failing creator-review state tests**

Replace the old reviewer-authority test in `packages/domain/tests/activity.test.ts` with:

```ts
it("allows only the participant to submit and only the creator to decide", () => {
  expect(nextSubmissionState("draft", "submit", "participant")).toBe("reviewing");
  expect(nextSubmissionState("reviewing", "approve", "creator")).toBe("approved");
  expect(nextSubmissionState("reviewing", "reject", "creator")).toBe("rejected");
  expect(nextSubmissionState("reviewing", "protect_timeout", "system"))
    .toBe("timeout_protected");
  expect(nextSubmissionState("reviewing", "approve", "participant")).toBeNull();
  expect(nextSubmissionState("approved", "reject", "creator")).toBeNull();
  expect(nextSubmissionState("rejected", "approve", "creator")).toBeNull();
  expect(nextSubmissionState("timeout_protected", "approve", "creator")).toBeNull();
});

it("validates the two creator decision bodies", () => {
  expect(validateCreatorReviewDecision({ decision: "approve", note: "  Solid work.  " }))
    .toEqual({ success: true, value: { decision: "approve", note: "Solid work." } });
  expect(validateCreatorReviewDecision({ decision: "approve" }))
    .toEqual({ success: true, value: { decision: "approve", note: "" } });
  expect(validateCreatorReviewDecision({
    decision: "reject",
    reason: "The link does not contain the locked deliverable."
  })).toEqual({
    success: true,
    value: {
      decision: "reject",
      reason: "The link does not contain the locked deliverable."
    }
  });
  expect(validateCreatorReviewDecision({ decision: "reject", reason: "Too short" }))
    .toEqual({
      success: false,
      errors: ["Explain the rejection in 12 to 500 characters"]
    });
});
```

Add this assertion to the published-contract test:

```ts
expect(result.contract.verification).toEqual({
  verifier: "creator",
  targetReviewHours: 12,
  timeoutProtectionHours: 24
});
```

- [ ] **Step 2: Run the focused domain tests and verify failure**

Run:

```bash
pnpm --filter @pods/domain test -- activity.test.ts pod-contract.test.ts
```

Expected: FAIL because `creator`, `reject`, `protect_timeout`, terminal states, and `validateCreatorReviewDecision` do not exist yet.

- [ ] **Step 3: Implement the minimal domain types and transitions**

Use this contract in `packages/domain/src/activity.ts`:

```ts
export type SubmissionState =
  | "draft"
  | "reviewing"
  | "approved"
  | "rejected"
  | "timeout_protected";
export type SubmissionActor = "participant" | "system" | "creator";
export type SubmissionEvent = "submit" | "approve" | "reject" | "protect_timeout";

export type CreatorReviewDecision =
  | { decision: "approve"; note: string }
  | { decision: "reject"; reason: string };

export function validateCreatorReviewDecision(
  input: unknown
):
  | { success: true; value: CreatorReviewDecision }
  | { success: false; errors: string[] } {
  if (!input || typeof input !== "object") {
    return { success: false, errors: ["Choose approve or reject"] };
  }
  const record = input as Record<string, unknown>;
  if (record.decision === "approve") {
    const note = typeof record.note === "string" ? record.note.trim() : "";
    if (note.length > 500) {
      return { success: false, errors: ["Keep the approval note within 500 characters"] };
    }
    return { success: true, value: { decision: "approve", note } };
  }
  if (record.decision === "reject") {
    const reason = typeof record.reason === "string" ? record.reason.trim() : "";
    if (reason.length < 12 || reason.length > 500) {
      return {
        success: false,
        errors: ["Explain the rejection in 12 to 500 characters"]
      };
    }
    return { success: true, value: { decision: "reject", reason } };
  }
  return { success: false, errors: ["Choose approve or reject"] };
}

export function nextSubmissionState(
  state: SubmissionState,
  event: SubmissionEvent,
  actor: SubmissionActor
): SubmissionState | null {
  if (state === "draft" && event === "submit" && actor === "participant") {
    return "reviewing";
  }
  if (state === "reviewing" && event === "approve" && actor === "creator") {
    return "approved";
  }
  if (state === "reviewing" && event === "reject" && actor === "creator") {
    return "rejected";
  }
  if (state === "reviewing" && event === "protect_timeout" && actor === "system") {
    return "timeout_protected";
  }
  return null;
}
```

Change both the `PublishedPodContractBase` type and `buildPublishedContract()` output in `packages/domain/src/index.ts` to:

```ts
verification: {
  verifier: "creator";
  targetReviewHours: 12;
  timeoutProtectionHours: 24;
}
```

- [ ] **Step 4: Run the domain tests and typecheck**

Run:

```bash
pnpm --filter @pods/domain test
pnpm --filter @pods/domain typecheck
```

Expected: all domain tests pass and TypeScript reports no errors.

- [ ] **Step 5: Commit the domain contract**

```bash
git add packages/domain/src/activity.ts packages/domain/src/index.ts packages/domain/tests/activity.test.ts packages/domain/tests/pod-contract.test.ts
git commit -m "feat: freeze creator proof review contract"
```

## Task 2: Make Creator Decisions and Timeout Protection Authoritative

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/migrations/0012_creator_review_mvp.sql`
- Modify: `packages/db/migrations/meta/_journal.json`
- Create: `packages/db/migrations/meta/0012_snapshot.json`
- Modify: `packages/db/src/activity-repository.ts`
- Modify: `packages/db/src/public-room-repository.ts`
- Modify: `packages/db/src/inbox-repository.ts`
- Test: `packages/db/tests/phase4-activity.integration.test.ts`
- Test: `packages/db/tests/visitor-public-read.integration.test.ts`

- [ ] **Step 1: Rewrite the integration fixture contract and decision assertions**

Change every Phase 4 fixture to:

```ts
verification: {
  verifier: "creator",
  targetReviewHours: 12,
  timeoutProtectionHours: 24
}
```

In `packages/db/tests/phase4-activity.integration.test.ts`, replace the centralized approval assertions with these cases:

```ts
async function createReviewingSubmission(
  fixture: Awaited<ReturnType<typeof createLockedFixture>>,
  suffix: string
) {
  await repository.runOccurrenceTransitions(
    new Date("2027-04-05T08:00:00.000Z")
  );
  await repository.lockOccurrenceCommitment({
    userId: fixture.member.userId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    task: `Ship creator review coverage for ${suffix}.`,
    deliverableType: "pull_request",
    now: new Date("2027-04-05T08:05:00.000Z")
  });
  const draft = await repository.saveSubmissionDraft({
    userId: fixture.member.userId,
    podId: fixture.podId,
    occurrenceId: fixture.occurrenceId,
    resultSummary: `Implemented and tested the creator review path for ${suffix}.`,
    artifactUrl: `https://github.com/18Abhinav07/Pods/pull/${suffix}`,
    proofShareMode: "reviewer_only",
    now: new Date("2027-04-05T10:00:00.000Z")
  });
  return repository.submitOccurrenceEvidence({
    userId: fixture.member.userId,
    submissionId: draft.id,
    now: new Date("2027-04-05T11:00:00.000Z")
  });
}

it("allows the Pod creator to approve exactly once", async () => {
  const fixture = await createLockedFixture();
  const submission = await createReviewingSubmission(fixture, "51");
  const creatorQueue = await repository.listPendingReviewsForCreator({
    creatorUserId: fixture.owner.userId,
    podId: fixture.podId
  });
  expect(creatorQueue).toEqual([
    expect.objectContaining({
      submission: expect.objectContaining({
        id: submission.id,
        state: "reviewing"
      }),
      participant: expect.objectContaining({ displayName: "Pods Builder" })
    })
  ]);
  expect(await repository.listPendingReviewsForCreator({
    creatorUserId: fixture.member.userId,
    podId: fixture.podId
  })).toBeNull();

  const approved = await repository.decideSubmissionAsCreator({
    creatorUserId: fixture.owner.userId,
    podId: fixture.podId,
    submissionId: submission.id,
    decision: {
      decision: "approve",
      note: "The artifact completes the locked task."
    },
    now: new Date("2027-04-05T12:01:00.000Z")
  });
  expect(approved).toMatchObject({
    kind: "decided",
    submission: { state: "approved" }
  });

  const repeated = await repository.decideSubmissionAsCreator({
    creatorUserId: fixture.owner.userId,
    podId: fixture.podId,
    submissionId: submission.id,
    decision: {
      decision: "reject",
      reason: "This must not replace the first decision."
    },
    now: new Date("2027-04-05T12:02:00.000Z")
  });
  expect(repeated).toMatchObject({
    kind: "already_decided",
    submission: { state: "approved" }
  });
});
```

Add a separate rejection assertion:

```ts
it("shows a rejection reason only in the owner's decision projection", async () => {
  const fixture = await createLockedFixture();
  const submission = await createReviewingSubmission(fixture, "52");
  await repository.decideSubmissionAsCreator({
    creatorUserId: fixture.owner.userId,
    podId: fixture.podId,
    submissionId: submission.id,
    decision: {
      decision: "reject",
      reason: "The submitted link does not contain the locked deliverable."
    },
    now: new Date("2027-04-05T12:01:00.000Z")
  });
  expect(await repository.getSubmissionForOwner({
    userId: fixture.member.userId,
    submissionId: submission.id
  })).toMatchObject({
    submission: { state: "rejected" },
    reviewDecision: {
      action: "rejected",
      note: "The submitted link does not contain the locked deliverable."
    }
  });
});
```

Add a timeout and streak assertion:

```ts
it("protects an undecided proof at its hard deadline", async () => {
  const fixture = await createLockedFixture();
  const submission = await createReviewingSubmission(fixture, "53");
  expect(await repository.protectTimedOutReviews(
    new Date("2027-04-06T11:00:00.000Z")
  )).toMatchObject({ protectedSubmissions: 1 });
  expect(await repository.getSubmissionForOwner({
    userId: fixture.member.userId,
    submissionId: submission.id
  })).toMatchObject({
    submission: { state: "timeout_protected" },
    reviewDecision: null
  });
  expect(await repository.getActivityStreak({
    membershipId: fixture.membershipId,
    podId: fixture.podId,
    now: new Date("2027-04-06T11:00:01.000Z")
  })).toBe(1);
});
```

- [ ] **Step 2: Run integration tests and verify failure**

Run:

```bash
pnpm services:up
pnpm test:integration -- phase4-activity.integration.test.ts visitor-public-read.integration.test.ts
```

Expected: FAIL because creator repository methods, terminal states, review decisions, and timeout protection are absent.

- [ ] **Step 3: Expand the schema and generate migration 0012**

Use these fields in `packages/db/src/schema.ts`:

```ts
reviewedAt: timestamp("reviewed_at", {
  withTimezone: true,
  mode: "date"
}),
```

```ts
action: text("action").$type<"approved" | "rejected">().notNull(),
reasonCode: text("reason_code")
  .$type<"meets_commitment" | "does_not_meet_commitment">()
  .notNull(),
```

Replace the review-decision unique index with:

```ts
uniqueIndex("review_decisions_submission_unique").on(table.submissionId)
```

Generate the migration:

```bash
pnpm --filter @pods/db db:generate -- --name creator_review_mvp
```

Verify `packages/db/migrations/0012_creator_review_mvp.sql` contains:

```sql
ALTER TABLE "submissions" ADD COLUMN "reviewed_at" timestamp with time zone;
DROP INDEX "review_decisions_submission_action_unique";
CREATE UNIQUE INDEX "review_decisions_submission_unique" ON "review_decisions" USING btree ("submission_id");
```

- [ ] **Step 4: Replace centralized repository methods with creator-scoped methods**

In `packages/db/src/activity-repository.ts`:

1. Make `submitOccurrenceEvidence()` transition directly from `draft` to `reviewing`.
2. Add `listPendingReviewsForCreator({ creatorUserId, podId })`.
3. Add `getReviewSubmissionForCreator({ creatorUserId, podId, submissionId })`.
4. Add `getCreatorSubmissionEvidence({ creatorUserId, podId, submissionId })`.
5. Replace `approveSubmission()` with `decideSubmissionAsCreator()`.
6. Add `protectTimedOutReviews(now)`.
7. Join `reviewDecisions` in `getSubmissionForOwner()`.
8. Count both `approved` and `timeout_protected` in `getActivityStreak()`.

The decision command must use this result contract:

```ts
type CreatorDecisionResult =
  | {
      kind: "decided";
      submission: typeof submissions.$inferSelect;
    }
  | {
      kind: "already_decided";
      submission: typeof submissions.$inferSelect;
    }
  | null;
```

Inside one transaction, lock the submission row joined through its occurrence
and Pod, filtered by `pods.creatorUserId = input.creatorUserId`. Return `null`
when that ownership query finds nothing. Return `already_decided` when its
state is already terminal. For a new decision, insert:

```ts
{
  id: randomUUID(),
  submissionId: submission.id,
  action: input.decision.decision === "approve" ? "approved" : "rejected",
  reviewerId: input.creatorUserId,
  reasonCode:
    input.decision.decision === "approve"
      ? "meets_commitment"
      : "does_not_meet_commitment",
  note:
    input.decision.decision === "approve"
      ? input.decision.note
      : input.decision.reason,
  createdAt: input.now
}
```

Then update only when `submissions.state = "reviewing"`:

```ts
{
  state:
    input.decision.decision === "approve" ? "approved" : "rejected",
  approvedAt: input.decision.decision === "approve" ? input.now : null,
  reviewedAt: input.now,
  updatedAt: input.now
}
```

Append exactly one realtime event with kind `submission.approved` or
`submission.rejected`. Do not copy evidence or the rejection reason into the
event payload.

`protectTimedOutReviews(now)` must lock due reviewing rows, update each to:

```ts
{
  state: "timeout_protected",
  reviewedAt: now,
  updatedAt: now
}
```

and append `submission.timeout_protected` with only `messageId` and
`submissionId`. It must create no `review_decisions` row.

- [ ] **Step 5: Correct public and participant projections**

In `packages/db/src/public-room-repository.ts`, use:

```ts
function publicSubmissionState(state: SubmissionState | null) {
  if (state === "approved") return "approved" as const;
  if (state === "rejected") return "rejected" as const;
  if (state === "timeout_protected") return "timeout_protected" as const;
  if (state === null) return "committed" as const;
  return "under_review" as const;
}
```

Keep the public DTO free of `reviewDecisions.note`, `reviewerId`,
`evidenceObjectKey`, and creator-only media.

In `packages/db/src/inbox-repository.ts`, keep selecting the submission row so
`reviewedAt` and state reach the pure inbox presenter. Do not join decision
notes into the general timeline.

- [ ] **Step 6: Run database tests and typecheck**

Run:

```bash
pnpm --filter @pods/db typecheck
pnpm test:integration -- phase4-activity.integration.test.ts visitor-public-read.integration.test.ts
```

Expected: creator authorization, rejection privacy, one-decision uniqueness,
timeout protection, streaks, and visitor redaction all pass.

- [ ] **Step 7: Commit persistence**

```bash
git add packages/domain packages/db
git commit -m "feat: persist creator proof decisions"
```

## Task 3: Run Review Timeout Protection in the Worker

**Files:**
- Create: `apps/worker/src/activity/run-review-timeout-cycle.ts`
- Modify: `apps/worker/src/index.ts`
- Create: `apps/worker/tests/run-review-timeout-cycle.test.ts`
- Modify: `apps/worker/tests/worker-configuration.test.ts`

- [ ] **Step 1: Write the failing timeout-cycle test**

Create `apps/worker/tests/run-review-timeout-cycle.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { runReviewTimeoutCycle } from "../src/activity/run-review-timeout-cycle";

describe("runReviewTimeoutCycle", () => {
  it("protects due reviews using audited effective time", async () => {
    const effectiveNow = new Date("2027-04-06T11:00:00.000Z");
    const realNow = new Date("2026-07-23T12:00:00.000Z");
    const repository = {
      getEffectiveTime: vi.fn(async () => effectiveNow),
      protectTimedOutReviews: vi.fn(async () => ({ protectedSubmissions: 2 }))
    };

    await expect(runReviewTimeoutCycle({
      repository,
      realNow: () => realNow
    })).resolves.toEqual({ protectedSubmissions: 2 });
    expect(repository.getEffectiveTime).toHaveBeenCalledWith(realNow);
    expect(repository.protectTimedOutReviews).toHaveBeenCalledWith(effectiveNow);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm --filter @pods/worker test -- run-review-timeout-cycle.test.ts
```

Expected: FAIL because `runReviewTimeoutCycle` does not exist.

- [ ] **Step 3: Add the worker cycle**

Create `apps/worker/src/activity/run-review-timeout-cycle.ts`:

```ts
import type { PodsRepository } from "@pods/db";

type ReviewTimeoutRepository = Pick<
  PodsRepository,
  "getEffectiveTime" | "protectTimedOutReviews"
>;

export async function runReviewTimeoutCycle(input: {
  repository: ReviewTimeoutRepository;
  realNow?: () => Date;
}) {
  const realNow = (input.realNow ?? (() => new Date()))();
  const effectiveNow = await input.repository.getEffectiveTime(realNow);
  return input.repository.protectTimedOutReviews(effectiveNow);
}
```

Import and call it after `runOccurrenceCycle()` in `apps/worker/src/index.ts`.
Use the existing `cycleFailed` handling:

```ts
try {
  await runReviewTimeoutCycle({ repository });
} catch (error) {
  cycleFailed = true;
  console.error(
    `[review-timeout-cycle] ${
      error instanceof Error ? error.message : "Cycle failed"
    }`
  );
}
```

- [ ] **Step 4: Run worker tests, typecheck, and build**

Run:

```bash
pnpm --filter @pods/worker test
pnpm --filter @pods/worker typecheck
pnpm --filter @pods/worker build
```

Expected: all worker tests pass and the production import succeeds.

- [ ] **Step 5: Commit worker protection**

```bash
git add apps/worker
git commit -m "feat: protect inactive creator reviews"
```

## Task 4: Add Creator-Scoped APIs and Remove the Old Review Authority

**Files:**
- Create: `apps/web/src/app/api/pods/[podId]/admin/reviews/route.ts`
- Create: `apps/web/src/app/api/pods/[podId]/admin/reviews/[submissionId]/evidence/route.ts`
- Create: `apps/web/src/app/api/pods/[podId]/admin/reviews/[submissionId]/decision/route.ts`
- Create: `apps/web/tests/creator-review-route.test.ts`
- Create: `apps/web/tests/creator-review-evidence-route.test.ts`
- Delete: `apps/web/src/app/api/ops/reviews/[submissionId]/approve/route.ts`
- Delete: `apps/web/src/app/api/ops/reviews/[submissionId]/evidence/route.ts`

- [ ] **Step 1: Write route authorization and decision tests**

In `apps/web/tests/creator-review-route.test.ts`, mock
`getCurrentSession`, `listPendingReviewsForCreator`, and
`decideSubmissionAsCreator` with this complete route harness:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.hoisted(() => vi.fn());
const listPendingReviewsForCreator = vi.hoisted(() => vi.fn());
const decideSubmissionAsCreator = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/session", () => ({ getCurrentSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listPendingReviewsForCreator,
    decideSubmissionAsCreator
  }
}));

import { GET as GET_QUEUE } from "../src/app/api/pods/[podId]/admin/reviews/route";
import { POST as POST_DECISION } from "../src/app/api/pods/[podId]/admin/reviews/[submissionId]/decision/route";

const queueContext = { params: Promise.resolve({ podId: "pod-1" }) };
const decisionContext = {
  params: Promise.resolve({
    podId: "pod-1",
    submissionId: "submission-1"
  })
};

describe("creator review routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a wallet session", async () => {
    getCurrentSession.mockResolvedValue(null);
    expect((await GET_QUEUE(
      new Request("http://localhost/api/pods/pod-1/admin/reviews"),
      queueContext
    )).status).toBe(401);
  });

  it("returns a safe 404 outside creator ownership", async () => {
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
    listPendingReviewsForCreator.mockResolvedValue(null);
    expect((await GET_QUEUE(
      new Request("http://localhost/api/pods/pod-1/admin/reviews"),
      queueContext
    )).status).toBe(404);
  });

  it("validates and records one rejection", async () => {
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
    decideSubmissionAsCreator.mockResolvedValue({
      kind: "decided",
      submission: { id: "submission-1", state: "rejected" }
    });
    const response = await POST_DECISION(new Request(
      "http://localhost/api/pods/pod-1/admin/reviews/submission-1/decision",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: "reject",
          reason: "The link does not contain the locked deliverable."
        })
      }
    ), decisionContext);
    expect(response.status).toBe(200);
    expect(decideSubmissionAsCreator).toHaveBeenCalledWith({
      creatorUserId: "creator-1",
      podId: "pod-1",
      submissionId: "submission-1",
      decision: {
        decision: "reject",
        reason: "The link does not contain the locked deliverable."
      },
      now: expect.any(Date)
    });
  });

  it("returns a stable conflict for a final proof", async () => {
    getCurrentSession.mockResolvedValue({ userId: "creator-1" });
    decideSubmissionAsCreator.mockResolvedValue({
      kind: "already_decided",
      submission: { id: "submission-1", state: "approved" }
    });
    const response = await POST_DECISION(new Request(
      "http://localhost/api/pods/pod-1/admin/reviews/submission-1/decision",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve" })
      }
    ), decisionContext);
    expect(response.status).toBe(409);
  });
});
```

Add separate cases using the same harness for an invalid short rejection
(`400`) and a `null` repository result (`404`).

In `apps/web/tests/creator-review-evidence-route.test.ts`, assert a creator can
read only the metadata returned by `getCreatorSubmissionEvidence()`, while
`null` returns:

```ts
expect(response.status).toBe(404);
await expect(response.json()).resolves.toEqual({
  error: "Evidence image not found"
});
expect(readImage).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run route tests and verify failure**

Run:

```bash
pnpm --filter @pods/web test -- creator-review-route.test.ts creator-review-evidence-route.test.ts
```

Expected: FAIL because the creator review routes do not exist.

- [ ] **Step 3: Implement the queue and decision routes**

The queue route must:

```ts
const session = await getCurrentSession();
if (!session) {
  return NextResponse.json({ error: "Wallet session required" }, { status: 401 });
}
const { podId } = await params;
const reviews = await podsRepository.listPendingReviewsForCreator({
  creatorUserId: session.userId,
  podId
});
if (!reviews) {
  return NextResponse.json({ error: "Pod not found" }, { status: 404 });
}
return NextResponse.json({ reviews });
```

The decision route must validate with `validateCreatorReviewDecision()`, derive
the creator from the session, and map repository results:

```ts
if (!result) {
  return NextResponse.json({ error: "Submission not found" }, { status: 404 });
}
if (result.kind === "already_decided") {
  return NextResponse.json(
    { error: "This proof already has a final result", submission: result.submission },
    { status: 409 }
  );
}
return NextResponse.json({ submission: result.submission });
```

The evidence route must call `getCreatorSubmissionEvidence()` before reading
the private object and must return `Cache-Control: private, no-store` and
`Content-Security-Policy: default-src 'none'`.

- [ ] **Step 4: Delete centralized mutation routes**

Delete both `/api/ops/reviews` files. There must be no callable route that
passes an environment reviewer ID to the repository.

- [ ] **Step 5: Run route tests and web typecheck**

Run:

```bash
pnpm --filter @pods/web test -- creator-review-route.test.ts creator-review-evidence-route.test.ts
pnpm --filter @pods/web typecheck
```

Expected: all focused route tests pass and no deleted operation import remains.

- [ ] **Step 6: Commit creator APIs**

```bash
git add apps/web/src/app/api apps/web/tests/creator-review-route.test.ts apps/web/tests/creator-review-evidence-route.test.ts
git commit -m "feat: authorize creator proof review routes"
```

## Task 5: Build the Creator Review Queue and Workspace

**Files:**
- Create: `apps/web/src/app/pods/[podId]/admin/reviews/page.tsx`
- Create: `apps/web/src/app/pods/[podId]/admin/reviews/[submissionId]/page.tsx`
- Create: `apps/web/src/components/creator-review-form.tsx`
- Modify: `apps/web/src/app/pods/[podId]/admin/page.tsx`
- Modify: `apps/web/src/app/today/page.tsx`
- Modify: `apps/web/src/lib/today-priority.ts`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/tests/creator-review-page.test.tsx`
- Modify: `apps/web/tests/creator-admin-state.test.tsx`
- Modify: `apps/web/tests/today-page.test.tsx`
- Modify: `apps/web/tests/today-priority.test.ts`

- [ ] **Step 1: Write failing creator UI tests**

The review workspace test must assert:

```ts
expect(screen.getByText("Ryuk")).toBeVisible();
expect(screen.getByText("@ryuk")).toBeVisible();
expect(screen.getByText("Ship the creator review workspace.")).toBeVisible();
expect(screen.getByRole("link", { name: "Open public artifact" })).toBeVisible();
expect(screen.getByRole("img", { name: "Creator-only evidence from Ryuk" }))
  .toHaveAttribute(
    "src",
    "/api/pods/pod-1/admin/reviews/submission-1/evidence"
  );
expect(screen.getByRole("button", { name: "Approve proof" })).toBeVisible();
expect(screen.getByRole("button", { name: "Reject proof" })).toBeVisible();
```

The admin test must assert an active Pod with two pending proofs shows:

```ts
expect(screen.getByRole("link", { name: "Review 2 proofs" }))
  .toHaveAttribute("href", "/pods/pod-1/admin/reviews");
```

The Today priority test must prove `creator_review` wins over creator funding
and recruiting, but not over a member's active funding or due proof:

```ts
expect(chooseTodayEnrollmentAction({
  activities: [],
  participants: [],
  creatorReviewPodId: "pod-review",
  reviewPodId: null,
  creatorFundingPodId: "pod-funding",
  recruitPodId: "pod-recruit"
})).toEqual({ kind: "creator_review", podId: "pod-review" });
```

- [ ] **Step 2: Run focused page tests and verify failure**

Run:

```bash
pnpm --filter @pods/web test -- creator-review-page.test.tsx creator-admin-state.test.tsx today-page.test.tsx today-priority.test.ts
```

Expected: FAIL because the routes, form, and creator-review priority are absent.

- [ ] **Step 3: Build the server-rendered queue and workspace**

Both pages must call `requireSession()` and then a creator-scoped repository
method. Call `notFound()` on `null`.

Each queue row must link to:

```ts
`/pods/${podId}/admin/reviews/${submission.id}`
```

and show participant avatar, display name, handle, occurrence number, submitted
time, and target status. The queue empty state must say:

```text
No proofs are waiting.
New member proofs will appear here automatically.
```

The detail page must use
`/api/pods/${podId}/admin/reviews/${submission.id}/evidence` for creator-only
media. Do not use raw object keys in the page props or DOM.

- [ ] **Step 4: Build the approve and reject form**

`apps/web/src/components/creator-review-form.tsx` must:

- show one primary `Approve proof` action;
- reveal the rejection reason field only after `Reject proof`;
- require 12 to 500 characters for rejection;
- disable both paths while saving;
- show `Decision saved` before routing back to the queue;
- map HTTP 409 to `This proof already has a final result`;
- call `router.refresh()` after success;
- never send a creator ID or reviewer authority flag.

The request body must be exactly one of:

```ts
{ decision: "approve", note: approvalNote }
```

```ts
{ decision: "reject", reason: rejectionReason }
```

- [ ] **Step 5: Add the creator command-center and Today actions**

For active or final-review Pods, keep the creator command center available
instead of collapsing it to a room-only screen. Query
`listPendingReviewsForCreator()` and render `Review proofs`.

Extend `TodayEnrollmentAction` with:

```ts
| { kind: "creator_review"; podId: string }
```

Use this Today copy:

```ts
{
  eyebrow: "Proofs waiting",
  title: "Members are waiting for your review.",
  detail: "Compare each proof with its locked commitment and record one final result.",
  cta: "Review proofs",
  href: `/pods/${action.podId}/admin/reviews`
}
```

- [ ] **Step 6: Add compact mobile styling**

Use existing Pods tokens in `apps/web/src/app/globals.css`. The review route
must remain a single-column mobile surface, keep actions at least 44 pixels
high, avoid horizontal overflow at 390 pixels, and use existing
`ProfileAvatar`, `phase-pill`, `primary-action`, and `secondary-action`
primitives. Do not introduce another theme, card system, font, or navigation
bar.

- [ ] **Step 7: Run focused UI tests**

Run:

```bash
pnpm --filter @pods/web test -- creator-review-page.test.tsx creator-admin-state.test.tsx today-page.test.tsx today-priority.test.ts
```

Expected: all creator queue, workspace, admin, and Today tests pass.

- [ ] **Step 8: Commit creator UI**

```bash
git add apps/web/src/app/pods apps/web/src/app/today apps/web/src/components/creator-review-form.tsx apps/web/src/lib/today-priority.ts apps/web/src/app/globals.css apps/web/tests
git commit -m "feat: add creator proof review workspace"
```

## Task 6: Unify Participant, Room, Visitor, and Operations Projections

**Files:**
- Modify: `apps/web/src/components/activity-occurrence.tsx`
- Modify: `apps/web/src/app/pods/[podId]/submissions/[submissionId]/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/activity/page.tsx`
- Modify: `apps/web/src/lib/room-activity-presentation.ts`
- Modify: `apps/web/src/lib/inbox-events.ts`
- Modify: `apps/web/src/components/public-visitor-room.tsx`
- Modify: all user-facing review-disclosure files listed in File Structure.
- Delete: `apps/web/src/app/ops/reviews/page.tsx`
- Delete: `apps/web/src/app/ops/reviews/[submissionId]/page.tsx`
- Delete: `apps/web/src/components/review-approval-form.tsx`
- Modify: `apps/web/src/app/ops/connect/page.tsx`
- Modify: `apps/web/src/app/api/ops/session/route.ts`
- Modify: `apps/web/src/app/ops/public-safety/page.tsx`
- Modify: affected tests in `apps/web/tests`.

- [ ] **Step 1: Write failing terminal-projection tests**

Add these state assertions:

```ts
const now = new Date("2027-04-05T12:00:00.000Z");
const rowWithSubmission = (state: string) => ({
  occurrence: {
    id: "occurrence-1",
    ordinal: 1,
    opensAt: new Date("2027-04-05T00:00:00.000Z"),
    closesAt: new Date("2027-04-06T00:00:00.000Z")
  },
  commitment: { id: "commitment-1" },
  submission: { state }
});

expect(presentRoomActivitySchedule({
  podId: "pod-1",
  now,
  rows: [rowWithSubmission("rejected")]
})).toMatchObject({
  mode: "view",
  label: "View submission",
  stateLabel: "Not verified"
});

expect(presentRoomActivitySchedule({
  podId: "pod-1",
  now,
  rows: [rowWithSubmission("timeout_protected")]
})).toMatchObject({
  mode: "view",
  label: "View submission",
  stateLabel: "Protected after timeout"
});
```

The participant detail tests must assert:

```ts
expect(screen.getByText("Not verified")).toBeVisible();
expect(screen.getByText("The link does not contain the locked deliverable."))
  .toBeVisible();
expect(screen.queryByRole("button", { name: /appeal/i })).not.toBeInTheDocument();
```

and:

```ts
expect(screen.getByText("Protected after review timeout")).toBeVisible();
expect(screen.getByText(/counts toward your progress and streak/i)).toBeVisible();
```

The public visitor test must assert the state is visible while the private
reason is absent.

- [ ] **Step 2: Run projection tests and verify failure**

Run:

```bash
pnpm --filter @pods/web test -- room-activity-presentation.test.ts participant-submission-page.test.tsx public-visitor-room.test.tsx activity-occurrence.test.tsx
```

Expected: FAIL because rejected and timeout-protected states are incomplete.

- [ ] **Step 3: Render all participant terminal states**

Use this participant state model consistently:

| State | Heading | Supporting copy |
|---|---|---|
| `reviewing` | `Creator review in progress` | `The Pod creator is checking your proof against the locked commitment.` |
| `approved` | `Work approved` | `The Pod creator approved this proof. It counts toward your progress and streak.` |
| `rejected` | `Not verified` | Show the private review-decision note and no appeal control. |
| `timeout_protected` | `Protected after review timeout` | `The creator did not decide within 24 hours. This occurrence counts toward your progress and streak.` |

Keep `reviewDecision.note` visible only to the submission owner and creator.
Room members and visitors receive status only.

- [ ] **Step 4: Replace centralized-review copy**

Replace review-specific wording with:

```text
Creator review
Creator only
Your proof is with the Pod creator
The Pod creator approved
The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.
```

Run:

```bash
rg -n "Pods team review|Pods reviewer only|Pods team reviews evidence|not peer-voted or creator-controlled" apps/web/src
```

Expected: no matches.

- [ ] **Step 5: Remove proof review from operations**

Delete the review pages and form. Change the ops connection default return path
to `/ops/public-safety`. Remove the `Reviews` navigation item from public safety.
Do not change report moderation, suppressions, or public visitor safety.

- [ ] **Step 6: Run web tests, copy lint, and typecheck**

Run:

```bash
pnpm --filter @pods/web test
pnpm lint:copy
pnpm --filter @pods/web typecheck
```

Expected: all web tests pass, no U+2014 characters are present, and no deleted
ops-review import remains.

- [ ] **Step 7: Commit unified projections**

```bash
git add apps/web
git commit -m "feat: project creator review across Pods"
```

## Task 7: Prove the Complete Two-Wallet Flow Before Deployment

**Files:**
- Modify: `apps/web/tests/e2e/phase4-activity.spec.ts`
- Modify: `HANDOFF.md`
- Modify: `docs/superpowers/plans/2026-07-23-pods-creator-review-mvp.md`

- [ ] **Step 1: Replace the operations E2E actor with the creator wallet**

Update `apps/web/tests/e2e/phase4-activity.spec.ts` so the creator:

1. opens `/pods/:podId/admin/reviews`;
2. opens the member submission;
3. approves one proof;
4. rejects a second proof with a 12-character-or-longer reason;
5. confirms both member-facing results;
6. confirms another member and a visitor cannot read creator-only evidence or
   the rejection reason.

Remove the ops access token, `/ops/reviews`, and `pods_team` fixture values.

- [ ] **Step 2: Run the complete repository gate**

Run:

```bash
pnpm check
```

Expected:

- lint and copy checks pass;
- all domain, database, web, and worker unit tests pass;
- all integration tests pass;
- all packages typecheck;
- production web and worker builds pass.

- [ ] **Step 3: Start the LAN web and worker**

Run in separate terminals:

```bash
pnpm dev:lan
```

```bash
pnpm dev:worker
```

Expected:

- web is reachable at `http://<LAN-IP>:3411`;
- worker readiness is healthy;
- no review, funding, cutoff, or realtime cycle errors appear.

- [ ] **Step 4: Run the physical Nimiq Pay gate**

Using two Testnet wallets:

1. Creator publishes a public visitor-enabled Build & Ship Pod.
2. Member applies.
3. Creator accepts.
4. Member funds and reaches roster lock.
5. Advance only through the audited Clock command until the occurrence opens.
6. Member locks a task and submits a public artifact plus `Creator only`
   evidence.
7. Creator sees the pending count in Today and Creator controls.
8. Creator opens the evidence and approves.
9. Member sees approved state in Today, room, proof history, Updates, and detail.
10. Submit another proof in a disposable Pod or occurrence.
11. Creator rejects it with a private reason.
12. Member sees the reason; another member and a visitor do not.
13. Advance the audited Clock past a third proof's hard deadline.
14. Confirm it becomes timeout-protected and the creator can no longer decide it.
15. Confirm the creator was never asked to fund and has no financial entitlement.

Do not deploy until this gate receives explicit user approval.

- [ ] **Step 5: Record the approved local result**

Update `HANDOFF.md` with:

- exact local commit;
- automated test counts;
- physical wallet actions that passed;
- any device-only issue still open;
- exact next action: push and deploy.

Mark this plan `status: locally-approved`.

- [ ] **Step 6: Commit the release gate**

```bash
git add apps/web/tests/e2e/phase4-activity.spec.ts HANDOFF.md docs/superpowers/plans/2026-07-23-pods-creator-review-mvp.md
git commit -m "test: verify creator review mvp flow"
```

- [ ] **Step 7: Push and deploy only after approval**

Push the approved branch and main:

```bash
git push origin phase/04a-social-alpha-foundation
git push origin phase/04a-social-alpha-foundation:main
```

Deploy the web and worker from the approved commit, run migrations, and verify:

```text
GET /api/health/ready -> 200 and ready
worker deployment -> SUCCESS
web deployment -> SUCCESS
```

Repeat one approval and one rejection against the deployed database before
publishing the build update.

- [ ] **Step 8: Prepare the build-in-public update**

Use this two-line post after deployed verification:

```text
Proof review is now owned by each Pod creator. Members submit against a locked commitment, creators approve or reject from the Pod, and inactive reviews are protected automatically after 24 hours.

Today we tested the full Nimiq Pay flow with real Testnet wallets, including creator-only evidence and public proof privacy.
```

Recommended screenshot: the creator review workspace with participant identity,
locked task, public artifact, and Approve/Reject controls visible. Do not show a
wallet address, private image content, rejection reason, or treasury data.

## Final Acceptance Checklist

- [ ] Creator is not a member by default.
- [ ] Creator is never asked to deposit.
- [ ] Creator has no refund, bonus, forfeiture, or payout entitlement.
- [ ] Only the connected Pod creator can list, open, or decide that Pod's proofs.
- [ ] Participant, applicant, unrelated creator, and visitor receive safe denial.
- [ ] Approval, rejection, and timeout protection are terminal and immutable.
- [ ] One submission can create at most one manual review-decision row.
- [ ] A creator decision and worker timeout race can produce only one terminal state.
- [ ] Rejection reason is visible only to creator and submission owner.
- [ ] Creator-only evidence is never exposed in room, visitor, realtime, or public-profile DTOs.
- [ ] Timeout protection counts for progress and streaks without claiming creator approval.
- [ ] Room cards update in place and are not duplicated.
- [ ] Today, proof history, Updates, room, and participant detail agree.
- [ ] No normal proof mutation remains under `/ops/reviews`.
- [ ] Public safety moderation remains operational.
- [ ] Funding, cutoff, refunds, visitors, chat, profiles, and social tests remain green.
- [ ] No U+2014 character appears in product copy.
- [ ] LAN phone approval occurs before push or deployment.
