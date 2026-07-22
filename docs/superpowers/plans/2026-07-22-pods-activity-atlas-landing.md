# Pods Activity Atlas Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain Pods entry page with the approved Activity Atlas experience while preserving the existing wallet and discovery routes.

**Architecture:** Keep `HomePage` as the server-safe semantic composition. Isolate Motion behavior in `landing-motion.tsx`, keep illustrative product previews in `landing-previews.tsx`, and place the page-specific responsive visual system in `landing-page.css`. All presentation data is static and no API, database, wallet, or state-machine contract changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, `motion` 12, `next/image`, local media, Vitest, Testing Library, CSS.

---

## File map

- Modify `apps/web/tests/home-page.test.tsx`: acceptance contract for content, routes, privacy, and financial state copy.
- Create `apps/web/src/components/landing-motion.tsx`: reduced-motion-aware reveal, hero atlas, and activity ribbon client leaves.
- Create `apps/web/src/components/landing-previews.tsx`: accountability loop, Pod room preview, and NIM funding rail.
- Modify `apps/web/src/components/home-page.tsx`: complete semantic page composition and exactly two links.
- Create `apps/web/src/app/landing-page.css`: isolated Activity Atlas surfaces, animation, responsive behavior, and reduced-motion rules.
- Modify `apps/web/src/app/layout.tsx`: import the landing stylesheet.

### Task 1: Lock the landing-page behavior contract

**Files:**
- Modify: `apps/web/tests/home-page.test.tsx`

- [ ] **Step 1: Replace the existing test with the failing acceptance contract**

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "../src/components/home-page";

