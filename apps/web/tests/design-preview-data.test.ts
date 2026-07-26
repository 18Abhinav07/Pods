import { describe, expect, it } from "vitest";

import type { NativeMomentumPreviewPod } from "../src/components/design-preview/model";
import { mergePreviewPodsBySemanticIdentity } from "../src/lib/design-preview-data";

function pod(
  id: string,
  name: string,
  purpose: string
): NativeMomentumPreviewPod {
  return {
    id,
    name,
    purpose,
    templateId: "build",
    state: "active",
    stage: "live",
    totalNim: 0.3,
    occurrenceCount: 3,
    minParticipants: 2,
    maxParticipants: 5,
    visibility: "public",
    visitorsAllowed: true,
    source: id.startsWith("live") ? "live" : "fixture"
  };
}

describe("design preview data", () => {
  it("deduplicates fallback Pods by semantic identity instead of database id", () => {
    const merged = mergePreviewPodsBySemanticIdentity(
      [
        pod(
          "live-42",
          "Pods in Pods",
          "Build the accountability product in public."
        )
      ],
      [
        pod(
          "preview-pods-in-pods",
          " pods  in   pods ",
          "Build the accountability product in public."
        ),
        pod(
          "preview-night-run",
          "Night Run Club",
          "Complete three evening runs."
        )
      ]
    );

    expect(merged.map((candidate) => candidate.id)).toEqual([
      "live-42",
      "preview-night-run"
    ]);
  });
});
