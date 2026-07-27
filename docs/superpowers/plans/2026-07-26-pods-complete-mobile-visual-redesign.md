---
created: 2026-07-26
project: pods
ecosystem: nimiq
tags: [implementation, mobile, visual-redesign, prototype, testnet]
---

# Pods Complete Mobile Visual Redesign Implementation Plan

Related: [[DESIGN]] |
[[PRODUCT]] |
[[docs/superpowers/specs/2026-07-26-pods-complete-mobile-visual-redesign]] |
[[docs/superpowers/specs/2026-07-23-pods-creator-review-mvp-design]]

> **For agentic workers:** Use `superpowers:subagent-driven-development`.
> Execute one task at a time with a fresh implementer. Run a specification
> review before a code-quality review for every task. Keep the implementer
> available until both reviews pass.

**Goal:** Replace the disconnected `/design-preview` prototype with a complete,
mobile-native visual model of every approved Pods actor journey and lifecycle
state.

**Architecture:** Keep the redesign isolated from production routes and data
mutations. A typed scenario model and transition registry own navigation,
identity, selected entities, and visual-only state. Journey renderers compose a
small shared primitive system. The top-level prototype becomes an orchestrator,
not another page-sized component.

**Tech stack:** Next.js 16, React 19, TypeScript, CSS Modules, Motion,
Phosphor Icons, Vitest, Testing Library, Playwright.

**Validation boundary:** This work does not add database mutations, wallet
transactions, production route behavior, settlement execution, or Mainnet
support. Safe current database projections may seed the companion; missing
states use deterministic fixtures.

---

## Task 1: Establish the visual system and typed journey architecture

**Files**

- Modify: `DESIGN.md`
- Add: `apps/web/public/media/nimiq-signet.svg`
- Add: `apps/web/src/components/design-preview/model.ts`
- Add: `apps/web/src/components/design-preview/registry.ts`
- Add: `apps/web/src/components/design-preview/scenarios.ts`
- Add: `apps/web/src/components/design-preview/primitives.tsx`
- Add: `apps/web/src/components/design-preview/prototype-shell.tsx`
- Add: `apps/web/src/components/design-preview/prototype.module.css`
- Modify: `apps/web/src/components/design-preview/native-momentum-prototype.tsx`
- Test: `apps/web/tests/design-preview-registry.test.ts`
- Test: `apps/web/tests/design-preview-primitives.test.tsx`

### Step 1.1: Write failing registry tests

Cover:

- every actor has a valid initial screen;
- every destination is registered;
- actor switches never mutate the signed-in viewer;
- selected Pod, person, submission, application, and transfer persist;
- applicants cannot navigate directly to funding;
- waiting members cannot enter the room;
- participants cannot set their own proof outcome;
- no obsolete clarification, dispute, appeal, or grace state exists;
- Pod completion is represented as `final_review` followed by `completed`, not
  invented intermediate Pod enums.

Run:

```bash
pnpm --filter @pods/web test -- design-preview-registry.test.ts
```

Expected: FAIL because the model and registry do not exist.

### Step 1.2: Implement the model and transition registry

Create discriminated types for actor, screen, scenario, selected entity,
activity outcome, transfer state, and allowed visual mutation. Use a registry
lookup for navigation. No renderer may infer an actor from its destination.

### Step 1.3: Write failing primitive tests

Cover semantic and accessible behavior for:

- `ChoiceCard`
- `ChoiceIndicator`
- `SwitchRow`
- `ActionDock`
- `RequestCard`
- `NimMedallion`
- `FinancialReceipt`
- `TransferTracker`
- `OutcomeStrip`
- `ConsentPanel`
- `TerminalOutcome`
- `UploadAvatarTile`

Expected: FAIL before the primitives exist.

### Step 1.4: Implement the visual foundation

Update `DESIGN.md` to the approved system:

- off-black landing;
- visually white authenticated shell;
- off-black, momentum lime, and white as the global palette;
- activity accents only inside activity context;
- no divider-line layouts;
- raised cards only for decisions, receipts, media, and grouped content;
- no nested cards;
- the approved spacing, type, radius, elevation, and motion scales;
- fluid 320px to 430px portrait behavior.

Use the official black Nimiq signet asset. Do not trace or redraw the logo.

### Step 1.5: Reduce the top-level component

Make `native-momentum-prototype.tsx` own only:

- current actor;
- current screen;
- selected entities;
- visual-only scenario mutation;
- desktop/mobile companion controls;
- journey renderer dispatch.

It must not contain page-specific layout markup.

