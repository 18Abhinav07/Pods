"use client";

import type { BuildDeliverableType, SubmissionState } from "@pods/domain";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
  currentStreak: number;
  timeZone: string;
  commitment: CommitmentView | null;
  submission: SubmissionView | null;
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
    artifactUrl: props.submission?.artifactUrl ?? ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(
    Boolean(props.submission?.evidenceObjectKey)
  );
  const dirty =
    resultSummary !== savedValues.resultSummary || artifactUrl !== savedValues.artifactUrl;

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

  async function saveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/pods/${props.podId}/occurrences/${props.occurrenceId}/draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resultSummary, artifactUrl })
        }
      );
      const body = await responseBody(response);
      if (!response.ok || !body.submission) {
        throw new Error(body.error ?? "Evidence draft could not be saved");
      }
      setSubmission(body.submission);
      setSavedValues({ resultSummary, artifactUrl });
      router.refresh();
      return body.submission;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence draft could not be saved");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function uploadImage(file: File) {
    if (!submission || submission.state !== "draft") return;
    setError("");
    setUploadProgress(0);
    setUploadComplete(false);
    const form = new FormData();
    form.set("submissionId", submission.id);
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

  async function submitForReview() {
    if (!submission || submission.state !== "draft" || dirty) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/pods/${props.podId}/submissions/${submission.id}/submit`,
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
  return (
    <>
      <section className="activity-hero entrance entrance-hero">
        <p className="eyebrow">Occurrence {props.occurrenceOrdinal}</p>
        <h1>{props.podName}</h1>
        <p>{props.projectTheme}</p>
      </section>
      <section className="occurrence-context-grid entrance entrance-status">
        <div><span>At risk</span><strong>{props.stakeNim} NIM</strong></div>
        <div><span>Current streak</span><strong>{props.currentStreak} occurrences</strong></div>
        <div><span>Evidence closes</span><strong>{formatZonedMoment(props.closesAt, { timeZone: props.timeZone })}</strong></div>
      </section>

      {!commitment ? (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-contract-card"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={lock}
        >
          <div className="activity-card-heading"><span>Commit before building</span><h2>Lock one concrete task.</h2></div>
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
          <label htmlFor="deliverable-type">Visible deliverable</label>
          <select
            id="deliverable-type"
            onChange={(event) => setDeliverableType(event.target.value as BuildDeliverableType)}
            value={deliverableType}
          >
            {props.allowedDeliverables.map((value) => (
              <option key={value} value={value}>{deliverableLabel(value)}</option>
            ))}
          </select>
          <aside className="activity-lock-disclosure">
            <strong>Locked by {formatZonedMoment(props.commitmentDeadlineAt, { timeZone: props.timeZone })}</strong>
            <p>Once locked, this task cannot be changed for this occurrence.</p>
          </aside>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-action full-action" disabled={busy} type="submit">
            {busy ? "Locking task" : "Lock this task"}
          </button>
        </motion.form>
      ) : submission && (status === "reviewing" || status === "approved") ? (
        <section className={`submission-status-card is-${status}`}>
          <span>{status === "approved" ? "Manually approved" : "Pods team review"}</span>
          <h2>{status === "approved" ? "Occurrence completed." : "Your evidence is under review."}</h2>
          <p>{status === "approved" ? "The public artifact completed the locked task and is bonus-eligible." : "The 12-hour response time is a target. Your review deadline remains visible while the Pods team evaluates the work."}</p>
          <Link className="primary-action full-action" href={`/pods/${props.podId}/submissions/${submission.id}`}>View submission</Link>
        </section>
      ) : (
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="activity-evidence-card"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          onSubmit={saveDraft}
        >
          <div className="locked-task-panel"><span>Locked task</span><strong>{commitment.task}</strong><small>{deliverableLabel(commitment.deliverableType)}</small></div>
          <label htmlFor="result-summary">Result summary</label>
          <textarea
            id="result-summary"
            maxLength={1200}
            minLength={20}
            onChange={(event) => setResultSummary(event.target.value)}
            placeholder="Describe what changed and what a reviewer can verify."
            required
            rows={5}
            value={resultSummary}
          />
          <label htmlFor="artifact-url">Public artifact URL</label>
          <input
            id="artifact-url"
            onChange={(event) => setArtifactUrl(event.target.value)}
            placeholder="https://github.com/owner/repo/pull/42"
            required
            type="url"
            value={artifactUrl}
          />
          {submission ? (
            <div className="optional-evidence-upload">
              <label htmlFor="evidence-image">Optional supporting image</label>
              <input
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                id="evidence-image"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadImage(file);
                }}
                type="file"
              />
              {uploadProgress !== null ? (
                <div className="upload-progress" aria-live="polite"><i style={{ width: `${uploadProgress}%` }} /><span>{uploadComplete ? "Image secured" : uploadProgress === 99 ? "Securing image" : `Uploading ${uploadProgress}%`}</span></div>
              ) : null}
            </div>
          ) : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {!submission ? (
            <button className="primary-action full-action" disabled={busy} type="submit">
              {busy ? "Saving draft" : "Save evidence draft"}
            </button>
          ) : (
            <>
              {dirty ? <button className="secondary-action full-action" disabled={busy} type="submit">Save changes</button> : <p className="draft-saved-state">Draft saved privately</p>}
              <button
                className="primary-action full-action"
                disabled={busy || dirty || (uploadProgress !== null && !uploadComplete)}
                onClick={submitForReview}
                type="button"
              >
                {busy ? "Submitting evidence" : "Submit for Pods review"}
              </button>
            </>
          )}
        </motion.form>
      )}
    </>
  );
}
