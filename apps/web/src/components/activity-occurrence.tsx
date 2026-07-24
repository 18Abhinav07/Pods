"use client";

import type {
  BuildDeliverableType,
  ProofShareMode,
  SettlementMode,
  TemplateEvidence,
  TemplateId
} from "@pods/domain";
import { validateTemplateEvidenceSubmission } from "@pods/domain";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { formatZonedMoment } from "../lib/format-moment";
import { BuildEditor, deliverableLabel } from "./activity-editor/build-editor";
import { CommitmentWizard } from "./activity-editor/commitment-wizard";
import { CreateEditor } from "./activity-editor/create-editor";
import { FitnessEditor } from "./activity-editor/fitness-editor";
import { FlowProgress } from "./activity-editor/flow-progress";
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

type Props = {
  templateId?: TemplateId;
  templateConfig?: Record<string, unknown>;
  podId: string;
  occurrenceId: string;
  podName: string;
  projectTheme: string;
  allowedDeliverables: readonly BuildDeliverableType[];
  occurrenceOrdinal: number;
  commitmentDeadlineAt: string | null;
  closesAt: string;
  stakeNim: number;
  settlementMode: SettlementMode;
  currentStreak: number;
  timeZone: string;
  commitment: ActivityCommitmentView | null;
  submission: ActivitySubmissionView | null;
  publicVisitorSharingEnabled?: boolean;
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

  useEffect(() => () => {
    uploadVersion.current += 1;
    uploadRequest.current?.abort();
    uploadRequest.current = null;
    if (objectPreviewUrl.current) {
      URL.revokeObjectURL(objectPreviewUrl.current);
      objectPreviewUrl.current = null;
    }
  }, []);

  async function lock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
              ? { goal }
              : { task, deliverableType }
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
    const form = new FormData();
    form.set("submissionId", draft.id);
    form.set("image", file);
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
        setUploadProgress(100);
        setUploadComplete(true);
        uploadRequest.current = null;
        router.refresh();
      } catch (cause) {
        uploadRequest.current = null;
        setUploadProgress(null);
        setUploadComplete(false);
        setError(
          cause instanceof Error
            ? cause.message
            : "Evidence image could not be uploaded"
        );
      }
    };
    request.onerror = () => {
      if (version !== uploadVersion.current || uploadRequest.current !== request) {
        return;
      }
      uploadRequest.current = null;
      setUploadProgress(null);
      setUploadComplete(false);
      setError("Image upload was interrupted. Your saved draft is still available.");
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
  const proofLabels = ["Activity", "Evidence", "Visibility", "Review"] as const;
  const visibilityLabel =
    proofShareMode === "reviewer_only"
      ? "Creator only"
      : proofShareMode === "pod_shared"
        ? "Share with Pod"
        : "Share publicly";

  return (
    <>
      <section className="activity-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {props.occurrenceOrdinal}</p>
        <h1>{props.podName}</h1>
        <p>{props.projectTheme}</p>
      </section>
      <section className="occurrence-context-grid entrance entrance-status">
        <div>
          <span>{fullReturnAlpha ? "Activity slice" : "At risk"}</span>
          <strong>{props.stakeNim} NIM</strong>
        </div>
        <div>
          <span>Current streak</span>
          <strong>{props.currentStreak} occurrences</strong>
        </div>
        <div>
          <span>Evidence closes</span>
          <strong>
            {formatZonedMoment(props.closesAt, { timeZone: props.timeZone })}
          </strong>
        </div>
      </section>
      {fullReturnAlpha ? (
        <p className="occurrence-consequence-note">
          Your full Testnet principal remains returnable.
        </p>
      ) : null}

      {submission && submission.state !== "draft" ? (
        <section className="submission-route-transition" role="status">
          <span className="submission-route-pulse" aria-hidden="true" />
          <p>Opening your live submission</p>
        </section>
      ) : perOccurrence && !commitment ? (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-contract-card is-guided-flow"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={lock}
        >
          <CommitmentWizard
            allowedDeliverables={props.allowedDeliverables}
            busy={busy}
            closesAt={props.commitmentDeadlineAt}
            deliverableType={deliverableType}
            goal={goal}
            onDeliverableType={setDeliverableType}
            onGoal={setGoal}
            onTask={setTask}
            projectTheme={props.projectTheme}
            task={task}
            templateId={templateId}
            timeZone={props.timeZone}
          />
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </motion.form>
      ) : (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className={`activity-evidence-card is-guided-flow template-${templateId}`}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={submitForReview}
          ref={evidenceForm}
        >
          <FlowProgress
            ariaLabel="Proof progress"
            labels={proofLabels}
            step={proofStep}
          />
          <motion.section
            animate={{ opacity: 1, x: 0 }}
            className="flow-stage proof-flow-stage"
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            key={proofStep}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {proofStep === 0 ? (
              <>
                {commitment && perOccurrence ? (
                  <div className="locked-task-panel">
                    <span>
                      Locked {templateId === "create" ? "goal" : "task"} ·
                      occurrence {props.occurrenceOrdinal}
                    </span>
                    <strong>{commitment.task}</strong>
                    {templateId === "build" ? (
                      <small>{deliverableLabel(commitment.deliverableType)}</small>
                    ) : null}
                  </div>
                ) : null}
                <header className="proof-stage-heading">
                  <span>Your result</span>
                  <h2>What did you finish?</h2>
                  <p>Keep it specific enough for the creator to make a fair decision.</p>
                </header>
                {renderEvidenceEditor()}
              </>
            ) : null}

            {proofStep === 1 ? (
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
                uploadComplete={uploadComplete}
                uploadProgress={uploadProgress}
              />
            ) : null}

            {proofStep === 2 ? (
              <>
                <header className="proof-stage-heading">
                  <span>Proof audience</span>
                  <h2>Choose the right visibility.</h2>
                  <p>Private evidence stays between you and the creator. Shared evidence becomes part of the Pod story.</p>
                </header>
                <ProofPrivacyControls
                  onShareMode={setProofShareMode}
                  proofShareMode={proofShareMode}
                  publicVisitorSharingEnabled={Boolean(
                    props.publicVisitorSharingEnabled
                  )}
                />
              </>
            ) : null}

            {proofStep === 3 ? (
              <>
                <header className="proof-stage-heading">
                  <span>Review</span>
                  <h2>Ready to submit?</h2>
                  <p>The proof and its visibility become immutable after submission.</p>
                </header>
                <div className="proof-review-summary">
                  <div><span>Activity</span><strong>{evidenceSummary(evidence)}</strong></div>
                  <div>
                    <span>Evidence</span>
                    <strong>
                      {uploadComplete && hasSafeArtifact
                        ? "Image and public link"
                        : uploadComplete
                          ? "Image"
                          : "Public link"}
                    </strong>
                  </div>
                  <div><span>Visibility</span><strong>{visibilityLabel}</strong></div>
                  <div><span>Reviewer</span><strong>Pod creator</strong></div>
                </div>
              </>
            ) : null}
          </motion.section>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <p
            className={`draft-saved-state is-${draftState}`}
            aria-live="polite"
          >
            {draftState === "saving"
              ? "Saving draft automatically"
              : draftState === "saved"
                ? "Draft saved automatically"
                : "Changes save automatically"}
          </p>
          <footer className="flow-action-dock">
            {proofStep > 0 ? (
              <button
                className="flow-back-action"
                onClick={() => setProofStep((current) => Math.max(0, current - 1))}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                Back
              </button>
            ) : <span />}
            {proofStep < 3 ? (
              <button
                className="flow-primary-action"
                disabled={
                  proofStep === 0
                    ? !detailsReadyForDraft(evidence)
                    : proofStep === 1
                      ? !attachmentReady ||
                        (uploadProgress !== null && !uploadComplete)
                      : false
                }
                onClick={(event) => {
                  event.preventDefault();
                  setProofStep((current) => Math.min(3, current + 1));
                }}
                type="button"
              >
                {proofStep === 0
                  ? "Continue to evidence"
                  : proofStep === 1
                    ? "Continue to visibility"
                    : "Review submission"}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            ) : (
              <button
                className="flow-primary-action"
                disabled={
                  busy ||
                  (uploadProgress !== null && !uploadComplete) ||
                  !evidenceValidation.success
                }
                type="submit"
              >
                {busy ? "Submitting" : "Submit to creator"}
                <Check aria-hidden="true" size={18} weight="bold" />
              </button>
            )}
          </footer>
        </motion.form>
      )}
    </>
  );
}
