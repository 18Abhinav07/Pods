"use client";

import {
  Camera,
  Check,
  ImageSquare,
  LinkSimple,
  LockSimple,
  UsersThree
} from "@phosphor-icons/react";
import type { ProofShareMode } from "@pods/domain";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import styles from "../activity-ritual/activity-ritual.module.css";

const acceptedImages =
  "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif";

export function ProofAttachmentControls({
  artifactError,
  artifactMode = "required",
  artifactUrl,
  imagePreviewUrl,
  imageRequired,
  onArtifactUrl,
  onFile,
  reviewerKind = "creator",
  uploadComplete,
  uploadProgress
}: {
  artifactError?: string | null;
  artifactMode?: "required" | "image_or_link";
  artifactUrl?: string | null;
  imagePreviewUrl?: string | null;
  imageRequired: boolean;
  onArtifactUrl?: (value: string) => void;
  onFile: (file: File) => void;
  reviewerKind?: "creator" | "pods_team";
  uploadComplete: boolean;
  uploadProgress: number | null;
}) {
  const artifactReviewer = reviewerKind === "pods_team"
    ? "Pods Team"
    : "creator";
  const [linkOpen, setLinkOpen] = useState(Boolean(artifactUrl));
  const cameraInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!linkOpen) return;
    const frame = window.requestAnimationFrame(() => linkInput.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [linkOpen]);

  function pickFile(input: HTMLInputElement | null) {
    input?.click();
  }

  function fileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) onFile(file);
  }

  return (
    <section className={styles.attachmentStudio}>
      <header className={styles.controlHeading}>
        <span>{imageRequired ? "Required evidence" : "Evidence options"}</span>
        <h3>{imageRequired ? "Add one clear image." : "Show the finished work."}</h3>
        <p>
          {imageRequired
            ? "Capture now or choose one clear image from this occurrence."
            : artifactMode === "image_or_link"
              ? "Add a supporting image or a safe HTTPS link. One is required."
              : "Add the matching public link. A supporting image is optional."}
        </p>
      </header>

      {imagePreviewUrl ? (
        <figure className={styles.proofPreview}>
          <Image
            alt="Selected proof preview"
            height={960}
            src={imagePreviewUrl}
            unoptimized
            width={960}
          />
          <figcaption>
            <span>
              {uploadComplete ? <Check aria-hidden="true" weight="bold" /> : null}
              {uploadComplete ? "Image secured" : "Image selected"}
            </span>
            <button onClick={() => pickFile(imageInput.current)} type="button">
              Replace image
            </button>
          </figcaption>
        </figure>
      ) : (
        <div className={styles.mediaActions}>
          <button
            aria-label="Open camera"
            onClick={() => pickFile(cameraInput.current)}
            type="button"
          >
            <Camera aria-hidden="true" size={23} weight="regular" />
            <span><strong>Camera</strong>Capture proof now</span>
          </button>
          <button
            aria-label="Choose image"
            onClick={() => pickFile(imageInput.current)}
            type="button"
          >
            <ImageSquare aria-hidden="true" size={23} weight="regular" />
            <span><strong>Image</strong>Choose from device</span>
          </button>
        </div>
      )}

      {onArtifactUrl ? (
        <div className={styles.linkControl}>
          {!linkOpen ? (
            <button
              aria-label="Add artifact link"
              className={styles.linkTrigger}
              onClick={() => setLinkOpen(true)}
              type="button"
            >
              <LinkSimple aria-hidden="true" size={22} />
              <span>
                <strong>Add artifact link</strong>
                GitHub, deployed work, or a safe HTTPS artifact
              </span>
            </button>
          ) : (
            <div className={styles.linkEditor}>
              <label htmlFor="proof-artifact-url">Public artifact URL</label>
              <div>
                <LinkSimple aria-hidden="true" size={20} />
                <input
                  aria-invalid={Boolean(artifactError)}
                  id="proof-artifact-url"
                  onChange={(event) => onArtifactUrl(event.target.value)}
                  placeholder="https://github.com/owner/repo/pull/42"
                  ref={linkInput}
                  type="url"
                  value={artifactUrl ?? ""}
                />
              </div>
              {artifactError ? (
                <p className={styles.linkError} role="alert">{artifactError}</p>
              ) : (
                <p>The {artifactReviewer} opens this exact link during review.</p>
              )}
            </div>
          )}
        </div>
      ) : null}

      <input
        accept={acceptedImages}
        aria-label="Capture evidence photo"
        capture="environment"
        className="proof-file-input"
        onChange={fileChange}
        ref={cameraInput}
        type="file"
      />
      <input
        accept={acceptedImages}
        aria-label="Choose evidence image"
        className="proof-file-input"
        onChange={fileChange}
        ref={imageInput}
        type="file"
      />

      {uploadProgress !== null && !uploadComplete ? (
        <div
          aria-live="polite"
          className={styles.uploadProgress}
          role="status"
        >
          <span
            aria-label="Image upload progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={uploadProgress}
            role="progressbar"
          >
            <i
              style={{
                transform: `scaleX(${uploadProgress / 100})`,
                transformOrigin: "left"
              }}
            />
          </span>
          <span>
            {uploadComplete
              ? "Image secured"
              : uploadProgress === 99
                ? "Securing image"
                : `Uploading ${uploadProgress}%`}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export function ProofPrivacyControls({
  onShareMode,
  proofShareMode,
  publicVisitorSharingEnabled,
  reviewerKind = "creator"
}: {
  onShareMode: (mode: ProofShareMode) => void;
  proofShareMode: ProofShareMode;
  publicVisitorSharingEnabled: boolean;
  reviewerKind?: "creator" | "pods_team";
}) {
  const reviewerTitle = reviewerKind === "pods_team"
    ? "Pods Team"
    : "Creator";
  const reviewerDetail = reviewerKind === "pods_team"
    ? "Private evidence for the Pods Team review"
    : "Private evidence for the creator's decision";
  const sharedDetail = reviewerKind === "pods_team"
    ? "Visible to the Pods Team and locked members"
    : "Visible to the creator and locked members";
  const choices: Array<{
    mode: ProofShareMode;
    title: string;
    detail: string;
    icon: typeof LockSimple;
  }> = [
    {
      mode: "reviewer_only",
      title: `${reviewerTitle} only`,
      detail: reviewerDetail,
      icon: LockSimple
    },
    {
      mode: "pod_shared",
      title: "Share with Pod",
      detail: sharedDetail,
      icon: UsersThree
    },
    ...(publicVisitorSharingEnabled
      ? [{
          mode: "public" as const,
          title: "Share publicly",
          detail: "Visible in this Pod's public read-only room",
          icon: LinkSimple
        }]
      : [])
  ];

  return (
    <fieldset className={styles.privacyChoices}>
      <legend>Who can see this proof?</legend>
      <p>Your visibility choice cannot change after submission.</p>
      {choices.map((choice) => {
        const Icon = choice.icon;
        return (
          <label
            data-selected={proofShareMode === choice.mode}
            key={choice.mode}
          >
            <input
              checked={proofShareMode === choice.mode}
              name="proof-share"
              onChange={() => onShareMode(choice.mode)}
              type="radio"
            />
            <Icon aria-hidden="true" size={22} weight="regular" />
            <span>
              <strong>{choice.title}</strong>
              {choice.detail}
            </span>
            <i aria-hidden="true">
              {proofShareMode === choice.mode
                ? <Check size={13} weight="bold" />
                : null}
            </i>
          </label>
        );
      })}
    </fieldset>
  );
}
