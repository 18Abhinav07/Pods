"use client";

import type {
  BuildDeliverableType,
  ProofShareMode,
  SettlementMode,
  SubmissionState
} from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { formatZonedMoment } from "../lib/format-moment";

type CommitmentView = {
  id: string;
  task: string;
  deliverableType: BuildDeliverableType;
  lockedAt: string;
};

type SubmissionView = {
  id: string;
  state: SubmissionState;
  resultSummary: string;
  artifactUrl: string;
  evidenceObjectKey: string | null;
  proofShareMode: ProofShareMode;
};

type Props = {
  podId: string;
  occurrenceId: string;
  podName: string;
  projectTheme: string;
  allowedDeliverables: readonly BuildDeliverableType[];
  occurrenceOrdinal: number;
  commitmentDeadlineAt: string;
  closesAt: string;
  stakeNim: number;
  settlementMode: SettlementMode;
  currentStreak: number;
  timeZone: string;
  commitment: CommitmentView | null;
  submission: SubmissionView | null;
  publicVisitorSharingEnabled?: boolean;
};

function deliverableLabel(value: BuildDeliverableType) {
  const labels: Record<BuildDeliverableType, string> = {
    pull_request: "GitHub pull request",
    commit: "GitHub commit",
    issue: "GitHub issue",
    live_artifact: "Live artifact"
  };
  return labels[value];
}

