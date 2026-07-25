import { describe, expect, it } from "vitest";

import {
  cssVariables,
  motion,
  palette,
  rounded,
  spacing,
  typography
} from "../src";

describe("Living Momentum tokens", () => {
  it("uses the warm neutral shell without a legacy blue action", () => {
    expect(palette.ink).toBe("#20241f");
    expect(palette.paper).toBe("#faf9f4");
    expect(palette.surface).toBe("#fffdf8");
    expect(palette).not.toHaveProperty("action");
    expect(palette).not.toHaveProperty("actionSoft");
    expect(palette.success).toBe("#18795c");
  });

  it("defines a distinct visual identity for every activity template", () => {
    expect(palette.activities).toEqual({
      build: { accent: "#d9ed72", deep: "#252b24" },
      practice: { accent: "#efaa70", deep: "#3a2720" },
      fitness: { accent: "#fa7448", deep: "#12141c" },
      reading: { accent: "#aeb8f0", deep: "#34335a" },
      study: { accent: "#8fcfc1", deep: "#203a36" }
    });
  });

  it("keeps controls mobile safe and motion task focused", () => {
    expect(typography.sans).toBe("Mulish");
    expect(typography.mono).toBe("Fira Mono");
    expect(typography.controlSize).toBe(16);
    expect(rounded).toEqual({ control: 14, panel: 20, media: 28, pill: 999 });
    expect(spacing).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
    expect(motion).toEqual({
      immediate: 0,
      tactile: 140,
      state: 220,
      navigation: 240,
      ease: [0.16, 1, 0.3, 1]
    });
  });

  it("exports the canonical runtime CSS variables for every activity shell", () => {
    expect(cssVariables).toEqual({
      "--color-canvas": "#f3f1e9",
      "--color-paper": "#faf9f4",
      "--color-surface": "#fffdf8",
      "--color-soft": "#eeece4",
      "--color-ink": "#20241f",
      "--color-muted": "#686b64",
      "--color-line": "#dcddd5",
      "--color-success": "#18795c",
      "--color-success-soft": "#e5f2ed",
      "--color-warning": "#956400",
      "--color-warning-soft": "#f7efd9",
      "--color-danger": "#b42318",
      "--color-danger-soft": "#fae9e7",
      "--color-nim": "#d4a72c",
      "--font-sans": '"Mulish Variable", sans-serif',
      "--font-mono": "Fira Mono",
      "--motion-immediate": "0ms",
      "--motion-tactile": "140ms",
      "--motion-state": "220ms",
      "--motion-navigation": "240ms",
      "--ease-premium": "cubic-bezier(0.16, 1, 0.3, 1)",
      "--radius-control": "14px",
      "--radius-panel": "20px",
      "--radius-media": "28px",
      "--radius-pill": "999px",
      "--activity-build": "#d9ed72",
      "--activity-build-deep": "#252b24",
      "--activity-practice": "#efaa70",
      "--activity-practice-deep": "#3a2720",
      "--activity-fitness": "#fa7448",
      "--activity-fitness-deep": "#12141c",
      "--activity-reading": "#aeb8f0",
      "--activity-reading-deep": "#34335a",
      "--activity-study": "#8fcfc1",
      "--activity-study-deep": "#203a36"
    });
  });
});