### Step 1.6: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-registry.test.ts design-preview-primitives.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): establish mobile visual system
```

---

## Task 2: Build entry, onboarding, profile, and Pod creation journeys

**Files**

- Add: `apps/web/src/components/design-preview/journeys/entry-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/profile-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/create-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/journeys.module.css`
- Modify: `apps/web/src/components/design-preview/registry.ts`
- Modify: `apps/web/src/components/design-preview/scenarios.ts`
- Test: `apps/web/tests/design-preview-entry-create.test.tsx`

### Step 2.1: Write failing journey tests

Cover:

- Landing to Wallet, and Landing to Discover;
- signature waiting, error, and connected variants;
- identity, avatar, photo source, crop/upload, privacy, and setup success;
- avatar upload tile and source controls;
- template, activity, community, NIM commitment, contract review, publishing,
  and published success;
- visitor toggle appears only for a public Pod;
- unselected choices are neutral circles and selected choices carry a check;
- Publish stays disabled before consent.

### Step 2.2: Implement entry and onboarding

Landing uses one continuous off-black composition with activity imagery,
headline, compact supporting copy, and a single wallet CTA. Wallet uses one
sentence and no redundant security cards. Onboarding is a focused one-decision
wizard with real photo-upload visual states.

### Step 2.3: Implement Pod creation

Each creation step owns one decision:

1. template;
2. activity;
3. community;
4. NIM commitment;
5. frozen-contract review.

Use the official NIM medallion, one visual math receipt, clear participant
capacity, a correct visitor switch, a separate consent panel, and explicit
publishing and success states.

### Step 2.4: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-entry-create.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): redesign entry and creation journeys
```

---

## Task 3: Build visitor, application, funding, waiting, and refund journeys

**Files**

- Add: `apps/web/src/components/design-preview/journeys/visitor-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/funding-journey.tsx`
- Add: `apps/web/src/components/design-preview/financial-primitives.tsx`
- Modify: `apps/web/src/components/design-preview/registry.ts`
- Modify: `apps/web/src/components/design-preview/scenarios.ts`
- Test: `apps/web/tests/design-preview-enrollment-finance.test.tsx`

### Step 3.1: Write failing lifecycle tests

Cover:

- public preview and visitor-enabled read-only room;
- valid and unavailable private invitation;
- application submitted, pending, accepted, declined, and expired;
- accepted relationship required before funding;
- contract consent before wallet handoff;
- wallet, submitted, observed, finalized, credited, cutoff, roster lock, active;
- funding exception families;
- waiting member cannot enter the room;
- refund queued, prepared, submitted, confirming, confirmed, delayed, retryable,
  mismatch, and manual-review variants;
- confirmed refund omits the obsolete incomplete funding rail.

### Step 3.2: Implement enrollment surfaces

Use current Pod data for discovery identity. Maintain the viewer relationship
on every Pod card and detail screen. Every primary next action must be explicit.

### Step 3.3: Implement funding and refund receipts

Every money state must answer:

1. amount;
2. reason;
3. current state;
4. required action;
5. transaction reference only after it exists.

Do not reuse one generic financial success screen.

### Step 3.4: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-enrollment-finance.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): connect enrollment and finance journeys
```

---

## Task 4: Build participant room, commitment, proof, and outcome journeys

**Files**

- Add: `apps/web/src/components/design-preview/journeys/participant-journey.tsx`
- Add: `apps/web/src/components/design-preview/room-primitives.tsx`
- Add: `apps/web/src/components/design-preview/proof-primitives.tsx`
- Modify: `apps/web/src/components/design-preview/registry.ts`
- Modify: `apps/web/src/components/design-preview/scenarios.ts`
- Test: `apps/web/tests/design-preview-participant.test.tsx`

### Step 4.1: Write failing participant tests

Cover:

- Today priority variants;
- My Pods lifecycle groups;
- room composer and context sheet;
- Build/Create commitment lock before proof;
- repeating-activity evidence flow without a fake commitment step;
- image, link, artifact, and share-visibility choices;
- reviewing, approved, rejected, timeout-protected, and missed states;
- no participant action can advance creator review;
- an activity message updates in place instead of duplicating;
- rejected outcome has no appeal action;
- private evidence never appears on the public proof variant;
- room archive removes the composer.

### Step 4.2: Implement the conversation surface

The room is compact and native:

- header;
- occurrence deadline strip;
- conversational timeline;
- distinct activity/proof message;
- fixed safe-area-aware composer;
- context sheet for proof history, members, contract, and sharing.

Replies, reactions, and proof cards are visual interactions only.

### Step 4.3: Implement activity and proof journeys

Use focused, sequential editors. Keep evidence purpose, visibility, deadline,
and consequence legible without a wall of metadata. Use activity color only in
media and proof context.

### Step 4.4: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-participant.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): redesign participant activity journeys
```

---

## Task 5: Build creator review, final review, settlement, and afterstates

**Files**

- Add: `apps/web/src/components/design-preview/journeys/creator-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/completion-journey.tsx`
- Modify: `apps/web/src/components/design-preview/financial-primitives.tsx`
- Modify: `apps/web/src/components/design-preview/registry.ts`
- Modify: `apps/web/src/components/design-preview/scenarios.ts`
- Test: `apps/web/tests/design-preview-creator-completion.test.tsx`

### Step 5.1: Write failing creator and settlement tests

Cover:

- application queue, applicant profile, accept, decline, and stale decision;
- funding overview and roster lock;
- review queue oldest-first;
- proof workspace with public artifact and creator-only evidence;
- approve and reject-with-reason confirmation;
- already-decided and timeout race;
- final review blockers;
- ready-to-finalize, calculating, payout processing, completed, and
  operations-blocked visual states;
