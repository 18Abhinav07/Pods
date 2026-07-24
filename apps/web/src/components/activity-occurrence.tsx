"use client";

import type {
  BuildDeliverableType,
  ProofShareMode,
  SettlementMode,
  SubmissionState,
  TemplateEvidence,
  TemplateId
} from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { formatZonedMoment } from "../lib/format-moment";
import {
  BuildCommitmentEditor,
  BuildEditor,
  deliverableLabel
} from "./activity-editor/build-editor";
import {
  CreateCommitmentEditor,
  CreateEditor
} from "./activity-editor/create-editor";
import { FitnessEditor } from "./activity-editor/fitness-editor";
import { ProofControls } from "./activity-editor/proof-controls";
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

function statusPresentation(
  state: Exclude<SubmissionState, "draft">,
  perOccurrence: boolean
) {
  const rule = perOccurrence ? "locked commitment" : "frozen activity rule";
  const presentations = {
    reviewing: {
      eyebrow: "Creator review",
      heading: "Creator review in progress",
      detail: `The Pod creator is checking your proof against the ${rule}.`
    },
    approved: {
      eyebrow: "The Pod creator approved",
      heading: "Work approved",
      detail: "The Pod creator approved this proof. It counts toward your progress and streak."
    },
    rejected: {
      eyebrow: "Creator review complete",
      heading: "Not verified",
      detail: `The Pod creator did not verify this proof against the ${rule}.`
    },
    timeout_protected: {
      eyebrow: "Review timeout protection",
      heading: "Protected after review timeout",
      detail: "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak."
    }
  } satisfies Record<Exclude<SubmissionState, "draft">, {
    eyebrow: string;
    heading: string;
    detail: string;
  }>;
  return presentations[state];
}

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

function evidenceReadyForDraft(evidence: TemplateEvidence): boolean {
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
    return (
      evidence.resultSummary.trim().length >= 20 &&
      evidence.artifactUrl.startsWith("https://")
    );
  }
  return evidence.reflection.trim().length >= 12;
}

function evidenceReadyForSubmit(
  evidence: TemplateEvidence,
  hasImage: boolean
): boolean {
  if (!evidenceReadyForDraft(evidence)) return false;
  if (
    evidence.kind === "fitness" ||
    evidence.kind === "reading" ||
    evidence.kind === "study"
  ) {
    return hasImage;
  }
  if (evidence.kind === "create") {
    return hasImage || Boolean(evidence.artifactUrl?.startsWith("https://"));
  }
  return true;
}

async function responseBody(response: Response) {
  return response.json() as Promise<{
    error?: string;
    commitment?: ActivityCommitmentView;
    submission?: ActivitySubmissionView;
  }>;
}

