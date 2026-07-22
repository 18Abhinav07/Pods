import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const designCss = () => readFileSync(resolve(process.cwd(), "src/app/design-system.css"), "utf8");
const layoutSource = () => readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("Pods mobile design system", () => {
  it("loads the canonical design layer after legacy route styles", () => {
    const source = layoutSource();
    expect(source.indexOf('import "./globals.css"')).toBeGreaterThan(-1);
    expect(source.indexOf('import "./design-system.css"')).toBeGreaterThan(
      source.indexOf('import "./globals.css"')
    );
  });

  it("defines the approved warm shell and activity themes without legacy blue", () => {
    const css = designCss().toLowerCase();
    expect(css).toContain("--color-ink: #20241f");
    expect(css).toContain("--color-paper: #faf9f4");
    expect(css).toContain("--activity-build: #d9ed72");
    expect(css).toContain("--activity-fitness: #fa7448");
    expect(css).toContain("--activity-reading: #aeb8f0");
    expect(css).not.toContain("#3b5ccc");
    expect(css).not.toContain("#5267cc");
  });

  it("keeps interactive controls large enough for mobile and iOS focus", () => {
    const css = designCss();
    expect(css).toMatch(/input,[\s\S]*textarea,[\s\S]*select[\s\S]*font-size:\s*16px/);
    expect(css).toMatch(/\.profile-field\s*>\s*input[\s\S]*font-size:\s*16px/);
    expect(css).toMatch(/\.composer-row\s+textarea[\s\S]*font-size:\s*16px/);
    expect(css).toMatch(/\.primary-action[\s\S]*min-height:\s*48px/);
    expect(css).toContain("min-width: 44px");
    expect(css).toContain(":focus-visible");
  });

  it("contains fill media and selected avatars inside their mobile components", () => {
    const css = designCss();
    expect(css).toMatch(/\.my-pod-thumbnail\s*\{[\s\S]*position:\s*relative/);
    expect(css).toMatch(/\.my-pod-thumbnail\s*\{[\s\S]*overflow:\s*hidden/);
    expect(css).toMatch(/\.my-pod-thumbnail\s+img\s*\{[\s\S]*object-fit:\s*cover/);
    expect(css).toMatch(/\.avatar-picker\s*\{[\s\S]*padding-block:\s*4px/);
    expect(css).toMatch(/\.avatar-picker\s+button\.is-selected[\s\S]*transform:\s*none/);
  });

  it("uses purposeful premium motion with a complete reduced-motion fallback", () => {
    const css = designCss();
    expect(css).toContain("@keyframes momentum-reveal");
    expect(css).toMatch(/\.primary-action:active[\s\S]*transform:\s*scale\(0\.97\)/);
    expect(css).toMatch(/\.pod-card-detail-panel\.is-open[\s\S]*momentum-reveal/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*animation-duration:\s*0\.01ms\s*!important/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*transition-duration:\s*0\.01ms\s*!important/);
  });

  it("treats Pod rooms as compact mobile conversations instead of dashboard cards", () => {
    const css = designCss();
    expect(css).toMatch(/\.room-context-hero[\s\S]*min-height:\s*112px/);
    expect(css).toMatch(/\.pod-tabs[\s\S]*border-bottom:\s*1px solid var\(--color-line\)/);
    expect(css).toMatch(/\.room-entry-member_message[\s\S]*max-width:\s*86%/);
    expect(css).toMatch(/\.room-entry-actions\s*>\s*button[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.reaction-tray\s+button[\s\S]*width:\s*44px/);
    expect(css).toMatch(/\.room-activity-main[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+96px/);
    expect(css).toMatch(/\.room-proof-image[\s\S]*width:\s*96px[\s\S]*height:\s*96px/);
    expect(css).toMatch(/\.room-activity-card h3[\s\S]*font-size:\s*18px/);
  });

  it("uses the fixed lime send state and compact quoted replies", () => {
    const css = designCss();
    expect(css).toMatch(/\.composer-send\.is-ready\s*\{[\s\S]*color:\s*var\(--activity-build-deep\)[\s\S]*background:\s*var\(--activity-build\)/);
    expect(css).toMatch(/\.message-reply-preview\s*\{[\s\S]*border-left:\s*3px solid var\(--activity-build\)/);
    expect(css).toMatch(/\.room-entry\.is-reply-target\s*\{[\s\S]*background:/);
    expect(css).not.toMatch(/\.room-entry\.is-viewer\s+\.message-reply-preview\s*\{/);
    expect(css).toMatch(/\.pod-room-panel\.is-direct\s+\.room-entry-member_message\.is-viewer\s+\.message-reply-preview\s*\{/);
  });

  it("anchors a restrained compact navigation directly to the safe area", () => {
    const css = designCss();
    const navRules = [...css.matchAll(/\.social-bottom-nav\s*\{([^}]*)\}/g)];
    const activeRules = [...css.matchAll(/\.social-bottom-nav\s+a\[aria-current="page"\]\s*\{([^}]*)\}/g)];
    expect(navRules.at(-1)?.[1]).toContain("bottom: 0");
    expect(navRules.at(-1)?.[1]).toContain("min-height: 64px");
    expect(activeRules.at(-1)?.[1]).toContain("background: transparent");
  });

  it("removes legacy glass and link styling from first-run and empty states", () => {
    const css = designCss();
    expect(css).toMatch(/\.onboarding-step\s*\{[\s\S]*background:\s*transparent/);
    expect(css).toMatch(/\.onboarding-step\s*\{[\s\S]*box-shadow:\s*none/);
    expect(css).toMatch(/\.messages-empty h2,[\s\S]*\.empty-state h2[\s\S]*color:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.new-pod-button[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.empty-state\s+\.primary-action[\s\S]*background:\s*var\(--color-ink\)/);
  });

  it("converges financial and activity routes on the adaptive palette", () => {
    const css = designCss();
    expect(css).toMatch(/\.commit-nim-action[\s\S]*background:\s*var\(--activity-build\)/);
    expect(css).toMatch(/\.funding-total,[\s\S]*\.funding-state-card,[\s\S]*\.refund-state[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.funding-stage-rail\s+\.is-current\s*>\s*span[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.active-occurrence-card,[\s\S]*\.commitment-studio-visual[\s\S]*background:\s*var\(--theme-deep,\s*var\(--color-ink\)\)/);
    expect(css).toMatch(/\.public-profile-orbit\s+i[\s\S]*border-color:\s*var\(--activity-build\)/);
  });

  it("renders the creation templates as readable media cards", () => {
    const css = designCss();
    expect(css).toMatch(/\.adaptive-template-card[\s\S]*grid-template-columns:\s*96px\s+minmax\(0,\s*1fr\)\s+auto/);
    expect(css).toMatch(/\.adaptive-template-media[\s\S]*position:\s*relative[\s\S]*min-height:\s*108px/);
    expect(css).toMatch(/\.adaptive-template-media\s+img[\s\S]*object-fit:\s*cover/);
    expect(css).toMatch(/\.adaptive-template-copy\s+strong[\s\S]*font-size:\s*16px/);
  });

  it("uses circular abstract identity and an intentional settings sheet", () => {
    const css = designCss();
    expect(css).toMatch(/\.profile-avatar[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.profile-avatar-glyph[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.profile-settings-sheet[\s\S]*position:\s*fixed/);
    expect(css).toMatch(/\.public-profile-cover[\s\S]*min-height:\s*420px/);
  });
});
