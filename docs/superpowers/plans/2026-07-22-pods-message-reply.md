---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [implementation-plan, messaging, replies, mobile-ux, tdd]
---

# Pods Message Reply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed lime send state and durable WhatsApp-style quoted replies that scroll to and highlight the original message.

**Architecture:** Keep `messages.replyToMessageId` as the only persisted relationship. Add a batched, privacy-safe reply projection to the existing conversation query, extend that query with an authorized `around` mode for unloaded targets, and render the projection through a focused client component. Message, moderation, review, and financial authority remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, PostgreSQL, Vitest, Testing Library, Playwright, CSS custom properties.

---

## File structure

- Modify `packages/domain/src/social.ts` to define the shared `MessageReplyPreview` DTO.
- Modify `packages/db/src/messaging-repository.ts` to batch reply targets, redact hidden content, and load bounded context around a message.
- Modify `apps/web/src/app/api/conversations/[conversationId]/messages/route.ts` to expose authorized `around` retrieval through the existing route.
- Create `apps/web/src/components/message-reply-preview.tsx` to own preview labels and accessible quote rendering.
- Modify `apps/web/src/components/pod-room.tsx` to attach optimistic previews, navigate to originals, reconcile context, and invalidate hidden targets.
- Modify `apps/web/src/app/design-system.css` for fixed lime send states, quoted blocks, and transient highlights.
- Extend focused repository, route, component, and mobile browser tests.

### Task 1: Safe reply DTO and repository projection

**Files:**
- Modify: `packages/domain/src/social.ts`
- Modify: `packages/db/src/messaging-repository.ts`
- Test: `packages/db/tests/phase4c-messaging.integration.test.ts`

- [x] **Step 1: Write failing integration tests**

Add a text message and reply, then assert that `listConversationMessages()` returns:

```ts
expect(listed.messages[1]?.replyPreview).toEqual({
  messageId: first.id,
  sequence: 1,
  senderDisplayName: "Builder One",
  kind: "member_message",
  excerpt: "Original room message",
  available: true
});
```

Hide the original and assert the reply returns `available: false`, `excerpt: "Message unavailable"`, and no original body. Add an `aroundMessageId` test that returns the target and bounded neighboring sequences from the same authorized conversation.

- [x] **Step 2: Run the repository test and verify RED**

Run:

```bash
pnpm exec vitest run --config vitest.integration.config.ts packages/db/tests/phase4c-messaging.integration.test.ts
```

Expected: FAIL because `replyPreview` and `aroundMessageId` are not implemented.

- [x] **Step 3: Define the DTO and implement batched projection**

Add to `packages/domain/src/social.ts`:

```ts
export type MessageReplyPreview = {
  messageId: string;
  sequence: number;
  senderDisplayName: string | null;
  kind: MessageKind;
  excerpt: string;
  available: boolean;
};
```

Extend `listConversationMessages` with `aroundMessageId?: string | null`. Resolve the target sequence only after `requireConversationAccess`. Query returned rows normally or around the target. Collect unique non-null `replyToMessageId` values, fetch those messages and profiles once with the same `conversationId`, and map safe previews. Use at most 120 characters for text and announcement bodies, `Activity update` for activity, `Pods system update` for system, and `Message unavailable` for hidden, deleted, or missing targets.

- [x] **Step 4: Run the repository test and verify GREEN**

Run the Task 1 command again. Expected: all messaging integration tests PASS.

### Task 2: Authorized context route

**Files:**
- Modify: `apps/web/src/app/api/conversations/[conversationId]/messages/route.ts`
- Test: `apps/web/tests/direct-message-routes.test.ts`

- [x] **Step 1: Write failing route tests**

Call:

```ts
new Request("http://pods.test/api/conversations/conversation-1/messages?around=00000000-0000-4000-8000-000000000008&limit=40")
```

Assert the repository receives `aroundMessageId: "00000000-0000-4000-8000-000000000008"`, the signed session user ID, and a limit of 40. Assert unauthenticated requests remain `401` and repository access failures remain public-safe.

- [x] **Step 2: Run the route test and verify RED**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/direct-message-routes.test.ts
```

Expected: FAIL because the route ignores `around`.

- [x] **Step 3: Parse and pass the context selector**

Read `around` from `request.url`, pass `aroundMessageId: around || null`, and keep the current bounded limit and authenticated access path. Do not add a new public endpoint.

- [x] **Step 4: Run the route test and verify GREEN**

Run the Task 2 command again. Expected: all direct-message route tests PASS.

### Task 3: Quoted reply component and room behavior

**Files:**
- Create: `apps/web/src/components/message-reply-preview.tsx`
- Modify: `apps/web/src/components/pod-room.tsx`
- Test: `apps/web/tests/pod-room.test.tsx`

- [x] **Step 1: Write failing component tests**

Cover all of these outcomes:

```ts
expect(screen.getByRole("button", {
  name: "Reply to Abhinav: Ship room walkthrough at 8 PM."
})).toBeVisible();
```

- An optimistic reply immediately renders the quoted sender and excerpt.
- Clicking a loaded quote calls `scrollIntoView` on the original and applies `is-reply-target` for 1,200 milliseconds.
- Clicking an unloaded quote requests `?around=<id>&limit=40`, merges returned messages by ID and sequence, then scrolls.
- A failed context request changes only that quote to `Message unavailable`.
- Hiding an original replaces all local references to its body with `Message unavailable`.
- The same quoted block renders in `mode="pod"` and `mode="direct"`.

- [x] **Step 2: Run the component test and verify RED**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/pod-room.test.tsx
```

