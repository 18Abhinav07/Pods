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

  it("defines one neutral authenticated shell with restrained activity accents", () => {
    const css = designCss().toLowerCase();
    expect(css).toContain("--color-ink: #20241f");
    expect(css).toContain("--color-paper: #faf9f4");
    expect(css).toContain("--activity-neutral: #dce4cf");
    expect(css).toContain("--activity-fitness: #fa7448");
    expect(css).toContain("--activity-reading: #aeb8f0");
    expect(css).toMatch(/\.theme-momentum,[\s\S]*\.theme-build\s*\{[\s\S]*--theme-accent:\s*var\(--activity-neutral\)/);
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

  it("treats every Pod room as grouped mobile conversation instead of a card feed", () => {
    const css = designCss();
    expect(css).toMatch(/\.room-message-cluster[\s\S]*grid-template-columns:\s*32px\s+minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.room-entry-member_message[\s\S]*width:\s*fit-content[\s\S]*max-width:\s*84%/);
    expect(css).toMatch(/\.room-entry-member_message\.is-viewer[\s\S]*align-self:\s*flex-end/);
    expect(css).toMatch(/\.room-entry-member_message\.is-consecutive[\s\S]*margin-top:/);
    expect(css).toMatch(/\.room-entry-member_message\.is-group-end[\s\S]*margin-bottom:/);
    expect(css).toMatch(/\.room-activity-main[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+96px/);
    expect(css).toMatch(/\.room-proof-image[\s\S]*width:\s*96px[\s\S]*height:\s*96px/);
    expect(css).toMatch(/\.room-activity-card h3[\s\S]*font-size:\s*18px/);
  });

  it("uses a restrained green send state and inset quoted replies without stripe decoration", () => {
    const css = designCss();
    expect(css).toMatch(/\.composer-send\.is-ready\s*\{[\s\S]*color:\s*var\(--color-surface\)[\s\S]*background:\s*var\(--color-success\)/);
    expect(css).toMatch(/\.message-reply-preview\s*\{[\s\S]*border:\s*1px solid/);
    expect(css).not.toMatch(/\.message-reply-preview\s*\{[\s\S]*border-left:\s*3px/);
    expect(css).toMatch(/\.room-entry\.is-reply-target\s*\{[\s\S]*background:/);
    expect(css).toMatch(/\.room-entry-member_message\.is-viewer\s+\.message-reply-preview\s*\{/);
  });

  it("anchors a restrained compact navigation directly to the safe area", () => {
    const css = designCss();
    const navRules = [...css.matchAll(/\.social-bottom-nav\s*\{([^}]*)\}/g)];
    const activeRules = [...css.matchAll(/\.social-bottom-nav\s+a\[aria-current="page"\]\s*\{([^}]*)\}/g)];
    expect(navRules.at(-1)?.[1]).toContain("bottom: 0");
    expect(navRules.at(-1)?.[1]).toContain("min-height: 64px");
    expect(activeRules.at(-1)?.[1]).toContain("background: transparent");
  });

  it("anchors both Pod and direct-message composers to the full bottom edge", () => {
    const css = designCss();
    const composerRules = [...css.matchAll(/\.room-composer,\s*\n\.pod-room-panel\.is-direct \.room-composer\s*\{([^}]*)\}/g)];
    const finalRule = composerRules.at(-1)?.[1] ?? "";

    expect(finalRule).toContain("right: 0");
    expect(finalRule).toContain("bottom: 0");
    expect(finalRule).toContain("left: 0");
    expect(finalRule).toContain("margin: 0 auto");
    expect(finalRule).toContain("transform: none");
  });

  it("removes legacy glass and link styling from first-run and empty states", () => {
    const css = designCss();
    expect(css).toMatch(/\.onboarding-step\s*\{[\s\S]*background:\s*transparent/);
    expect(css).toMatch(/\.onboarding-step\s*\{[\s\S]*box-shadow:\s*none/);
    expect(css).toMatch(/\.messages-empty h2,[\s\S]*\.empty-state h2[\s\S]*color:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.new-pod-button[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.empty-state\s+\.primary-action[\s\S]*background:\s*var\(--color-ink\)/);
  });

  it("keeps financial routes authoritative without decorative authenticated-page orbits", () => {
    const css = designCss();
    expect(css).toMatch(/\.commit-nim-action[\s\S]*background:\s*var\(--color-success\)/);
    expect(css).toMatch(/\.funding-total,[\s\S]*\.funding-state-card,[\s\S]*\.refund-state[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.funding-stage-rail\s+\.is-current\s*>\s*span[\s\S]*background:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.active-occurrence-card,[\s\S]*\.commitment-studio-visual[\s\S]*background:\s*var\(--theme-deep,\s*var\(--color-ink\)\)/);
    expect(css).toMatch(/\.public-profile-orbit,[\s\S]*\.message-orbit,[\s\S]*\.funding-orbit[\s\S]*display:\s*none/);
  });

  it("renders the creation templates as readable media cards", () => {
    const css = designCss();
    expect(css).toMatch(/\.adaptive-template-card[\s\S]*grid-template-columns:\s*96px\s+minmax\(0,\s*1fr\)\s+auto/);
    expect(css).toMatch(/\.adaptive-template-media[\s\S]*position:\s*relative[\s\S]*min-height:\s*108px/);
    expect(css).toMatch(/\.adaptive-template-media\s+img[\s\S]*object-fit:\s*cover/);
    expect(css).toMatch(/\.adaptive-template-copy\s+strong[\s\S]*font-size:\s*16px/);
  });

  it("uses compact human identity and an intentional settings sheet", () => {
    const css = designCss();
    expect(css).toMatch(/\.profile-avatar[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.profile-avatar-glyph[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.profile-settings-sheet[\s\S]*position:\s*fixed/);
    expect(css).toMatch(/\.private-profile-cover[\s\S]*min-height:\s*0/);
    expect(css).toMatch(/\.private-profile-cover[\s\S]*grid-template-columns:\s*88px\s+minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.public-profile-cover[\s\S]*min-height:\s*0/);
  });

  it("renders Discover as safe-gutter compact rows rather than full-bleed posters", () => {
    const css = designCss();
    expect(css).toMatch(/\.discover-stage-filter[\s\S]*border-bottom:\s*1px solid var\(--color-line\)/);
    expect(css).toMatch(/\.discover-stage-filter a[\s\S]*text-decoration:\s*none/);
    expect(css).toMatch(/\.discover-stage-filter a\[aria-current="page"\][\s\S]*color:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.template-filter-shell[\s\S]*padding-inline:\s*var\(--page-gutter\)/);
    expect(css).toMatch(/\.adaptive-pod-card[\s\S]*grid-template-columns:\s*76px\s+minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.adaptive-pod-media[\s\S]*min-height:\s*76px[\s\S]*border-radius:\s*20px/);
    expect(css).toMatch(/\.adaptive-card-hit-area[\s\S]*position:\s*absolute[\s\S]*inset:\s*0/);
    expect(css).toMatch(/\.adaptive-pod-type[\s\S]*position:\s*absolute[\s\S]*right:\s*0[\s\S]*bottom:\s*8px/);
    expect(css).not.toMatch(/\.discover-apply-orb/);
  });

  it("renders the public visitor room as a full-height editorial conversation", () => {
    const css = designCss();
    expect(css).toMatch(/\.public-room-shell[\s\S]*min-height:\s*100svh/);
    expect(css).toMatch(/\.public-room-cover[\s\S]*position:\s*relative[\s\S]*aspect-ratio:\s*16\s*\/\s*10/);
    expect(css).toMatch(/\.public-room-stream[\s\S]*display:\s*flex[\s\S]*flex-direction:\s*column/);
    expect(css).toMatch(/\.public-room-entry\.is-member_message[\s\S]*max-width:\s*84%/);
    expect(css).toMatch(/\.visitor-composer-boundary[\s\S]*position:\s*sticky[\s\S]*bottom:\s*0/);
  });
});
