---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [implementation-plan, phase-2, enrollment, applications, invitations]
status: approved-for-execution
---

# Phase 2 Public and Private Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete pre-funding enrollment lifecycle for public application Pods and private invitation Pods, with exact creator authority, privacy boundaries, durable states, and a physical-device checkpoint.

**Architecture:** Extend the shared domain with explicit enrollment state contracts, then add Postgres-backed applications, memberships, and hashed single-use invitations. Server-rendered public and authenticated routes consume purpose-built repository DTOs so private Pod data never reaches a public response. Phase 2 stops at a guarded funding handoff and does not create a deposit intent or move NIM.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Postgres, Drizzle ORM, Vitest, Playwright, Motion, existing signed Nimiq wallet sessions.

Related: [[HANDOFF]] | [[validation/phase-2-spike-results|Phase 2 spike]] | [[10-Projects/Web3-Builds/Hackathons/Pods/docs/superpowers/specs/2026-07-19-pods-cycle-i-mvp-design|Product specification]]

---

## Phone acceptance flow

```text
Public:
creator publishes public Pod
-> second wallet discovers it without authentication
-> second wallet reads the full public-safe contract
-> connects and submits the frozen application questions
-> creator reviews and accepts
-> applicant sees Accepted, funding required
-> guarded funding handoff opens without creating a deposit

Private:
creator publishes private Pod
-> creator generates one opaque expiring invitation
-> second wallet opens the invitation without private-data leakage
-> connects, accepts the frozen contract, and receives accepted_unfunded membership
-> invitation replay shows the same generic unavailable state
-> private Pod remains absent from Discover and direct public Pod routes return 404
```

## File structure

- `packages/domain/src/enrollment.ts`: enrollment types, input normalization, state transitions, and public-safe DTO types.
- `packages/domain/tests/enrollment.test.ts`: domain transition and input boundary tests.
- `packages/db/src/schema.ts`: applications, invitations, memberships, indexes, and Pod cancellation state storage.
- `packages/db/src/enrollment-repository.ts`: all enrollment reads and atomic public/private transitions.
- `packages/db/src/repository.ts`: composes enrollment methods into the existing repository without duplicating pools.
- `packages/db/tests/phase2-enrollment.integration.test.ts`: live Postgres ownership, privacy, concurrency, and transition proof.
- `apps/web/src/lib/enrollment-client.ts`: typed application, decision, invitation, acceptance, and cancellation requests.
- `apps/web/src/lib/enrollment-guards.ts`: exact creator, public Pod, accepted membership, and invitation preview guards.
- `apps/web/src/components/public-pod-card.tsx`: semantic discovery result card.
- `apps/web/src/components/application-form.tsx`: exact frozen-question application form.
- `apps/web/src/components/application-decision-list.tsx`: creator review and decision surface.
- `apps/web/src/components/invitation-manager.tsx`: one-time token reveal, copy, revoke, and replacement flow.
- `apps/web/src/components/invitation-acceptance.tsx`: connected-wallet frozen-contract acceptance.
- `apps/web/src/app/discover/page.tsx`: public discovery with template and upcoming filters.
- `apps/web/src/app/pods/[podId]/page.tsx`: public-safe Pod preview only.
- `apps/web/src/app/pods/[podId]/apply/page.tsx`: authenticated public application.
- `apps/web/src/app/applications/page.tsx`: applicant status history and funding handoff.
- `apps/web/src/app/invite/[token]/page.tsx`: minimal valid preview or generic unavailable state.
- `apps/web/src/app/pods/[podId]/admin/page.tsx`: creator enrollment command center.
- `apps/web/src/app/pods/[podId]/admin/applications/page.tsx`: creator application review.
- `apps/web/src/app/pods/[podId]/fund/page.tsx`: accepted-member Phase 3 boundary, with no payment action.
- `apps/web/src/app/api/pods/[podId]/applications/route.ts`: create public application.
- `apps/web/src/app/api/pods/[podId]/applications/[applicationId]/route.ts`: creator accept or reject.
- `apps/web/src/app/api/pods/[podId]/invitations/route.ts`: create and list private invitations.
- `apps/web/src/app/api/pods/[podId]/invitations/[invitationId]/route.ts`: creator revoke.
- `apps/web/src/app/api/pods/[podId]/cancel/route.ts`: cancel enrollment before funding exists.
- `apps/web/src/app/api/invitations/[token]/accept/route.ts`: atomic private acceptance.
- `apps/web/tests/e2e/phase2-enrollment.spec.ts`: two-wallet public flow and private isolation flow.