function statusPresentation(state: Exclude<SubmissionState, "draft">) {
  const presentations = {
    reviewing: {
      eyebrow: "Creator review",
      heading: "Creator review in progress",
      detail: "The Pod creator is checking your proof against the locked commitment."
    },
    approved: {
      eyebrow: "The Pod creator approved",
      heading: "Work approved",
      detail: "The Pod creator approved this proof. It counts toward your progress and streak."
    },
    rejected: {
      eyebrow: "Creator review complete",
      heading: "Not verified",
      detail: "The Pod creator did not verify this proof against the locked commitment."
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

async function responseBody(response: Response) {
  return response.json() as Promise<{ error?: string; commitment?: CommitmentView; submission?: SubmissionView }>;
}

export function ActivityOccurrence(props: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [commitment, setCommitment] = useState(props.commitment);
  const [submission, setSubmission] = useState(props.submission);
  const [task, setTask] = useState("");
  const [deliverableType, setDeliverableType] = useState<BuildDeliverableType>(
    props.allowedDeliverables[0] ?? "pull_request"
  );
  const [resultSummary, setResultSummary] = useState(props.submission?.resultSummary ?? "");
  const [artifactUrl, setArtifactUrl] = useState(props.submission?.artifactUrl ?? "");
  const [savedValues, setSavedValues] = useState({
    resultSummary: props.submission?.resultSummary ?? "",
    artifactUrl: props.submission?.artifactUrl ?? "",
    proofShareMode: props.submission?.proofShareMode ?? "reviewer_only"
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    props.submission?.state === "draft" ? "saved" : "idle"
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(
    Boolean(props.submission?.evidenceObjectKey)
  );
  const [proofShareMode, setProofShareMode] = useState<ProofShareMode>(
    props.submission?.proofShareMode ?? "reviewer_only"
  );
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const evidenceForm = useRef<HTMLFormElement>(null);
  const draftSaveVersion = useRef(0);
  const autoSaveTimer = useRef<number | null>(null);
  const dirty =
    resultSummary !== savedValues.resultSummary ||
    artifactUrl !== savedValues.artifactUrl ||
    proofShareMode !== savedValues.proofShareMode;

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
          body: JSON.stringify({ task, deliverableType })
        }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.commitment) {
        throw new Error(body.error ?? "Task could not be locked");
      }
      setCommitment(body.commitment);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task could not be locked");
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
          body: JSON.stringify({ resultSummary, artifactUrl, proofShareMode })
        }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.submission) {
        throw new Error(body.error ?? "Evidence draft could not be saved");
      }
      if (version === draftSaveVersion.current) {
        setSubmission(body.submission);
        setSavedValues({ resultSummary, artifactUrl, proofShareMode });
        setDraftState("saved");
      }
      return body.submission;
    } catch (cause) {
      if (version === draftSaveVersion.current) {
        setDraftState("idle");
        setError(cause instanceof Error ? cause.message : "Evidence draft could not be saved");
      }
      return null;
    }
  }, [artifactUrl, proofShareMode, props.occurrenceId, props.podId, resultSummary]);

  useEffect(() => {
    if (!commitment || (submission && submission.state !== "draft") || !dirty) return;
    if (resultSummary.trim().length < 20 || !artifactUrl.startsWith("https://")) return;
    autoSaveTimer.current = window.setTimeout(() => {
      autoSaveTimer.current = null;
      void persistDraft();
    }, 900);
    return () => {
      if (autoSaveTimer.current !== null) window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    };
  }, [artifactUrl, commitment, dirty, persistDraft, resultSummary, submission]);

  async function uploadImage(file: File) {
    if (resultSummary.trim().length < 20 || !artifactUrl.startsWith("https://")) {
      evidenceForm.current?.reportValidity();
      setError("Add a result summary and public artifact before attaching creator-only evidence.");
      return;
    }
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    const draft = !submission || submission.state !== "draft" || dirty
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
        setUploadProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      try {
        const body = JSON.parse(request.responseText) as {
          error?: string;
          submission?: SubmissionView;
        };
        if (request.status < 200 || request.status >= 300 || !body.submission) {
          throw new Error(body.error ?? "Evidence image could not be uploaded");
        }
        setSubmission(body.submission);
        setUploadProgress(100);
        setUploadComplete(true);
        router.refresh();
      } catch (cause) {
        setUploadProgress(null);
        setUploadComplete(false);
        setError(cause instanceof Error ? cause.message : "Evidence image could not be uploaded");
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
    if (resultSummary.trim().length < 20 || !artifactUrl.startsWith("https://")) {
      evidenceForm.current?.reportValidity();
      setError("Add a complete result summary and public artifact before submitting.");
      return;
    }
    if (autoSaveTimer.current !== null) {
      window.clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    setBusy(true);
    setError("");
    try {
      const draft = !submission || submission.state !== "draft" || dirty
        ? await persistDraft()
        : submission;
      if (!draft || draft.state !== "draft") throw new Error("Evidence draft could not be prepared");
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
      setError(cause instanceof Error ? cause.message : "Evidence could not be submitted");
    } finally {
      setBusy(false);
    }
  }

  const status = submission?.state;
  const fullReturnAlpha = props.settlementMode === "full_refund_alpha";
  const presentation = status && status !== "draft"
    ? statusPresentation(status)
    : null;
  return (
    <>
      <section className="activity-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {props.occurrenceOrdinal}</p>
        <h1>{props.podName}</h1>
        <p>{props.projectTheme}</p>
      </section>
      <section className="occurrence-context-grid entrance entrance-status">
        <div><span>{fullReturnAlpha ? "Activity slice" : "At risk"}</span><strong>{props.stakeNim} NIM</strong></div>
        <div><span>Current streak</span><strong>{props.currentStreak} occurrences</strong></div>
        <div><span>Evidence closes</span><strong>{formatZonedMoment(props.closesAt, { timeZone: props.timeZone })}</strong></div>
      </section>
      {fullReturnAlpha ? <p className="occurrence-consequence-note">Your full Testnet principal remains returnable.</p> : null}

      {!commitment ? (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-contract-card is-guided-flow"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={lock}
        >
          <nav aria-label="Commitment progress" className="guided-flow-progress">
            <span aria-current="step"><i>1</i>Define</span>
            <span><i>2</i>Choose proof</span>
            <span><i>3</i>Lock</span>
          </nav>
          <div className="activity-card-heading"><span>Today&apos;s commitment</span><h2>What will be finished?</h2><p>Write one outcome another person can verify.</p></div>
          <label htmlFor="occurrence-task">Today&apos;s task</label>
          <textarea
            id="occurrence-task"
            maxLength={240}
            minLength={12}
            onChange={(event) => setTask(event.target.value)}
            placeholder="Ship the mobile evidence capture and review states."
            required
            rows={4}
            value={task}
          />
          <fieldset className="deliverable-choice-grid"><legend>Visible deliverable</legend>{props.allowedDeliverables.map((value) => (
            <label className={deliverableType === value ? "is-selected" : ""} key={value}><input checked={deliverableType === value} name="deliverable" onChange={() => setDeliverableType(value)} type="radio" value={value} /><span>{deliverableLabel(value)}</span><i aria-hidden="true">{value === "pull_request" ? "PR" : value === "live_artifact" ? "LIVE" : value === "commit" ? "COMMIT" : "ISSUE"}</i></label>
          ))}</fieldset>
          <aside className="activity-lock-disclosure">
            <strong>Locked by {formatZonedMoment(props.commitmentDeadlineAt, { timeZone: props.timeZone })}</strong>
            <p>Once locked, this task cannot be changed for this occurrence.</p>
          </aside>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-action full-action" disabled={busy} type="submit">
            {busy ? "Locking task" : "Lock this task"}
          </button>
        </motion.form>
      ) : submission && presentation ? (
        <section className={`submission-status-card is-${status}`}>
          <span>{presentation.eyebrow}</span>
          <h2>{presentation.heading}</h2>
          <p>{presentation.detail}</p>
          <Link className="primary-action full-action" href={`/pods/${props.podId}/submissions/${submission.id}`}>View submission</Link>
        </section>
      ) : (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-evidence-card is-guided-flow"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={submitForReview}
          ref={evidenceForm}
        >
          <nav aria-label="Proof progress" className="guided-flow-progress">
            <span aria-current="step"><i>1</i>Result</span>
            <span><i>2</i>Evidence</span>
            <span><i>3</i>Submit</span>
          </nav>
          <div className="locked-task-panel"><span>Locked task · occurrence {props.occurrenceOrdinal}</span><strong>{commitment.task}</strong><small>{deliverableLabel(commitment.deliverableType)}</small></div>
          <label htmlFor="result-summary">Result summary</label>
          <textarea
            id="result-summary"
            maxLength={1200}
            minLength={20}
            onChange={(event) => { setResultSummary(event.target.value); setDraftState("idle"); }}
            placeholder="Describe what changed and what the Pod creator can verify."
            required
            rows={5}
            value={resultSummary}
          />
          <label htmlFor="artifact-url">Public artifact URL</label>
          <input
            id="artifact-url"
            onChange={(event) => { setArtifactUrl(event.target.value); setDraftState("idle"); }}
            placeholder="https://github.com/owner/repo/pull/42"
            required
            type="url"
            value={artifactUrl}
          />
          <div className="proof-add-studio">
            <div className="proof-add-heading"><div><span>Evidence</span><strong>Choose what the room can see</strong></div><button aria-expanded={addMenuOpen} aria-label="Add evidence" onClick={() => setAddMenuOpen((open) => !open)} type="button">{addMenuOpen ? "Close" : "+ Add"}</button></div>
            <fieldset className="proof-privacy-choice">
              <legend>Supporting image visibility</legend>
              <label className={proofShareMode === "reviewer_only" ? "is-selected" : ""}><input checked={proofShareMode === "reviewer_only"} name="proof-share" onChange={() => { setProofShareMode("reviewer_only"); setDraftState("idle"); }} type="radio" /><span><strong>Creator only</strong>Private evidence for the decision</span></label>
              <label className={proofShareMode === "pod_shared" ? "is-selected" : ""}><input checked={proofShareMode === "pod_shared"} name="proof-share" onChange={() => { setProofShareMode("pod_shared"); setDraftState("idle"); }} type="radio" /><span><strong>Share with Pod</strong>Visible to the creator and locked roster</span></label>
              {props.publicVisitorSharingEnabled ? <label className={proofShareMode === "public" ? "is-selected" : ""}><input checked={proofShareMode === "public"} name="proof-share" onChange={() => { setProofShareMode("public"); setDraftState("idle"); }} type="radio" /><span><strong>Share publicly</strong>Visible to anyone who opens this public Pod room</span></label> : null}
            </fieldset>
            {addMenuOpen ? <div className="proof-action-sheet">
              <button onClick={() => cameraInput.current?.click()} type="button"><i>CAM</i><span>Camera<strong>Capture now</strong></span></button>
              <button onClick={() => imageInput.current?.click()} type="button"><i>IMG</i><span>Image<strong>Choose a file</strong></span></button>
              <a href="#artifact-url"><i>URL</i><span>Link<strong>Public artifact</strong></span></a>
            </div> : null}
            <input
              accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
              aria-label="Capture evidence photo"
              capture="environment"
              className="proof-file-input"
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }}
              ref={cameraInput}
              type="file"
            />
            <input
              accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
              aria-label="Choose evidence image"
              className="proof-file-input"
              id="evidence-image"
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }}
              ref={imageInput}
              type="file"
            />
            <p className="proof-lock-note">This visibility choice becomes immutable when you submit.</p>
            {uploadProgress !== null ? (
              <div className="upload-progress" aria-live="polite"><i style={{ width: `${uploadProgress}%` }} /><span>{uploadComplete ? "Image secured" : uploadProgress === 99 ? "Securing image" : `Uploading ${uploadProgress}%`}</span></div>
            ) : null}
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <p className={`draft-saved-state is-${draftState}`} aria-live="polite">{draftState === "saving" ? "Saving draft automatically" : draftState === "saved" ? "Draft saved automatically" : "Changes save automatically"}</p>
          <button
            className="primary-action full-action"
            disabled={busy || (uploadProgress !== null && !uploadComplete)}
            type="submit"
          >
            {busy ? "Submitting evidence" : "Review and submit"}
          </button>
        </motion.form>
      )}
    </>
  );
}
