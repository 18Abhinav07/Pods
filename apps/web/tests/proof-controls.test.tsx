import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ProofAttachmentControls,
  ProofPrivacyControls
} from "../src/components/activity-editor/proof-controls";

describe("proof controls", () => {
  it("opens a real artifact-link editor from the Link action", () => {
    const onArtifactUrl = vi.fn();
    render(
      <ProofAttachmentControls
        artifactUrl=""
        imageRequired={false}
        onArtifactUrl={onArtifactUrl}
        onFile={vi.fn()}
        uploadComplete={false}
        uploadProgress={null}
      />
    );

    expect(screen.queryByLabelText("Public artifact URL")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add artifact link" }));
    fireEvent.change(screen.getByLabelText("Public artifact URL"), {
      target: { value: "https://github.com/example/pods/pull/42" }
    });

    expect(onArtifactUrl).toHaveBeenCalledWith(
      "https://github.com/example/pods/pull/42"
    );
  });

  it("renders a secured image preview with an explicit replace action", () => {
    render(
      <ProofAttachmentControls
        artifactUrl=""
        imagePreviewUrl="/api/pods/pod-1/submissions/submission-1/evidence"
        imageRequired
        onArtifactUrl={vi.fn()}
        onFile={vi.fn()}
        uploadComplete
        uploadProgress={100}
      />
    );

    expect(screen.getByAltText("Selected proof preview")).toHaveAttribute(
      "src",
      "/api/pods/pod-1/submissions/submission-1/evidence"
    );
    expect(screen.getByRole("button", { name: "Replace image" })).toBeVisible();
    expect(screen.getByText("Image secured")).toBeVisible();
  });

  it("explains that Practice and Create accepts either an image or a safe link", () => {
    render(
      <ProofAttachmentControls
        artifactMode="image_or_link"
        artifactUrl=""
        imageRequired={false}
        onArtifactUrl={vi.fn()}
        onFile={vi.fn()}
        uploadComplete={false}
        uploadProgress={null}
      />
    );

    expect(
      screen.getByText("Add a supporting image or a safe HTTPS link. One is required.")
    ).toBeVisible();
  });

  it("clears the file input so the same image can be selected again", () => {
    const onFile = vi.fn();
    render(
      <ProofAttachmentControls
        artifactUrl=""
        imageRequired
        onArtifactUrl={vi.fn()}
        onFile={onFile}
        uploadComplete={false}
        uploadProgress={null}
      />
    );
    const input = screen.getByLabelText("Choose evidence image");
    const file = new File(["proof"], "proof.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue("");
  });

  it("shows visibility as clean selectable rows without exposing public mode by default", () => {
    render(
      <ProofPrivacyControls
        onShareMode={vi.fn()}
        proofShareMode="reviewer_only"
        publicVisitorSharingEnabled={false}
      />
    );

    expect(screen.getByRole("radio", { name: /Creator only/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Share with Pod/i })).toBeVisible();
    expect(screen.queryByRole("radio", { name: /Share publicly/i }))
      .not.toBeInTheDocument();
  });
});