### Task 1: Enrollment domain contract

**Files:**
- Create: `packages/domain/src/enrollment.ts`
- Create: `packages/domain/tests/enrollment.test.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Write failing tests for normalized answers and legal transitions**

```ts
expect(validateApplicationAnswers(["  I will ship auth  "], 1)).toEqual({
  success: true,
  value: ["I will ship auth"]
});
expect(validateApplicationAnswers([""], 1).success).toBe(false);
expect(canDecideApplication("applied", "accepted_unfunded")).toBe(true);
expect(canDecideApplication("application_rejected", "accepted_unfunded")).toBe(false);
expect(normalizeInvitationToken(" readable pod id ")).toBeNull();
```

- [ ] **Step 2: Run the domain test and verify RED**

Run: `pnpm --filter @pods/domain exec vitest run tests/enrollment.test.ts`

Expected: FAIL because the enrollment module and exports do not exist.

- [ ] **Step 3: Implement explicit types and validation**

```ts
export type ApplicationStatus = "applied" | "accepted_unfunded" | "application_rejected" | "application_expired";
export type MembershipState = ApplicationStatus | "invite_expired";
export type AdmissionSource = "public_application" | "private_invitation";

export function validateApplicationAnswers(answers: unknown, expected: number) {
  if (!Array.isArray(answers) || answers.length !== expected) {
    return { success: false as const, errors: ["Answer every application question"] };
  }
  const value = answers.map((answer) => typeof answer === "string" ? answer.trim() : "");
  if (value.some((answer) => answer.length < 2 || answer.length > 500)) {
    return { success: false as const, errors: ["Each answer must contain 2 to 500 characters"] };
  }
  return { success: true as const, value };
}
```

Invitation tokens are exactly 43 base64url characters produced from 32 random bytes. Public DTOs contain no wallet address, raw invitation hash, private evidence, or member data.

- [ ] **Step 4: Run the domain suite and verify GREEN**

Run: `pnpm --filter @pods/domain test`

Expected: all domain tests PASS.

- [ ] **Step 5: Commit the domain contract**

```bash
git add packages/domain/src/enrollment.ts packages/domain/src/index.ts packages/domain/tests/enrollment.test.ts
git commit -m "feat: define enrollment contracts"
```

### Task 2: Enrollment persistence and atomic transitions

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/src/enrollment-repository.ts`
- Modify: `packages/db/src/repository.ts`
- Create: `packages/db/tests/phase2-enrollment.integration.test.ts`
- Create: generated migration under `packages/db/migrations/`

- [ ] **Step 1: Write the failing Postgres integration tests**

Tests must prove:

```ts
const application = await repository.applyToPublicPod({ podId, applicantUserId, answers, now });
expect(application.state).toBe("applied");
await expect(repository.applyToPublicPod({ podId: privatePodId, applicantUserId, answers: [], now }))
  .rejects.toThrow("Public Pod not available");
expect(await repository.decideApplication({ podId, applicationId: application.id, creatorUserId: strangerId, decision: "accept", now }))
  .toBeNull();
expect((await repository.decideApplication({ podId, applicationId: application.id, creatorUserId, decision: "accept", now }))?.membership.state)
  .toBe("accepted_unfunded");
```

