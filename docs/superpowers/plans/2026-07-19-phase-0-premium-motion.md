---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [pods, phase-0, implementation-plan, motion]
status: approved
---

# Phase 0 Premium Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add premium entrance choreography, tactile template selection, spring continuity, and restrained ambient motion to the locked Phase 0 shell.

**Architecture:** Static page entrance and ambient motion remain CSS-only. A single `TemplateShowcase` client leaf owns selection state and uses `motion/react` for the shared indicator and evidence-detail transition. The page, data, and motion tokens remain independently testable.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, CSS, Motion 12.42.2, Vitest, Testing Library, Playwright

Related: [[10-Projects/Web3-Builds/Hackathons/Pods/BUILD/docs/superpowers/specs/2026-07-19-phase-0-premium-motion-design|Premium motion design]] | [[10-Projects/Web3-Builds/Hackathons/Pods/BUILD/docs/implementation-plan|Phase 0 implementation plan]]

---

## File map

- Create `apps/web/src/components/template-showcase.tsx`: isolated interactive
  selector and animated detail region.
- Create `apps/web/src/components/template-data.ts`: immutable template evidence
  content shared by rendering and tests.
- Create `apps/web/tests/template-showcase.test.tsx`: interaction and accessibility
  regression tests.
- Modify `apps/web/src/components/home-page.tsx`: entrance classes and showcase
  composition only.
- Modify `apps/web/src/app/globals.css`: premium choreography, selector states,
  ambient motion, and reduced-motion overrides.
- Modify `packages/ui/src/tokens.ts`: locked duration and spring values.
- Modify `packages/ui/tests/tokens.test.ts`: token contract test.
- Modify `apps/web/tests/e2e/foundation.spec.ts`: selection, overflow, and
  reduced-motion browser checks.

### Task 1: Lock premium motion tokens

**Files:**
- Modify: `packages/ui/tests/tokens.test.ts`
- Modify: `packages/ui/src/tokens.ts`

- [ ] **Step 1: Write the failing token test**

Replace the motion expectation with:

```ts
expect(motion).toEqual({
  immediate: 0,
  tactile: 140,
  state: 220,
  navigation: 280,
  milestone: 700,
  entrance: 900,
  stagger: 55,
  ambient: 6000,
  selectionSpring: { stiffness: 320, damping: 30, mass: 0.72 }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @pods/ui test`

Expected: FAIL because `entrance`, `stagger`, `ambient`, and
`selectionSpring` are absent.

- [ ] **Step 3: Add the locked tokens**

Extend `motion` in `packages/ui/src/tokens.ts` with:

```ts
entrance: 900,
stagger: 55,
ambient: 6000,
selectionSpring: {
  stiffness: 320,
  damping: 30,
  mass: 0.72
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm --filter @pods/ui test`

Expected: 2 tests pass.

### Task 2: Build the accessible template selector

**Files:**
- Create: `apps/web/src/components/template-data.ts`
- Create: `apps/web/tests/template-showcase.test.tsx`
- Create: `apps/web/src/components/template-showcase.tsx`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install the verified Motion version**

Run: `pnpm --filter @pods/web add motion@12.42.2`

Run: `pnpm --filter @pods/web add -D @testing-library/user-event@14.6.1`

Expected: both packages are saved exactly because `.npmrc` sets
`save-exact=true`.

- [ ] **Step 2: Define immutable template data**

Create `template-data.ts` with:

```ts
export const templates = [
  {
    id: "move",
    name: "Move",
    detail: "Fitness and movement",
    evidence: "In-app photo, completion note, measurable activity minimum"
  },
  {
    id: "read",
    name: "Read",
    detail: "Reading progress",
    evidence: "Title, pages or minutes, reading artifact, optional note"
  },
  {
    id: "focus",
    name: "Focus",
    detail: "Study and deep work",
    evidence: "Topic, duration, focus artifact, short takeaway"
  },
  {
    id: "build",
    name: "Build",
    detail: "Ship visible work",
    evidence: "Locked task, result summary, GitHub or live artifact link"
  },
  {
    id: "create",
    name: "Create",
    detail: "Practice and create",
    evidence: "Locked output goal, artifact, reflection"
  }
] as const;

export type TemplateId = (typeof templates)[number]["id"];
```

- [ ] **Step 3: Write failing selector tests**

Create `template-showcase.test.tsx` with tests that:

```tsx
const user = userEvent.setup();
render(<TemplateShowcase />);
expect(screen.getByRole("button", { name: /Move/i })).toHaveAttribute(
  "aria-pressed",
  "true"
);
expect(screen.getByRole("region", { name: "Selected evidence contract" }))
  .toHaveTextContent("measurable activity minimum");

await userEvent.click(screen.getByRole("button", { name: /Build/i }));
expect(screen.getByRole("button", { name: /Build/i })).toHaveAttribute(
  "aria-pressed",
  "true"
);
expect(screen.getByRole("region", { name: "Selected evidence contract" }))
  .toHaveTextContent("GitHub or live artifact link");
```

- [ ] **Step 4: Run the selector test and verify RED**