describe("HomePage", () => {
  it("offers exactly the two approved entry actions", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Connect wallet" })).toHaveAttribute("href", "/connect?returnTo=%2Ftoday");
    expect(screen.getByRole("link", { name: "Discover Pods" })).toHaveAttribute("href", "/discover");
  });

  it("explains the complete Pods experience without unsupported claims", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Make showing up feel real." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "The accountability loop." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "One engine. Five rituals." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Inside a Pod." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "NIM makes commitment visible." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Public when you want reach. Private when you want focus." })).toBeVisible();
    expect(screen.queryByText(/guaranteed rewards/i)).not.toBeInTheDocument();
  });

  it("names every fixed activity and the real proof privacy choices", () => {
    render(<HomePage />);
    const ribbon = screen.getByLabelText("Five activity templates");
    for (const label of ["Build & Ship", "Fitness & Movement", "Reading", "Study & Focus", "Practice & Create"]) {
      expect(within(ribbon).getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Pods reviewer only")).toBeVisible();
    expect(screen.getByText("Share with Pod")).toBeVisible();
  });

  it("uses the participant-facing NIM funding sequence", () => {
    render(<HomePage />);
    for (const state of ["Wallet confirmation", "Transaction submitted", "Chain finalized", "Ledger credited", "Place secured"]) {
      expect(screen.getByText(state)).toBeVisible();
    }
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter @pods/web test -- home-page.test.tsx`

Expected: FAIL because the new headings, sections, labels, and exact two-link contract are absent.

### Task 2: Build the isolated motion leaves

**Files:**
- Create: `apps/web/src/components/landing-motion.tsx`

- [ ] **Step 1: Create reduced-motion-aware primitives and visual atlas**

Implement these exports:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Wallet } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";

export function LandingReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 42 }} transition={{ duration: 0.82, delay, ease: [0.16, 1, 0.3, 1] }} viewport={{ once: true, margin: "-80px" }} whileInView={{ opacity: 1, y: 0 }}>{children}</motion.div>;
}

export function LandingActions() {
  return <div className="atlas-actions"><motion.div whileTap={{ scale: 0.98 }}><Link className="atlas-action atlas-action-primary" href="/connect?returnTo=%2Ftoday"><Wallet aria-hidden="true" size={18} weight="light" /><span>Connect wallet</span><i><ArrowUpRight aria-hidden="true" size={15} weight="light" /></i></Link></motion.div><motion.div whileTap={{ scale: 0.98 }}><Link className="atlas-action atlas-action-secondary" href="/discover"><span>Discover Pods</span><i><ArrowUpRight aria-hidden="true" size={15} weight="light" /></i></Link></motion.div></div>;
}

export function ActivityAtlasVisual() {
  const reduced = useReducedMotion();
  const gentleFloat = reduced ? undefined : { y: [0, -8, 0], rotate: [-1, -0.25, -1] };
  return (
    <div aria-hidden="true" className={`atlas-visual${reduced ? " is-static" : ""}`}>
      <motion.figure animate={gentleFloat} className="atlas-frame atlas-frame-build" transition={{ duration: 7.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}>
        <Image alt="" fill priority sizes="(max-width: 767px) 78vw, 430px" src="/media/build.jpg" />
        <figcaption><span>Build & Ship</span><strong>Proof due today</strong></figcaption>
      </motion.figure>
      <motion.figure animate={reduced ? undefined : { y: [0, 7, 0], rotate: [1.25, 0.5, 1.25] }} className="atlas-frame atlas-frame-fitness" transition={{ duration: 8.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}>
        <Image alt="" fill sizes="170px" src="/media/fitness.jpg" />
        <figcaption>Fitness</figcaption>
      </motion.figure>
      <motion.figure animate={reduced ? undefined : { y: [0, -5, 0], rotate: [-0.8, 0.2, -0.8] }} className="atlas-frame atlas-frame-reading" transition={{ duration: 9.1, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}>
        <Image alt="" fill sizes="150px" src="/media/reading.jpg" />
        <figcaption>Reading</figcaption>
      </motion.figure>
      <div className="atlas-occurrence"><span>Today · occurrence 04</span><strong>Ship wallet-safe evidence capture</strong><small>Proof window is open</small><i /></div>
      <div className="atlas-signal atlas-signal-study">Study & Focus</div>
      <div className="atlas-signal atlas-signal-create">Practice & Create</div>
      <div className="atlas-orbit"><i /><i /><i /><i /><span /></div>
    </div>
  );
}

export const ActivityRibbon = memo(function ActivityRibbon() {
  const reduced = useReducedMotion();
  const labels = ["Build & Ship", "Fitness & Movement", "Reading", "Study & Focus", "Practice & Create"];
  return <div aria-label="Five activity templates" className={`activity-ribbon${reduced ? " is-static" : ""}`}><div>{[...labels, ...labels].map((label, index) => <span key={`${label}-${index}`}>{label}<i aria-hidden="true" /></span>)}</div></div>;
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm --filter @pods/web test -- home-page.test.tsx`

Expected: still FAIL because `HomePage` does not compose the new components yet, with no TypeScript errors from the new module.

### Task 3: Build the product-story previews and semantic page

**Files:**
- Create: `apps/web/src/components/landing-previews.tsx`
- Modify: `apps/web/src/components/home-page.tsx`

- [ ] **Step 1: Add the three static preview components**

`landing-previews.tsx` exports the following complete semantic structures:

```tsx
const loopStages = [
  ["01", "Define the activity", "Choose the ritual, cadence, evidence, and community shape."],
  ["02", "Commit NIM", "Fund once so the full activity has a visible commitment."],
  ["03", "Submit proof", "Share the result and choose who can see the supporting image."],
  ["04", "Build momentum", "Keep the occurrence trail, room, and streak moving together."]
] as const;

export function AccountabilityLoop() {
  return <ol className="accountability-list">{loopStages.map(([index, title, copy]) => <li key={index}><span>{index}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>;
}

export function PodRoomPreview() {
  return <div className="room-preview"><header><span>Build Lab</span><small>12 members · proof window open</small></header><div className="room-preview-thread"><article className="room-preview-announcement"><small>Creator announcement</small><p>Keep today&apos;s proof focused on what someone can open and verify.</p></article><article className="room-preview-message"><strong>Arin</strong><p>Checkout flow is now stable on mobile.</p></article><article className="room-preview-proof"><small>Occurrence 04 · submitted</small><h3>Ship wallet-safe evidence capture</h3><p>Added the final mobile states and linked the pull request.</p><div><span>Share with Pod</span><span>Support 6</span><span>2 replies</span></div></article><article className="room-preview-reply"><small>Replying to Arin</small><p>The loading state feels much clearer now.</p></article></div><footer><span>Pods reviewer only</span><span>Share with Pod</span></footer></div>;
}

const fundingStates = ["Wallet confirmation", "Transaction submitted", "Chain finalized", "Ledger credited", "Place secured"] as const;

export function FundingRailPreview() {
  return <ol className="funding-preview">{fundingStates.map((state, index) => <li className={index < 4 ? "is-complete" : "is-current"} key={state}><i aria-hidden="true" /><span>{state}</span><small>{index < 4 ? "Confirmed" : "Roster lock"}</small></li>)}</ol>;
}
```

Use semantic lists for both rails. Use `aria-hidden="true"` only on decorative geometry. Do not add links or buttons.

- [ ] **Step 2: Replace `HomePage` with all nine approved sections**

Replace the file with this composition, retaining the exact copy and route boundaries:

```tsx
import Image from "next/image";

import { ActivityAtlasVisual, ActivityRibbon, LandingActions, LandingReveal } from "./landing-motion";
import { AccountabilityLoop, FundingRailPreview, PodRoomPreview } from "./landing-previews";

const rituals = [
  { className: "ritual-build", eyebrow: "Build & Ship", title: "Make the next deliverable concrete.", copy: "Lock a task, then submit the pull request, commit, issue, or live artifact that proves it moved.", image: "/media/build.jpg", alt: "A builder focused on shipping work" },
  { className: "ritual-fitness", eyebrow: "Fitness & Movement", title: "Show the session happened.", copy: "Use a session summary and supporting image when the activity calls for it.", image: "/media/fitness.jpg", alt: "A runner training outdoors" },
  { className: "ritual-reading", eyebrow: "Reading", title: "Turn pages into a shared rhythm.", copy: "Record the reading result and keep the group cadence visible.", image: "/media/reading.jpg", alt: "An open book in a quiet reading setting" },
  { className: "ritual-study", eyebrow: "Study & Focus", title: "Protect focused time.", copy: "Commit to the session before the work begins.", image: "/media/reading-proof.jpg", alt: "Study notes and reading material" },
  { className: "ritual-create", eyebrow: "Practice & Create", title: "Keep the practice alive.", copy: "Make creative repetitions visible without turning them into a performance metric.", image: "/media/build-proof.jpg", alt: "Creative work taking shape on a desk" }
] as const;

export function HomePage() {
  return <main className="activity-atlas-page">
    <header className="atlas-header"><div aria-label="Pods" className="atlas-brand"><span aria-hidden="true" className="pod-mark" />pods</div><span className="atlas-platform"><i aria-hidden="true" />Built for Nimiq Pay</span></header>
    <section className="atlas-hero" aria-labelledby="atlas-hero-title"><LandingReveal className="atlas-hero-copy"><p className="atlas-eyebrow">Accountability, backed by NIM</p><h1 id="atlas-hero-title">Make showing up feel real.</h1><p className="atlas-hero-body">Create a Pod. Put NIM behind the activity. Prove the work together.</p><LandingActions /><p className="atlas-hero-note"><span>Five activity modes</span><span>Human-reviewed proof</span><span>Built inside Nimiq Pay</span></p></LandingReveal><LandingReveal className="atlas-hero-visual" delay={0.1}><ActivityAtlasVisual /></LandingReveal></section>
    <section className="atlas-ribbon-section"><ActivityRibbon /></section>
    <LandingReveal className="atlas-section accountability-section"><div className="atlas-section-heading"><p className="atlas-eyebrow">From intention to evidence</p><h2 id="accountability-loop-title">The accountability loop.</h2><p>A Pod keeps the rule, money, work, and people in one understandable sequence.</p></div><AccountabilityLoop /></LandingReveal>
    <section className="atlas-section rituals-section" aria-labelledby="rituals-title"><LandingReveal className="atlas-section-heading rituals-heading"><p className="atlas-eyebrow">Activity, not one category</p><h2 id="rituals-title">One engine. Five rituals.</h2><p>The evidence changes with the activity. The shared commitment stays consistent.</p></LandingReveal><div className="ritual-gallery">{rituals.map((ritual, index) => <LandingReveal className={`ritual-card ${ritual.className}`} delay={index * 0.04} key={ritual.eyebrow}><figure><Image alt={ritual.alt} fill sizes="(max-width: 767px) 92vw, 50vw" src={ritual.image} /></figure><div><span>{ritual.eyebrow}</span><h3>{ritual.title}</h3><p>{ritual.copy}</p></div></LandingReveal>)}</div></section>
    <section className="atlas-section room-section" aria-labelledby="room-title"><LandingReveal className="room-section-copy"><p className="atlas-eyebrow">Accountability has a room</p><h2 id="room-title">Inside a Pod.</h2><p>Commitments become shared activity cards. Members can talk, reply, and support the work without changing its review outcome.</p><ul><li>Creator announcements stay distinct.</li><li>Proof remains connected to the occurrence.</li><li>You choose whether the image is Pod-shared or reviewer-only.</li></ul></LandingReveal><LandingReveal className="room-section-preview" delay={0.08}><PodRoomPreview /></LandingReveal></section>
    <section className="atlas-section funding-section" aria-labelledby="funding-title"><LandingReveal className="funding-section-preview"><FundingRailPreview /></LandingReveal><LandingReveal className="funding-section-copy" delay={0.08}><p className="atlas-eyebrow">NIM-native commitment</p><h2 id="funding-title">NIM makes commitment visible.</h2><p>Funding is not a spinner and a promise. Pods shows the participant every stage from wallet confirmation to a secured place.</p><div className="funding-principle"><span>One upfront deposit</span><strong>A clear state at every step.</strong></div></LandingReveal></section>
    <section className="atlas-section spaces-section" aria-labelledby="spaces-title"><LandingReveal className="atlas-section-heading spaces-heading"><p className="atlas-eyebrow">Choose the community shape</p><h2 id="spaces-title">Public when you want reach. Private when you want focus.</h2></LandingReveal><div className="spaces-grid"><LandingReveal className="space-panel space-panel-public"><span>Public Pods</span><h3>Discover, apply, get accepted.</h3><p>Public activities can be shared with a wider community while the creator keeps the roster intentional.</p><small>Visible in Discover</small></LandingReveal><LandingReveal className="space-panel space-panel-private" delay={0.06}><span>Private Pods</span><h3>Invite the people already in the room.</h3><p>Private activities stay out of discovery and open only through a direct invitation.</p><small>Invitation only</small></LandingReveal></div></section>
    <footer className="atlas-footer"><div className="atlas-footer-mark" aria-hidden="true"><i /><i /><i /><i /><span /></div><p>Small commitments become visible momentum.</p><small>pods · a Nimiq Pay Mini App</small></footer>
  </main>;
}
```

Use `next/image` with `sizes` for every informative image. Do not import data repositories or session helpers.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `pnpm --filter @pods/web test -- home-page.test.tsx`

Expected: 4 tests PASS.

### Task 4: Implement the Activity Atlas visual system

**Files:**
- Create: `apps/web/src/app/landing-page.css`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Import the isolated stylesheet**

Add after `design-system.css`:

```tsx
import "./landing-page.css";
```

- [ ] **Step 2: Implement the complete responsive visual system**

The stylesheet must define:

- `.activity-atlas-page` with bone and deep-ink palette variables.
- `.atlas-header` as a detached identity island.
- `.atlas-hero` as a desktop asymmetric grid and mobile single column.
- `.atlas-visual` nested shells and three image planes.
- `.activity-ribbon` transform loop and static reduced-motion mode.
- `.accountability-*` offset rail.
- `.ritual-*` asymmetric image gallery.
- `.room-preview-*` conversation and proof composition.
- `.funding-preview-*` five-state rail.
- `.spaces-*` public and private visual split.
- `.atlas-footer` closing Signal Bloom composition.
- `@media (max-width: 767px)` collapse with no rotations that can cause overflow.
- `@media (prefers-reduced-motion: reduce)` removal of loops and nonessential transitions.

Use only transform and opacity in keyframes. Major section padding is at least 96 pixels on desktop and 64 pixels on mobile. Interactive links remain at least 44 pixels high and receive visible `:focus-visible` treatment.

- [ ] **Step 3: Run targeted and static checks**

Run: `pnpm --filter @pods/web test -- home-page.test.tsx`

Expected: 4 tests PASS.

Run: `pnpm lint:copy`

Expected: copy check passes with no U+2014 characters.

Run: `pnpm --filter @pods/web typecheck`

Expected: exit 0.

### Task 5: Browser validation and repository gate

**Files:**
- Modify only if visual verification finds a reproducible defect.

- [ ] **Step 1: Start the existing LAN server**

Run: `pnpm dev:lan`

Expected: Next.js serves the application on port 3411.

- [ ] **Step 2: Verify the real page at desktop and mobile widths**

Check 1440 by 1100 and 390 by 844:

- Exactly two landing links.
- No horizontal overflow.
- Hero copy appears before media on mobile.
- All nine sections render.
- Activity imagery remains cropped intentionally.
- Funding and privacy copy is readable.
- Reduced-motion emulation removes perpetual movement.
- Browser console has no hydration, image, or accessibility errors.

- [ ] **Step 3: Run the complete gate**

Run: `pnpm check`

Expected: copy check, lint, typecheck, unit tests, 48 integration tests, web build, and worker build all pass.

- [ ] **Step 4: Commit the implementation**

```bash
git add apps/web/src/components/home-page.tsx apps/web/src/components/landing-motion.tsx apps/web/src/components/landing-previews.tsx apps/web/src/app/landing-page.css apps/web/src/app/layout.tsx apps/web/tests/home-page.test.tsx
git commit -m "feat: build Activity Atlas landing"
```