Private tests create one raw token, persist only its SHA-256 hash, race two accept calls, assert one accepted membership, assert zero replay winners, reject revoked and expired tokens, and prove private Pods never appear in `listPublicPods` or `getPublicPod`.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase2-enrollment.integration.test.ts`

Expected: FAIL because tables and repository methods do not exist.

- [ ] **Step 3: Add the schema**

```ts
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey(),
  podId: uuid("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  applicantUserId: uuid("applicant_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<Array<{ question: string; answer: string }>>().notNull(),
  state: text("state").$type<ApplicationStatus>().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
}, (table) => [uniqueIndex("applications_pod_applicant_unique").on(table.podId, table.applicantUserId)]);
```

Add `invitations` with a unique `tokenHash`, expiry, revocation, and use fields. Add `memberships` with unique `(podId, userId)`, admission source, application/invitation references, and explicit state. Do not store raw tokens.

- [ ] **Step 4: Generate and inspect the migration**

Run: `pnpm --filter @pods/db db:generate`

Expected: one migration containing only Phase 2 tables, indexes, foreign keys, and the Pod state-compatible changes.

- [ ] **Step 5: Implement repository methods with transaction guards**

Public application and creator decision lock the relevant Pod/application rows. Invitation acceptance performs the validated conditional token update and membership insert in one transaction. `getPublicPod` and `listPublicPods` require `state = enrollment_open` and frozen `community.visibility = public`. Enrollment closes when the first occurrence opens.

- [ ] **Step 6: Run migration, integration, and type gates**

Run: `pnpm --filter @pods/db db:migrate && pnpm test:integration && pnpm --filter @pods/db typecheck`

Expected: all integration tests PASS.

- [ ] **Step 7: Commit persistence**

```bash
git add packages/db packages/domain/src/enrollment.ts
git commit -m "feat: persist enrollment lifecycle"
```

### Task 3: Public discovery and public-safe preview

**Files:**
- Create: `apps/web/src/components/public-pod-card.tsx`
- Modify: `apps/web/src/app/discover/page.tsx`
- Create: `apps/web/src/app/pods/[podId]/page.tsx`
- Create: `apps/web/tests/public-pods.test.tsx`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 1: Write failing component and browser tests**

Tests assert that discovery shows only public enrollment-open Pods, filters by template, displays exact NIM commitment and upcoming start, and renders no wallet address. Direct public access to a private or unknown Pod must produce the same 404 surface.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --filter @pods/web exec vitest run tests/public-pods.test.tsx`

Expected: FAIL because the public card does not exist and Discover is still a Phase 1 placeholder.

- [ ] **Step 3: Implement server-rendered discovery**

`/discover?template=build` validates the filter against the five fixed template IDs. Each result shows template symbol, name, purpose, schedule, total NIM commitment, participant range, and `Apply to join`. Empty results provide `Clear filters` and `Create a Pod` actions.

- [ ] **Step 4: Implement the public preview**

The preview renders the frozen public-safe contract and states: `Applying does not reserve a place. A place is secured only after acceptance, funding finality, and roster lock.` It never returns private Pod data.

- [ ] **Step 5: Run focused tests and commit**

Run: `pnpm --filter @pods/web test && pnpm --filter @pods/web typecheck`

```bash
git add apps/web/src/app/discover apps/web/src/app/pods/[podId]/page.tsx apps/web/src/components/public-pod-card.tsx apps/web/tests
git commit -m "feat: add public Pod discovery"
```

### Task 4: Public application and participant status

**Files:**
- Create: `apps/web/src/lib/enrollment-client.ts`
- Create: `apps/web/src/components/application-form.tsx`
- Create: `apps/web/src/app/pods/[podId]/apply/page.tsx`
- Create: `apps/web/src/app/applications/page.tsx`
- Create: `apps/web/src/app/api/pods/[podId]/applications/route.ts`
- Create: `apps/web/tests/enrollment-client.test.ts`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 1: Write failing API-client and browser tests**

