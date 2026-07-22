import { describe, expect, it } from "vitest";

import { motion, palette, rounded, spacing, typography } from "../src/tokens";

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
});
