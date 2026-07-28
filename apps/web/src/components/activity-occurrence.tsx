"use client";

import type {
  BuildDeliverableType,
  ProofShareMode,
  SettlementMode,
  TemplateEvidence,
  TemplateId
} from "@pods/domain";
import { validateTemplateEvidenceSubmission } from "@pods/domain";
import {
  ArrowRight,
  CheckCircle
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { sha256Hex } from "../lib/file-sha256";
import { formatZonedMoment } from "../lib/format-moment";
import { BuildEditor, deliverableLabel } from "./activity-editor/build-editor";
import { CommitmentWizard } from "./activity-editor/commitment-wizard";
import { CreateEditor } from "./activity-editor/create-editor";
import { FitnessEditor } from "./activity-editor/fitness-editor";
import {
  ProofAttachmentControls,
  ProofPrivacyControls
} from "./activity-editor/proof-controls";
import { ReadingEditor } from "./activity-editor/reading-editor";
import { StudyEditor } from "./activity-editor/study-editor";
import type {
  ActivityCommitmentView,
  ActivitySubmissionView
} from "./activity-editor/types";
import { CommitmentEntry } from "./activity-ritual/commitment-entry";
import styles from "./activity-ritual/activity-ritual.module.css";
import { ProofWizard } from "./activity-ritual/proof-wizard";

type Props = {
  templateId?: TemplateId;
  templateConfig?: Record<string, unknown>;
  podId: string;
  occurrenceId: string;
  podName: string;
  projectTheme: string;
  allowedDeliverables: readonly BuildDeliverableType[];
  occurrenceOrdinal: number;
  opensAt?: string;
  initiallyOpen?: boolean;
  effectiveNowAt: string;
  commitmentDeadlineAt: string | null;
  closesAt: string;
  stakeNim: number;
  settlementMode: SettlementMode;
  currentStreak: number;
  timeZone: string;
  commitment: ActivityCommitmentView | null;
  submission: ActivitySubmissionView | null;
  publicVisitorSharingEnabled?: boolean;
  reviewerKind?: "creator" | "pods_team";
  recoveryOfSubmissionId?: string | null;
  proofReconciliationEnabled?: boolean;
};

function initialEvidence(
  templateId: TemplateId,
  configuration: Record<string, unknown>,
  submission: ActivitySubmissionView | null
): TemplateEvidence {
  if (submission?.templateEvidence?.kind === templateId) {
    return submission.templateEvidence;
  }
  if (templateId === "fitness") {
    return {
      kind: "fitness",
      activityType: String(configuration.activityType ?? ""),
      completionNote: submission?.resultSummary ?? ""
    };
  }
  if (templateId === "reading") {
    return {
      kind: "reading",
      title: "",
      amountCompleted: 0,
      unit: configuration.targetType === "minutes" ? "minutes" : "pages",
      note: submission?.resultSummary ?? ""
    };
  }
  if (templateId === "study") {
    return {
      kind: "study",
      topic: "",
      durationMinutes: 0,
      takeaway: submission?.resultSummary ?? ""
    };
  }
  if (templateId === "create") {
    return {
      kind: "create",
      reflection: submission?.resultSummary ?? "",
      artifactUrl: submission?.artifactUrl || null
    };
  }
  return {
    kind: "build",
    resultSummary: submission?.resultSummary ?? "",
    artifactUrl: submission?.artifactUrl ?? ""
  };
}

function detailsReadyForDraft(evidence: TemplateEvidence): boolean {
  if (evidence.kind === "fitness") {
    return evidence.completionNote.trim().length >= 4;
  }
  if (evidence.kind === "reading") {
    return evidence.title.trim().length > 0 && evidence.amountCompleted > 0;
  }
  if (evidence.kind === "study") {
    return (
      evidence.topic.trim().length > 0 &&
      evidence.durationMinutes > 0 &&
      evidence.takeaway.trim().length >= 4
    );
  }
  if (evidence.kind === "build") {
    return evidence.resultSummary.trim().length >= 20;
  }
  return evidence.reflection.trim().length >= 12;
}

function evidenceSummary(evidence: TemplateEvidence): string {
  if (evidence.kind === "fitness") return evidence.completionNote;
  if (evidence.kind === "reading") {
    return `${evidence.title} · ${evidence.amountCompleted} ${evidence.unit}`;
  }
  if (evidence.kind === "study") {
    return `${evidence.topic} · ${evidence.durationMinutes} minutes`;
  }
  if (evidence.kind === "create") return evidence.reflection;
  return evidence.resultSummary;
}

async function responseBody(response: Response) {
  return response.json() as Promise<{
    error?: string;
    commitment?: ActivityCommitmentView;
    submission?: ActivitySubmissionView;
  }>;
}

export function ActivityOccurrence(props: Props) {
  const templateId = props.templateId ?? "build";
  const configuration = props.templateConfig ?? {
    projectTheme: props.projectTheme,
    allowedDeliverables: props.allowedDeliverables
  };
  const perOccurrence = templateId === "build" || templateId === "create";
  const imageRequired =
    templateId === "fitness" ||
    templateId === "reading" ||
    templateId === "study";
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [commitment, setCommitment] = useState(props.commitment);
  const [submission, setSubmission] = useState(props.submission);
  const [commitmentView, setCommitmentView] = useState<
    "entry" | "wizard" | "success" | "proof"
  >(() => perOccurrence && !props.commitment ? "entry" : "proof");
  const [commitmentStep, setCommitmentStep] = useState(0);
  const [task, setTask] = useState("");
  const [goal, setGoal] = useState("");
  const [deliverableType, setDeliverableType] = useState<BuildDeliverableType>(
    props.allowedDeliverables[0] ?? "pull_request"
  );
  const [evidence, setEvidenceState] = useState<TemplateEvidence>(() =>
    initialEvidence(templateId, configuration, props.submission)
  );
  const [savedEvidence, setSavedEvidence] = useState(evidence);
  const [proofShareMode, setProofShareModeState] = useState<ProofShareMode>(
    props.submission?.proofShareMode ?? "reviewer_only"
  );
  const [savedProofShareMode, setSavedProofShareMode] = useState(proofShareMode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    props.submission?.state === "draft" ? "saved" : "idle"
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(
    Boolean(props.submission?.evidenceAvailable)
  );
  const [proofStep, setProofStep] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(() =>
    props.submission?.evidenceAvailable
      ? `/api/pods/${props.podId}/submissions/${props.submission.id}/evidence`
      : null
  );
  const evidenceForm = useRef<HTMLFormElement>(null);
  const objectPreviewUrl = useRef<string | null>(null);
  const confirmedEvidenceAvailable = useRef(
    Boolean(props.submission?.evidenceAvailable)
  );
  const confirmedPreviewUrl = useRef<string | null>(
    props.submission?.evidenceAvailable
      ? `/api/pods/${props.podId}/submissions/${props.submission.id}/evidence`
      : null
  );
  const draftSaveVersion = useRef(0);
  const draftSaveQueue = useRef<Promise<ActivitySubmissionView | null>>(
    Promise.resolve(null)
  );
  const autoSaveTimer = useRef<number | null>(null);
  const uploadRequest = useRef<XMLHttpRequest | null>(null);
  const uploadVersion = useRef(0);
  const dirty =
    JSON.stringify(evidence) !== JSON.stringify(savedEvidence) ||
    proofShareMode !== savedProofShareMode;
  const reviewerKind = props.reviewerKind ?? "creator";
  const reviewerLabel = reviewerKind === "pods_team"
    ? "Pods Team"
    : "Pod creator";

  function setEvidence(next: TemplateEvidence) {
    setEvidenceState(next);
    setDraftState("idle");
  }

  function setProofShareMode(next: ProofShareMode) {
    setProofShareModeState(next);
    setDraftState("idle");
  }

  function setArtifactUrl(value: string) {
    if (evidence.kind === "build") {
      setEvidence({ ...evidence, artifactUrl: value });
    } else if (evidence.kind === "create") {
      setEvidence({ ...evidence, artifactUrl: value || null });
    }
  }

  function selectImage(file: File) {
    if (!detailsReadyForDraft(evidence)) {
      evidenceForm.current?.reportValidity();
      setError("Complete the activity details before attaching an image.");
      return;
    }
    const version = ++uploadVersion.current;
    uploadRequest.current?.abort();
    uploadRequest.current = null;
    setError("");
    setUploadProgress(0);
    setUploadComplete(false);
    if (typeof URL.createObjectURL === "function") {
      if (objectPreviewUrl.current) URL.revokeObjectURL(objectPreviewUrl.current);
      const nextPreview = URL.createObjectURL(file);
      objectPreviewUrl.current = nextPreview;
      setImagePreviewUrl(nextPreview);
    }
    void uploadImage(file, version);
  }

  function revokeObjectPreview() {
    if (!objectPreviewUrl.current) return;
    URL.revokeObjectURL(objectPreviewUrl.current);
    objectPreviewUrl.current = null;
  }

  function rollbackImagePreview() {
    revokeObjectPreview();
    setImagePreviewUrl(confirmedPreviewUrl.current);
    setUploadProgress(null);
    setUploadComplete(confirmedEvidenceAvailable.current);
  }

  useEffect(() => () => {
    uploadVersion.current += 1;
    uploadRequest.current?.abort();
    uploadRequest.current = null;
    revokeObjectPreview();
  }, []);

  async function lock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (commitmentStep !== 2 || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/commitment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            templateId === "create"
              ? {
                  goal,
                  ...(props.recoveryOfSubmissionId
                    ? { recoveryOfSubmissionId: props.recoveryOfSubmissionId }
                    : {})
                }
              : {
                  task,
                  deliverableType,
                  ...(props.recoveryOfSubmissionId
                    ? { recoveryOfSubmissionId: props.recoveryOfSubmissionId }
                    : {})
                }
          )
        }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.commitment) {
        throw new Error(
          body.error ??
          (templateId === "create"
            ? "Output goal could not be locked"
            : "Task could not be locked")
        );
      }
      setCommitment(body.commitment);
      setCommitmentView("success");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Commitment could not be locked"
      );
    } finally {
      setBusy(false);
    }
  }

  const persistDraft = useCallback(() => {
    const version = ++draftSaveVersion.current;
    const evidenceSnapshot = evidence;
    const proofShareModeSnapshot = proofShareMode;
    setDraftState("saving");
    setError("");
    const save = async (): Promise<ActivitySubmissionView | null> => {
      try {
        const response = await fetch(
          `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/draft`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateEvidence: evidenceSnapshot,
              proofShareMode: proofShareModeSnapshot
            })
          }
        );
        const body = await responseBody(response);
        if (!response.ok || !body.submission) {
          throw new Error(body.error ?? "Evidence draft could not be saved");
        }
        if (version === draftSaveVersion.current) {
          setSubmission(body.submission);
          setSavedEvidence(evidenceSnapshot);
          setSavedProofShareMode(proofShareModeSnapshot);
          setDraftState("saved");
        }
        return body.submission;
      } catch (cause) {
        if (version === draftSaveVersion.current) {
          setDraftState("idle");
          setError(
            cause instanceof Error
              ? cause.message
              : "Evidence draft could not be saved"
          );
        }
        return null;
      }
    };
    const queued = draftSaveQueue.current.then(save, save);
    draftSaveQueue.current = queued;
    return queued;
  }, [evidence, proofShareMode, props.occurrenceId, props.podId]);

  useEffect(() => {
    if (
      (perOccurrence && !commitment) ||
      (submission && submission.state !== "draft") ||
      !dirty ||
      !detailsReadyForDraft(evidence)
    ) {
      return;
    }
    autoSaveTimer.current = window.setTimeout(() => {
      autoSaveTimer.current = null;
      void persistDraft();
    }, 900);
    return () => {
      if (autoSaveTimer.current !== null) {
        window.clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = null;
    };
  }, [
    commitment,
    dirty,
    evidence,
    perOccurrence,
    persistDraft,
    submission
  ]);

  async function uploadImage(file: File, version: number) {
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    const draft =
      !submission || submission.state !== "draft" || dirty
        ? await persistDraft()
        : submission;
    if (
      version !== uploadVersion.current ||
      !draft ||
      draft.state !== "draft"
    ) {
      return;
    }
    let reservationId: string | null = null;
    if (props.proofReconciliationEnabled) {
      try {
        const expectedMediaSha256 = await sha256Hex(await file.arrayBuffer());
        const reservationResponse = await fetch(
          `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/evidence-reservation`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId: draft.id, expectedMediaSha256 })
          }
        );
        const reservationBody = await reservationResponse.json() as {
          reservation?: { id: string };
          error?: string;
        };
        if (!reservationResponse.ok || !reservationBody.reservation) {
          throw new Error(
            reservationBody.error ?? "Evidence upload could not be reserved"
          );
        }
        reservationId = reservationBody.reservation.id;
      } catch (cause) {
        rollbackImagePreview();
        setError(
          `${cause instanceof Error
            ? cause.message
            : "Evidence upload could not be reserved"}. Choose the image again to retry.`
        );
        return;
      }
    }
    const form = new FormData();
    form.set("submissionId", draft.id);
    form.set("image", file);
    if (reservationId) form.set("reservationId", reservationId);
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/evidence`
    );
    uploadRequest.current = request;
    request.upload.onprogress = (event) => {
      if (version !== uploadVersion.current) return;
      if (event.lengthComputable) {
        setUploadProgress(
          Math.min(99, Math.round((event.loaded / event.total) * 100))
        );
      }
    };
    request.onload = () => {
      if (version !== uploadVersion.current || uploadRequest.current !== request) {
        return;
      }
      try {
        const body = JSON.parse(request.responseText) as {
          error?: string;
          submission?: ActivitySubmissionView;
        };
        if (
          request.status < 200 ||
          request.status >= 300 ||
          !body.submission
        ) {
          throw new Error(body.error ?? "Evidence image could not be uploaded");
        }
        setSubmission(body.submission);
        revokeObjectPreview();
        confirmedEvidenceAvailable.current = true;
        confirmedPreviewUrl.current =
          `/api/pods/${props.podId}/submissions/${body.submission.id}/evidence`;
        setImagePreviewUrl(confirmedPreviewUrl.current);
        setUploadProgress(100);
        setUploadComplete(true);
        uploadRequest.current = null;
        router.refresh();
      } catch (cause) {
        uploadRequest.current = null;
        rollbackImagePreview();
        setError(
          `${cause instanceof Error
            ? cause.message
            : "Evidence image could not be uploaded"}. Choose the image again to retry.`
        );
      }
    };
    request.onerror = () => {
      if (version !== uploadVersion.current || uploadRequest.current !== request) {
        return;
      }
      uploadRequest.current = null;
      rollbackImagePreview();
      setError(
        "Image upload was interrupted. Choose the image again to retry. Your saved draft is still available."
      );
    };
    request.send(form);
  }

  async function submitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (proofStep !== 3 || busy) return;
    if (
      uploadRequest.current ||
      (uploadProgress !== null && !uploadComplete)
    ) {
      setError("Wait for the current image upload to finish before submitting.");
      return;
    }
    if (!evidenceValidation.success) {
      evidenceForm.current?.reportValidity();
      setError(evidenceValidation.errors[0] ?? "Complete the proof requirements.");
      return;
    }
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    setBusy(true);
    setError("");
    try {
      const draft =
        !submission || submission.state !== "draft" || dirty
          ? await persistDraft()
          : submission;
      if (!draft || draft.state !== "draft") {
        throw new Error("Evidence draft could not be prepared");
      }
      const response = await fetch(
        `/api/pods/${props.podId}/submissions/${draft.id}/submit`,
        { method: "POST" }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.submission) {
        throw new Error(body.error ?? "Evidence could not be submitted");
      }
      setSubmission(body.submission);
      router.replace(
        `/pods/${props.podId}/submissions/${body.submission.id}`
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Evidence could not be submitted"
      );
    } finally {
      setBusy(false);
    }
  }

  function renderEvidenceEditor() {
    if (evidence.kind === "fitness") {
      return (
        <FitnessEditor
          configuration={configuration}
          evidence={evidence}
          onChange={setEvidence}
        />
      );
    }
    if (evidence.kind === "reading") {
      return (
        <ReadingEditor
          configuration={configuration}
          evidence={evidence}
          onChange={setEvidence}
        />
      );
    }
    if (evidence.kind === "study") {
      return (
        <StudyEditor
          configuration={configuration}
          evidence={evidence}
          onChange={setEvidence}
        />
      );
    }
    if (evidence.kind === "create") {
      return (
        <CreateEditor
          configuration={configuration}
          evidence={evidence}
          onChange={setEvidence}
        />
      );
    }
    return (
      <BuildEditor
        configuration={configuration}
        evidence={evidence}
        onChange={setEvidence}
      />
    );
  }

  const fullReturnAlpha = props.settlementMode === "full_refund_alpha";
  const artifactUrl =
    evidence.kind === "build" || evidence.kind === "create"
      ? evidence.artifactUrl ?? ""
      : "";
  const evidenceValidation = validateTemplateEvidenceSubmission({
    templateId,
    evidence,
    frozenConfig: configuration,
    hasEvidenceImage: uploadComplete,
    ...(evidence.kind === "build" && commitment?.deliverableType
      ? { deliverableType: commitment.deliverableType }
      : {})
  });
  const hasSafeArtifact =
    evidence.kind === "build"
      ? evidenceValidation.success
      : artifactUrl.startsWith("https://");
  const artifactError =
    artifactUrl && !evidenceValidation.success
      ? evidenceValidation.errors.find((message) =>
          /artifact|GitHub|HTTPS|URL/.test(message)
        ) ?? null
      : null;
  const attachmentReady = imageRequired
    ? uploadComplete
    : evidence.kind === "build"
      ? evidenceValidation.success
      : evidence.kind === "create"
        ? evidenceValidation.success
        : true;
  const visibilityLabel =
    proofShareMode === "reviewer_only"
      ? reviewerKind === "pods_team"
        ? "Pods Team only"
        : "Creator only"
      : proofShareMode === "pod_shared"
        ? "Share with Pod"
        : "Share publicly";

  if (perOccurrence && commitmentView !== "proof") {
    if (commitmentView === "entry") {
      return (
        <CommitmentEntry
          closesAt={props.closesAt}
          commitmentDeadlineAt={props.commitmentDeadlineAt ?? props.closesAt}
          currentStreak={props.currentStreak}
          effectiveNowAt={props.effectiveNowAt}
          fullReturnAlpha={fullReturnAlpha}
          initiallyOpen={props.initiallyOpen ?? true}
          onStart={() => setCommitmentView("wizard")}
          opensAt={props.opensAt ?? props.closesAt}
          projectTheme={props.projectTheme}
          reviewerKind={reviewerKind}
          stakeNim={props.stakeNim}
          templateId={templateId}
          timeZone={props.timeZone}
        />
      );
    }

    if (commitmentView === "success" && commitment) {
      return (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          className={styles.commitmentSuccess}
          data-template={templateId}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          transition={{
            duration: reduceMotion ? 0 : 0.24,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <span aria-hidden="true" className={styles.successMark}>
            <CheckCircle size={34} weight="fill" />
          </span>
          <p className={styles.signalKicker}>Finish line secured</p>
          <h2>Commitment locked.</h2>
          <p className={styles.successCommitment}>{commitment.task}</p>
          <p className={styles.successCopy}>
            Your finish line is visible in the room. Return with the proof
            before {formatZonedMoment(props.closesAt, {
              timeZone: props.timeZone
            })}.
          </p>
          <div className={styles.successActions}>
            <button
              className={styles.primaryAction}
              onClick={() => setCommitmentView("proof")}
              type="button"
            >
              <span>Continue to proof</span>
              <span aria-hidden="true" className={styles.actionIcon}>
                <ArrowRight size={18} weight="bold" />
              </span>
            </button>
            <Link
              className={styles.roomLink}
              href={`/pods/${props.podId}/room`}
            >
              Open Pod room
            </Link>
          </div>
        </motion.section>
      );
    }

    return (
      <motion.form
        animate={{ opacity: 1, y: 0 }}
        className={styles.commitmentForm}
        data-template={templateId}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        onSubmit={lock}
      >
        <CommitmentWizard
          allowedDeliverables={props.allowedDeliverables}
          busy={busy}
          closesAt={props.closesAt}
          deliverableType={deliverableType}
          fullReturnAlpha={fullReturnAlpha}
          goal={goal}
          occurrenceOrdinal={props.occurrenceOrdinal}
          onDeliverableType={setDeliverableType}
          onGoal={setGoal}
          onStep={setCommitmentStep}
          onTask={setTask}
          projectTheme={props.projectTheme}
          reviewerKind={reviewerKind}
          stakeNim={props.stakeNim}
          step={commitmentStep}
          task={task}
          templateId={templateId}
          timeZone={props.timeZone}
        />
        {error ? (
          <p className={styles.formError} role="alert">{error}</p>
        ) : null}
      </motion.form>
    );
  }

  return (
    <>
      {submission && submission.state !== "draft" ? (
        <section className={styles.routeTransition} role="status">
          <span aria-hidden="true" />
          <p>Opening your live submission</p>
        </section>
      ) : (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className={styles.proofForm}
          data-template={templateId}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={submitForReview}
          ref={evidenceForm}
        >
          <ProofWizard
            busy={busy}
            canContinueEvidence={
              attachmentReady &&
              !(uploadProgress !== null && !uploadComplete)
            }
            canContinueResult={detailsReadyForDraft(evidence)}
            canSubmit={
              !(uploadProgress !== null && !uploadComplete) &&
              evidenceValidation.success
            }
            deliverable={
              templateId === "build" && commitment
                ? deliverableLabel(commitment.deliverableType)
                : null
            }
            draftState={draftState}
            error={error}
            evidenceControls={
              <ProofAttachmentControls
                {...(evidence.kind === "build" || evidence.kind === "create"
                  ? {
                      artifactUrl,
                      onArtifactUrl: setArtifactUrl
                    }
                  : {})}
                imagePreviewUrl={imagePreviewUrl}
                imageRequired={imageRequired}
                artifactError={artifactError}
                artifactMode={evidence.kind === "create" ? "image_or_link" : "required"}
                onFile={selectImage}
                reviewerKind={reviewerKind}
                uploadComplete={uploadComplete}
                uploadProgress={uploadProgress}
              />
            }
            lockedTask={commitment?.task ?? null}
            occurrenceOrdinal={props.occurrenceOrdinal}
            onStep={setProofStep}
            privacyControls={
              <ProofPrivacyControls
                onShareMode={setProofShareMode}
                proofShareMode={proofShareMode}
                publicVisitorSharingEnabled={Boolean(
                  props.publicVisitorSharingEnabled
                )}
                reviewerKind={reviewerKind}
              />
            }
            resultEditor={renderEvidenceEditor()}
            reviewRows={[
              { label: "Activity", value: evidenceSummary(evidence) },
              {
                label: "Evidence",
                value:
                  uploadComplete && hasSafeArtifact
                    ? "Image and public link"
                    : uploadComplete
                      ? "Image"
                      : "Public link"
              },
              { label: "Visibility", value: visibilityLabel },
              { label: "Reviewer", value: reviewerLabel }
            ]}
            reviewerKind={reviewerKind}
            step={proofStep}
            templateId={templateId}
          />
        </motion.form>
      )}
    </>
  );
}