Tests cover every frozen question, duplicate application rejection, private/closed Pod rejection, safe return through wallet connect, pending status, and the exact no-reservation disclosure.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --filter @pods/web exec vitest run tests/enrollment-client.test.ts`

Expected: FAIL because the application client does not exist.

- [ ] **Step 3: Implement the owner-independent application path**

The API derives the applicant from the signed session, loads questions from the frozen contract, validates one answer per question, snapshots question text with the answers, and creates one `applied` membership. Client payloads cannot select state, applicant, creator, or required question count.

- [ ] **Step 4: Implement `/applications`**

Show pending, accepted awaiting funding, rejected, and expired with the canonical state language. Accepted applications link to the guarded funding handoff. Pending applications show that a decision does not reserve capacity.

- [ ] **Step 5: Run focused tests and commit**

```bash
pnpm --filter @pods/web test
git add apps/web/src/lib/enrollment-client.ts apps/web/src/components/application-form.tsx apps/web/src/app/applications apps/web/src/app/pods/[podId]/apply apps/web/src/app/api/pods/[podId]/applications apps/web/tests
git commit -m "feat: add public Pod applications"
```

### Task 5: Creator enrollment administration

**Files:**
- Create: `apps/web/src/lib/enrollment-guards.ts`
- Create: `apps/web/src/components/application-decision-list.tsx`
- Create: `apps/web/src/app/pods/[podId]/admin/page.tsx`
- Create: `apps/web/src/app/pods/[podId]/admin/applications/page.tsx`
- Create: `apps/web/src/app/api/pods/[podId]/applications/[applicationId]/route.ts`
- Create: `apps/web/src/app/api/pods/[podId]/cancel/route.ts`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 1: Write failing ownership and transition tests**

Tests prove a non-owner receives 404, only `applied` can transition, decisions are idempotent by terminal state, accepted membership becomes `accepted_unfunded`, rejected membership becomes `application_rejected`, and cancellation removes the Pod from discovery without deleting its frozen contract.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase2-enrollment.integration.test.ts`

- [ ] **Step 3: Implement the creator command center**

Public Pods show pending, accepted, rejected, and total counts plus links to application review. An empty pending queue shows a share prompt and enrollment cutoff. Decisions display applicant responses but never wallet addresses.

- [ ] **Step 4: Implement cancellation before funding**

The UI requires explicit confirmation. The API updates only owner-owned `enrollment_open` Pods. The state becomes `cancelled`; frozen contract data and application history remain. Phase 3 will extend this command with deposit refund queuing before any funding path is enabled.

- [ ] **Step 5: Run focused tests and commit**

```bash
pnpm test:integration && pnpm --filter @pods/web test
git add packages/domain packages/db apps/web/src/lib/enrollment-guards.ts apps/web/src/components/application-decision-list.tsx apps/web/src/app/pods/[podId]/admin apps/web/src/app/api/pods/[podId] apps/web/tests
git commit -m "feat: add creator enrollment controls"
```

### Task 6: Private invitation lifecycle

**Files:**
- Create: `apps/web/src/components/invitation-manager.tsx`
- Create: `apps/web/src/components/invitation-acceptance.tsx`
- Create: `apps/web/src/app/invite/[token]/page.tsx`
- Create: `apps/web/src/app/api/pods/[podId]/invitations/route.ts`
- Create: `apps/web/src/app/api/pods/[podId]/invitations/[invitationId]/route.ts`
- Create: `apps/web/src/app/api/invitations/[token]/accept/route.ts`
- Modify: `apps/web/src/app/pods/[podId]/admin/page.tsx`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 1: Write failing private-isolation browser tests**

Tests assert that a valid token reveals only minimal preview data, connect preserves the entire invite path, acceptance requires explicit frozen-contract consent, token replay/revocation/expiry/malformed input all render the same unavailable state, and the private Pod never appears in discovery or direct public preview.

- [ ] **Step 2: Run tests and verify RED**

Run: `env PLAYWRIGHT_BASE_URL=http://192.168.29.244:3411 pnpm --filter @pods/web exec playwright test tests/e2e/phase2-enrollment.spec.ts --grep=private`

- [ ] **Step 3: Implement token creation and management**

Create 32 random bytes with `randomBytes(32).toString("base64url")`, persist only `sha256(token)`, return the raw token once, cap active invitations to five per Pod, and clamp expiry to the earlier of the frozen invite duration or first occurrence opening. Refresh lists metadata only; replacement creates a new token and revokes the selected old token.

- [ ] **Step 4: Implement public-safe invitation preview and atomic acceptance**

The acceptance API derives the user from the session, requires `acceptedFrozenContract: true`, hashes the path token, conditionally consumes it, and inserts `accepted_unfunded` membership in the same transaction. Every invalid token response uses the same status and copy.

- [ ] **Step 5: Run private tests and commit**