- zero-recipient restoration;
- no-transfer-required;
- payout queued, prepared, submitted, confirming, paid, delayed, retryable,
  and manual-review;
- creator receives no participant money and has no payout discretion;
- completed Pod routes to the read-only archive.

### Step 5.2: Implement creator action queues

Use compact raised queue rows, never divider lists. Keep the primary review
decision visible. Evidence, review summary, and private notes must have
separate breathing room.

### Step 5.3: Implement participant and creator completion

Participant outcome leads. Creator conservation leads. Both use distinct
receipts and never share a generic status composition.

### Step 5.4: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-creator-completion.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): complete creator and settlement visuals
```

---

## Task 6: Build social and operations journeys

**Files**

- Add: `apps/web/src/components/design-preview/journeys/social-journey.tsx`
- Add: `apps/web/src/components/design-preview/journeys/operations-journey.tsx`
- Modify: `apps/web/src/components/design-preview/registry.ts`
- Modify: `apps/web/src/components/design-preview/scenarios.ts`
- Test: `apps/web/tests/design-preview-social-operations.test.tsx`

### Step 6.1: Write failing social and operations tests

Cover:

- search guidance before two characters and empty results;
- public, private, unknown, self, pending, friend, friends-only, and blocked
  profile variants;
- explicit Accept and Decline in requests;
- no unexplained overflow for primary decisions;
- direct-message send, failed, retry, and unavailable-reply variants;
- deposit, refund, settlement, transfer, freeze, and public-safety operations;
- transfer filters for unknown, retryable failed, mismatched, late, and manual
  review;
- replacement attempt only after an attempt is proven absent or failed;
- operations cannot review proof or change financial outcomes.

### Step 6.2: Implement social surfaces

Use modern portrait identity, compact counts, explicit relationship state, and
clean messaging density. Keep wallet, private Pod, evidence, and financial data
out of public identity.

### Step 6.3: Implement operations surfaces

Operations uses higher-density, factual layouts distinct from participant
receipts. Recovery actions have deliberate spacing and explicit safety copy.

### Step 6.4: Verify and commit

Run:

```bash
pnpm --filter @pods/web test -- design-preview-social-operations.test.tsx
pnpm --filter @pods/web typecheck
```

Commit:

```text
feat(design-preview): complete social and operations visuals
```

---

## Task 7: Integrate the complete companion and validate the mobile matrix

**Files**

- Modify: `apps/web/tests/native-momentum-prototype.test.tsx`
- Replace: `apps/web/tests/e2e/design-preview.spec.ts`
- Modify: `apps/web/src/components/design-preview/prototype-shell.tsx`
- Modify: `apps/web/src/components/design-preview/prototype.module.css`
- Modify: `HANDOFF.md`

### Step 7.1: Write failing end-to-end companion tests

Cover:

- every canonical journey and required variant is selectable;
- every registered transition lands on the correct entity and actor;
- visual controls remain reachable at all representative widths;
- no horizontal overflow;
- no fixed dock or composer overlap;
- keyboard-open forms retain their action;
- safe-area variants retain bottom controls;
- 125 percent text scaling remains usable;
- no em dash appears in product copy;
- no visible divider-line layout exists;
- no explanatory text is smaller than 12px;
- no interactive form value is smaller than 16px.

### Step 7.2: Validate the responsive matrix

Run Playwright at:

- 320 by 568;
- 360 by 800;
- 375 by 667;
- 390 by 844;
- 412 by 915;
- 430 by 932.

Also validate keyboard-open simulations, zero/20px/34px safe areas, 100/115/125
percent text scales, and a functional landscape fallback.

### Step 7.3: Run the repository gate

```bash
pnpm --filter @pods/web test
pnpm --filter @pods/web typecheck
pnpm --filter @pods/web build
pnpm --filter @pods/web test:e2e -- design-preview.spec.ts
```

### Step 7.4: Perform visual review

Capture at least:

- landing;
- avatar setup;
- NIM commitment;
- publish review;
- application pending;
- funding confirming;
- refund confirmed;
- Pod room;
- proof review;
- rejected outcome;
- creator review queue;
- creator proof decision;
- participant settlement;
- creator settlement;
- requests;
- public profile;
- transfer detail.

Compare the screenshots against the approved specification. Fix Critical and
Important findings before reporting completion.

### Step 7.5: Update handoff and commit

Record:

- branch and commit;
- exact test/build evidence;
- browser URL;
- screenshots captured;
- production migration remains unstarted;
- user visual approval remains the next gate.

Commit:

```text
test(design-preview): validate complete mobile redesign
```

## Completion gate

The visual redesign is ready for user review only when:

- the specification review passes;
- the code-quality review passes;
- all unit, type, build, and Playwright checks pass;
- the companion remains usable from 320px through 430px portrait widths;
- every approved actor journey and lifecycle branch is inspectable;
- the browser preview remains running on port 3411;
- production routes have not been changed.
