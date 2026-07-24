"use client";

import type { ProofShareMode } from "@pods/domain";
import { useRef, useState } from "react";

export function ProofControls({
  artifactAnchor,
  imageRequired,
  onFile,
  onShareMode,
  proofShareMode,
  publicVisitorSharingEnabled,
  uploadComplete,
  uploadProgress
}: {
  artifactAnchor?: string;
  imageRequired: boolean;
  onFile: (file: File) => void;
  onShareMode: (mode: ProofShareMode) => void;
  proofShareMode: ProofShareMode;
  publicVisitorSharingEnabled: boolean;
  uploadComplete: boolean;
  uploadProgress: number | null;
}) {
  const [open, setOpen] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  return (
    <div className="proof-add-studio">
      <div className="proof-add-heading">
        <div>
          <span>Evidence</span>
          <strong>{imageRequired ? "Add the required image" : "Add supporting proof"}</strong>
        </div>
        <button
          aria-expanded={open}
          aria-label="Add evidence"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? "Close" : "+ Add"}
        </button>
      </div>
      <fieldset className="proof-privacy-choice">
        <legend>Proof visibility</legend>
        <label className={proofShareMode === "reviewer_only" ? "is-selected" : ""}>
          <input
            checked={proofShareMode === "reviewer_only"}
            name="proof-share"
            onChange={() => onShareMode("reviewer_only")}
            type="radio"
          />
          <span>
            <strong>Creator only</strong>
            Private evidence for the decision
          </span>
        </label>
        <label className={proofShareMode === "pod_shared" ? "is-selected" : ""}>
          <input
            checked={proofShareMode === "pod_shared"}
            name="proof-share"
            onChange={() => onShareMode("pod_shared")}
            type="radio"
          />
          <span>
            <strong>Share with Pod</strong>
            Visible to the creator and locked roster
          </span>
        </label>
        {publicVisitorSharingEnabled ? (
          <label className={proofShareMode === "public" ? "is-selected" : ""}>
            <input
              checked={proofShareMode === "public"}
              name="proof-share"
              onChange={() => onShareMode("public")}
              type="radio"
            />
            <span>
              <strong>Share publicly</strong>
              Visible in the public read-only Pod room
            </span>
          </label>
        ) : null}
      </fieldset>
      {open ? (
        <div className="proof-action-sheet">
          <button onClick={() => cameraInput.current?.click()} type="button">
            <i>CAM</i>
            <span>Camera<strong>Capture now</strong></span>
          </button>
          <button onClick={() => imageInput.current?.click()} type="button">
            <i>IMG</i>
            <span>Image<strong>Choose a file</strong></span>
          </button>
          {artifactAnchor ? (
            <a href={`#${artifactAnchor}`}>
              <i>URL</i>
              <span>Link<strong>Published artifact</strong></span>
            </a>
          ) : (
            <span className="proof-action-placeholder" aria-hidden="true">
              <i>IMG</i>
              <span>Image<strong>Required</strong></span>
            </span>
          )}
        </div>
      ) : null}
      <input
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        aria-label="Capture evidence photo"
        capture="environment"
        className="proof-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
        ref={cameraInput}
        type="file"
      />
      <input
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        aria-label="Choose evidence image"
        className="proof-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
        ref={imageInput}
        type="file"
      />
      <p className="proof-lock-note">
        The visibility choice becomes immutable when you submit.
      </p>
      {uploadProgress !== null ? (
        <div className="upload-progress" aria-live="polite">
          <i style={{ width: `${uploadProgress}%` }} />
          <span>
            {uploadComplete
              ? "Image secured"
              : uploadProgress === 99
                ? "Securing image"
                : `Uploading ${uploadProgress}%`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