```bash
pnpm test:integration && pnpm --filter @pods/web test
git add apps/web/src/components/invitation-* apps/web/src/app/invite apps/web/src/app/api/invitations apps/web/src/app/api/pods/[podId]/invitations apps/web/src/app/pods/[podId]/admin/page.tsx apps/web/tests
git commit -m "feat: add private Pod invitations"
```

### Task 7: My Pods, Today, Rules access, and funding handoff

**Files:**
- Modify: `apps/web/src/app/my-pods/page.tsx`
- Modify: `apps/web/src/components/my-pods-list.tsx`
- Modify: `apps/web/src/app/today/page.tsx`
- Modify: `apps/web/src/app/pods/[podId]/rules/page.tsx`
- Create: `apps/web/src/app/pods/[podId]/fund/page.tsx`
- Modify: `apps/web/src/components/primary-nav.tsx`
- Modify: `apps/web/tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 1: Write failing cross-surface tests**

Tests prove joined Pods appear separately from creator-owned Pods, accepted membership is visible in `/applications` and `/my-pods`, Rules is accessible to creator or accepted member only, and Today prioritizes accepted funding required over creator application review and public-Pod sharing.

- [ ] **Step 2: Run tests and verify RED**

Run: `env PLAYWRIGHT_BASE_URL=http://192.168.29.244:3411 pnpm --filter @pods/web exec playwright test tests/e2e/phase2-enrollment.spec.ts`

- [ ] **Step 3: Implement the enrollment-aware surfaces**

Today priority for Phase 2 is:

```text
accepted_unfunded membership -> Funding required
else pending creator application -> Review applications
else creator public enrollment Pod -> Share and recruit
else -> Discover or create
```

The funding handoff states exactly that no NIM is being requested in Phase 2 and exposes no transaction button. It is guarded by `accepted_unfunded` membership or creator participation admitted under the same rules.

- [ ] **Step 4: Run focused tests and commit**

```bash
pnpm --filter @pods/web test && pnpm --filter @pods/web typecheck
git add apps/web/src/app/my-pods apps/web/src/components/my-pods-list.tsx apps/web/src/app/today apps/web/src/app/pods/[podId]/rules apps/web/src/app/pods/[podId]/fund apps/web/src/components/primary-nav.tsx apps/web/tests
git commit -m "feat: connect enrollment surfaces"
```

### Task 8: Phase 2 full gate and physical handoff

**Files:**
- Create: `validation/phase-2-results.md`
- Modify: `HANDOFF.md`
- Modify: `sessions/2026-07-19-codex-hackathon.md`

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
env PLAYWRIGHT_BASE_URL=http://192.168.29.244:3411 pnpm test:e2e
```

Expected: zero failures, no U+2014 copy violations, both mobile browser profiles passing.

- [ ] **Step 2: Perform security assertions**

Confirm private and unknown Pod public requests are indistinguishable, raw invitation tokens are absent from Postgres and logs, non-creators cannot decide applications or manage invites, client state cannot bypass legal transitions, and no Phase 2 route creates deposit intents or sends NIM.

- [ ] **Step 3: Run the physical Nimiq Pay checkpoint**

Abhinav tests the public two-wallet application flow, creator decision flow, private invitation flow, replay-safe invalid state, discovery filtering, My Pods, Today prioritization, and mobile motion. Phase 3 remains blocked until explicit approval.

- [ ] **Step 4: Record evidence and commit**

```bash
git add validation/phase-2-results.md HANDOFF.md sessions/2026-07-19-codex-hackathon.md
git commit -m "docs: record phase 2 enrollment gate"
```

## Plan self-review

- Spec coverage: public discovery, public preview, applications, creator decisions, private invitation lifecycle, privacy, cancellation, personal surfaces, and funding boundary all have tasks.
- Scope boundary: no deposits, watcher, cutoff snapshot, roster lock, evidence, review, settlement, or transfer behavior is introduced.
- Type consistency: `applied`, `accepted_unfunded`, `application_rejected`, `application_expired`, and `invite_expired` match the locked membership state machine.
- Security boundary: every mutation derives user and authority from the server session; invitation tokens are opaque, hashed, single-use, expiring, and revocable.
- Placeholder scan: no incomplete implementation step remains. The guarded funding screen is an explicit phase boundary, not simulated payment behavior.
