import { describe, expect, it } from "vitest";

import { motion, palette, typography } from "../src/tokens";

describe("Earned Momentum tokens", () => {
  it("keeps the approved core palette", () => {
    expect(palette.ink).toBe("#1f2348");
    expect(palette.action).toBe("#3b5ccc");
    expect(palette.paper).toBe("#f8f7f2");
    expect(palette.success).toBe("#18795c");
    expect(palette.nim).toBe("#d4a72c");
  });

  it("keeps the approved typography and motion scale", () => {
    expect(typography.sans).toBe("Mulish");
    expect(typography.mono).toBe("Fira Mono");
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
  });
});