Run: `pnpm --filter @pods/web test -- template-showcase.test.tsx`

Expected: FAIL because `TemplateShowcase` does not exist.

- [ ] **Step 5: Implement the isolated client component**

Create `template-showcase.tsx` with `"use client"`, local `useState`,
`AnimatePresence`, `motion`, and `useReducedMotion`. Render every row as a
`motion.button` with `aria-pressed`. Render the selected edge as a shared
`layoutId="template-selection"` element. Use this transition:

```ts
const selectionTransition = shouldReduceMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 320, damping: 30, mass: 0.72 } as const;
```

The fixed detail region uses `mode="wait"`, a key equal to the selected ID,
and these states:

```ts
initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
```

- [ ] **Step 6: Run the selector test and verify GREEN**

Run: `pnpm --filter @pods/web test -- template-showcase.test.tsx`

Expected: both selector tests pass.

### Task 3: Choreograph the locked shell

**Files:**
- Modify: `apps/web/src/components/home-page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/tests/home-page.test.tsx`

- [ ] **Step 1: Strengthen the page boundary test**

Add expectations that the five selector buttons exist while unfinished product
actions still do not:

```ts
expect(screen.getAllByRole("button")).toHaveLength(5);
expect(screen.queryByRole("button", { name: /fund|join|connect/i }))
  .not.toBeInTheDocument();
```

- [ ] **Step 2: Run the page test and verify RED**

Run: `pnpm --filter @pods/web test -- home-page.test.tsx`

Expected: FAIL because the current template rows are static articles.

- [ ] **Step 3: Compose the interactive showcase**

Remove the local template array from `home-page.tsx`, import
`TemplateShowcase`, and replace the static template list with that component.
Add these entrance classes without changing text or layout:

```tsx
<header className="topbar entrance entrance-topbar">
<section className="hero entrance entrance-hero">
<section className="status-panel entrance entrance-status">
<section className="template-section entrance entrance-templates">
```

- [ ] **Step 4: Add premium CSS choreography**

Add one transform-and-opacity entrance keyframe using the approved easing.
Assign section delays of `0ms`, `80ms`, `160ms`, and `260ms`. Template selector
delays use `calc(310ms + var(--template-index) * 55ms)`.

Add:

- `translateY(18px)` and `scale(0.985)` only where physical weight helps.
- hover effects inside `@media (hover: hover) and (pointer: fine)`.
- `:active { transform: scale(0.98); }` for template selectors.
- a visible `:focus-visible` outline with `var(--action)`.
- a 6000ms status-dot breathing loop.
- a 6000ms status-ring drift loop capped at 4px and 2 degrees.
- a reduced-motion block that sets animation and transition duration to `0ms`
  and removes transforms.

- [ ] **Step 5: Run page and copy tests**

Run: `pnpm --filter @pods/web test`

Run: `pnpm lint:copy`

Expected: all web tests pass and no U+2014 appears.

### Task 4: Verify premium motion in both mobile engines

**Files:**
- Modify: `apps/web/tests/e2e/foundation.spec.ts`

- [ ] **Step 1: Extend the browser test**

After the existing heading and overflow assertions, click Build and assert:

```ts
await page.getByRole("button", { name: /Build/i }).click();
await expect(page.getByRole("region", { name: "Selected evidence contract" }))
  .toContainText("GitHub or live artifact link");
await expect(page.getByRole("button", { name: /Build/i }))
  .toHaveAttribute("aria-pressed", "true");
```

Add a second test that calls `page.emulateMedia({ reducedMotion: "reduce" })`,
loads the page, and confirms the heading and selector detail are immediately
visible and usable.

- [ ] **Step 2: Run the complete automated gate**

Run: `pnpm check`

Run: `pnpm test:e2e`

Expected: all static, unit, service integration, build, Mobile Safari, Android
Chromium, and reduced-motion checks pass.

### Task 5: Reopen the physical Phase 0 gate

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Restart the LAN server**

Run: `pnpm dev:lan`

Expected: Pods listens on `http://192.168.29.244:3411` or the newly reported
Wi-Fi address on port 3411.

- [ ] **Step 2: Record the automated evidence**

Update `HANDOFF.md` with exact test counts, LAN URL, and motion-review status.
Keep the 5 NIM balance and outbound physical transfer as separate evidence.

- [ ] **Step 3: Ask for physical motion approval and recipient address**

The product owner checks entrance, tap response, selection continuity, scroll,
and reduced-motion behavior inside Nimiq Pay. Obtain the exact destination NQ
address before sending any treasury funds.

- [ ] **Step 4: Run the previously approved outbound transfer gate**

Set `PODS_PREFLIGHT_RECIPIENT` to the exact address supplied by the product
owner, then run:

```bash
pnpm --filter @pods/worker preflight:send -- "$PODS_PREFLIGHT_RECIPIENT" 1000 --simulate-unknown
```

Run `preflight:reconcile` with the exact hash printed by that command.
Reconciliation must not broadcast again. Stop after physical receipt and Phase
0 approval.
