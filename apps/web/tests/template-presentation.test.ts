import type { TemplateId } from "@pods/domain";
import { describe, expect, it } from "vitest";

import { adaptiveThemeForTemplate, mediaForTemplate } from "../src/lib/template-presentation";

describe("activity presentation", () => {
  it("gives every fixed template a distinct theme and hero visual", () => {
    const ids: TemplateId[] = ["build", "create", "fitness", "reading", "study"];
    expect(new Set(ids.map(adaptiveThemeForTemplate)).size).toBe(ids.length);
    expect(new Set(ids.map((id) => mediaForTemplate(id).hero)).size).toBe(ids.length);
  });

  it("varies hero art between Pods that share one template", () => {
    expect(mediaForTemplate("fitness", 0).hero)
      .not.toBe(mediaForTemplate("fitness", 1).hero);
  });

  it("uses the landing-page laptop artwork for Build and Ship", () => {
    const build = mediaForTemplate("build", 0);
    expect(build.hero).toBe("/media/build-workspace.jpg");
    expect(build.proof).toBe("/media/build-proof.jpg");
    expect(build.hero).not.toContain("pod-signal");
  });
});