function evidenceAnchor(templateId: TemplateId): string | undefined {
  if (templateId === "build") return "artifact-url";
  if (templateId === "create") return "create-artifact-url";
  return undefined;
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
    Boolean(props.submission?.evidenceObjectKey)
  );
  const evidenceForm = useRef<HTMLFormElement>(null);
  const draftSaveVersion = useRef(0);
  const autoSaveTimer = useRef<number | null>(null);
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

  const persistDraft = useCallback(async () => {
    const version = ++draftSaveVersion.current;
    setDraftState("saving");
    setError("");
    try {
      const response = await fetch(
        `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateEvidence: evidence, proofShareMode })
        }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.submission) {
        throw new Error(body.error ?? "Evidence draft could not be saved");
      }
      if (version === draftSaveVersion.current) {
        setSubmission(body.submission);
        setSavedEvidence(evidence);
        setSavedProofShareMode(proofShareMode);
        setDraftState("saved");
      }
      return body.submission;
    } catch (cause) {
      if (version === draftSaveVersion.current) {
        setDraftState("idle");
        setError(
          cause instanceof Error ? cause.message : "Evidence draft could not be saved"
        );
      }
      return null;
    }
  }, [evidence, proofShareMode, props.occurrenceId, props.podId]);

  useEffect(() => {
    if (
      (perOccurrence && !commitment) ||
      (submission && submission.state !== "draft") ||
      !dirty ||
      !evidenceReadyForDraft(evidence)
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

  async function uploadImage(file: File) {
    if (!evidenceReadyForDraft(evidence)) {
      evidenceForm.current?.reportValidity();
      setError("Complete the activity details before attaching an image.");
      return;
    }
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    const draft =
      !submission || submission.state !== "draft" || dirty
        ? await persistDraft()
        : submission;
    if (!draft || draft.state !== "draft") return;
    setError("");
    setUploadProgress(0);
    setUploadComplete(false);
    const form = new FormData();
    form.set("submissionId", draft.id);
    form.set("image", file);
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/evidence`
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(
          Math.min(99, Math.round((event.loaded / event.total) * 100))
        );
      }
    };
    request.onload = () => {
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
        router.refresh();
      } catch (cause) {
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
      setUploadProgress(null);
      setUploadComplete(false);
      setError("Image upload was interrupted. Your saved draft is still available.");
    };
    request.send(form);
  }

  async function submitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evidenceReadyForSubmit(evidence, uploadComplete)) {
      evidenceForm.current?.reportValidity();
      setError(
        imageRequired
          ? "Add the required evidence image before submitting."
          : "Complete the proof requirements before submitting."
      );
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
      router.refresh();
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

  const status = submission?.state;
  const presentation =
    status && status !== "draft"
      ? statusPresentation(status, perOccurrence)
      : null;
  const fullReturnAlpha = props.settlementMode === "full_refund_alpha";

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

      {submission && presentation ? (
        <section className={`submission-status-card is-${status}`}>
          <span>{presentation.eyebrow}</span>
          <h2>{presentation.heading}</h2>
          <p>{presentation.detail}</p>
          <Link
            className="primary-action full-action"
            href={`/pods/${props.podId}/submissions/${submission.id}`}
          >
            View submission
          </Link>
        </section>
      ) : perOccurrence && !commitment ? (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-contract-card is-guided-flow"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={lock}
        >
          <nav aria-label="Commitment progress" className="guided-flow-progress">
            <span aria-current="step"><i>1</i>Define</span>
            <span><i>2</i>Review</span>
            <span><i>3</i>Lock</span>
          </nav>
          {templateId === "create" ? (
            <CreateCommitmentEditor goal={goal} onGoal={setGoal} />
          ) : (
            <BuildCommitmentEditor
              allowedDeliverables={props.allowedDeliverables}
              deliverableType={deliverableType}
              onDeliverableType={setDeliverableType}
              onTask={setTask}
              task={task}
            />
          )}
          <aside className="activity-lock-disclosure">
            <strong>
              Lock by{" "}
              {props.commitmentDeadlineAt
                ? formatZonedMoment(props.commitmentDeadlineAt, {
                    timeZone: props.timeZone
                  })
                : "the commitment cutoff"}
            </strong>
            <p>
              Once locked, this {templateId === "create" ? "goal" : "task"} cannot
              be changed for this occurrence.
            </p>
          </aside>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-action full-action" disabled={busy} type="submit">
            {busy
              ? "Locking commitment"
              : templateId === "create"
                ? "Lock this goal"
                : "Lock this task"}
          </button>
        </motion.form>
      ) : (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className={`activity-evidence-card is-guided-flow template-${templateId}`}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={submitForReview}
          ref={evidenceForm}
        >
          <nav aria-label="Proof progress" className="guided-flow-progress">
            <span aria-current="step"><i>1</i>Activity</span>
            <span><i>2</i>Proof</span>
            <span><i>3</i>Submit</span>
          </nav>
          {commitment && perOccurrence ? (
            <div className="locked-task-panel">
              <span>
                Locked {templateId === "create" ? "goal" : "task"} · occurrence{" "}
                {props.occurrenceOrdinal}
              </span>
              <strong>{commitment.task}</strong>
              {templateId === "build" ? (
                <small>{deliverableLabel(commitment.deliverableType)}</small>
              ) : null}
            </div>
          ) : null}
          {renderEvidenceEditor()}
          <ProofControls
            {...(evidenceAnchor(templateId)
              ? { artifactAnchor: evidenceAnchor(templateId)! }
              : {})}
            imageRequired={imageRequired}
            onFile={(file) => void uploadImage(file)}
            onShareMode={setProofShareMode}
            proofShareMode={proofShareMode}
            publicVisitorSharingEnabled={Boolean(
              props.publicVisitorSharingEnabled
            )}
            uploadComplete={uploadComplete}
            uploadProgress={uploadProgress}
          />
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
          <button
            className="primary-action full-action"
            disabled={
              busy ||
              (uploadProgress !== null && !uploadComplete) ||
              !evidenceReadyForSubmit(evidence, uploadComplete)
            }
            type="submit"
          >
            {busy ? "Submitting evidence" : "Review and submit"}
          </button>
        </motion.form>
      )}
    </>
  );
}
