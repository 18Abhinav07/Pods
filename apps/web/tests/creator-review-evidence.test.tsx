import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatorReviewEvidence } from "../src/components/creator-review-evidence";

const podId = "430296c7-9554-43e6-9b43-bfd063391028";
const submissionId = "b5322c1c-4441-4f12-87ba-8fe6d68b20f5";

describe("CreatorReviewEvidence", () => {
  it("replaces a failed authenticated image with an accessible reviewable state", () => {
    const { container } = render(
      <CreatorReviewEvidence podId={podId} submissionId={submissionId} />
    );

    fireEvent.error(screen.getByRole("img", { name: "Creator-only evidence" }));

    expect(screen.queryByRole("img", { name: "Creator-only evidence" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Evidence unavailable");
    expect(screen.getByRole("status")).toHaveTextContent(
      "The proof details remain available for review."
    );
    expect(container.innerHTML).not.toContain("objectKey");
  });
});