Expected: FAIL because reply previews and quote navigation are absent.

- [x] **Step 3: Implement the focused reply component**

Create `message-reply-preview.tsx` with:

```ts
export type ReplyPreviewSource = {
  id: string;
  sequence: number;
  kind: MessageKind;
  body: string | null;
  hidden: boolean;
  sender: { displayName: string } | null;
};

export function localReplyPreview(message: ReplyPreviewSource): MessageReplyPreview;

export function MessageReplyPreviewView(props: {
  preview: MessageReplyPreview;
  onActivate?: () => void;
}): React.ReactNode;
```

Render an accessible button only when `available` and `onActivate` are present. Render a non-interactive block for unavailable targets. Show sender plus a two-line excerpt.

- [x] **Step 4: Implement room navigation and optimistic state**

Add `replyPreview: MessageReplyPreview | null` to `RoomMessage`. When sending, derive the optimistic preview from `replyTo`. Add `activateReplyTarget(replyMessageId, preview)` that:

1. Scrolls immediately when `document.getElementById(preview.messageId)` exists.
2. Otherwise fetches the existing messages route with `around` and limit 40.
3. Merges by message ID, sorts by sequence, and scrolls on the next animation frame.
4. Applies `is-reply-target`, clears it after 1,200 milliseconds, and respects reduced motion for scroll behavior.
5. Marks only the selected reply preview unavailable on retrieval failure.

Update `hideMessage` so the hidden original and every local quote pointing to it are redacted together.

- [x] **Step 5: Run the component test and verify GREEN**

Run the Task 3 command again. Expected: all Pod room tests PASS.

### Task 4: Fixed lime visual state and mobile journey

**Files:**
- Modify: `apps/web/src/app/design-system.css`
- Modify: `apps/web/tests/design-system-contract.test.ts`
- Modify: `apps/web/tests/e2e/visual-profile.spec.ts`

- [x] **Step 1: Write failing style and browser assertions**

Assert the canonical stylesheet includes:

```css
.composer-send.is-ready {
  color: var(--activity-build-deep);
  background: var(--activity-build);
}
```

In the Pod room and direct-message journeys, reply to a visible message, assert the quote is present after sending and refresh, click it, and assert the original receives `is-reply-target`. With composer text entered, assert the send button background resolves to `rgb(217, 237, 114)`.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/design-system-contract.test.ts tests/pod-room.test.tsx
```

Expected: FAIL because the fixed lime and quoted reply classes are absent.

- [x] **Step 3: Add the canonical styles**

Add final-layer rules for:

- Fixed lime enabled send state and dark icon.
- Neutral disabled state.
- Compact quote with a 3-pixel lime rail, sender label, two-line excerpt, focus, and pressed states.
- Composer reply preview with a visible Cancel target.
- A 1,200-millisecond highlight using border and background only, with a reduced-motion equivalent and no layout shift.

- [x] **Step 4: Run component and mobile browser verification**

Run:

```bash
pnpm --filter @pods/web exec vitest run tests/design-system-contract.test.ts tests/pod-room.test.tsx
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3411 pnpm --filter @pods/web exec playwright test tests/e2e/visual-profile.spec.ts --project=mobile-safari
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3411 pnpm --filter @pods/web exec playwright test tests/e2e/visual-profile.spec.ts --project=android-chromium
```

Expected: focused tests PASS and both mobile projects pass all four journeys.

### Task 5: Full validation and handoff

**Files:**
- Modify: `HANDOFF.md`
- Modify: `history/session-log.md`
- Modify: `sessions/2026-07-22-codex-hackathon.md`

- [x] **Step 1: Run the complete repository gate**

Run:

```bash
pnpm check
```

Expected: copy, lint, type checks, unit tests, integration tests, and production web and worker builds PASS.

- [x] **Step 2: Inspect final mobile captures**

Inspect Pod reply, direct reply, enabled send, scrolled target, hidden target, and unavailable target captures. Confirm no clipping, legacy blue, duplicate controls, or U+2014 copy.

- [x] **Step 3: Record the exact completion boundary**

Update the handoff and session records with automated counts. Keep the physical Nimiq Pay reply walkthrough as a separate gate until approved on device.
