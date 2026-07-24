"use client";

import type { ProfileAvatar, ReactionCode, TemplateId } from "@pods/domain";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { mediaForTemplate } from "../lib/template-presentation";
import { ProfileAvatar as Avatar } from "./profile-avatar";

export type PublicVisitorMessage = {
  id: string;
  sequence: number;
  kind: "member_message" | "activity" | "announcement" | "system";
  body: string | null;
  reply: {
    messageId: string;
    available: boolean;
    senderDisplayName: string | null;
    excerpt: string;
  } | null;
  hidden: boolean;
  pinned: boolean;
  createdAt: string;
  sender: {
    handle: string;
    displayName: string;
    avatar: ProfileAvatar;
    profileVisibility: "public" | "private";
  } | null;
  activity: {
    occurrenceOrdinal: number;
    localDate: string;
    task: string;
    deliverableType: string | null;
    state:
      | "committed"
      | "under_review"
      | "approved"
      | "rejected"
      | "timeout_protected";
    submissionId: string | null;
    resultSummary: string | null;
    artifactUrl: string | null;
    supportingImageAvailable: boolean;
  } | null;
  reactions: Array<{ code: ReactionCode; count: number }>;
};

export type PublicVisitorRoomData = {
  pod: {
    id: string;
    stage: "live" | "recent";
    state: string;
    templateId: TemplateId;
    name: string;
    purpose: string;
    roomState: "open" | "archived";
    participantCount: number;
    occurrenceCount: number;
    creator: {
      handle: string;
      displayName: string;
      avatar: ProfileAvatar;
      profileVisibility: "public" | "private";
    } | null;
  };
  changeCursor: number;
  lastSequence: number;
  messages: PublicVisitorMessage[];
};

function mergeMessages(
  current: PublicVisitorMessage[],
  incoming: PublicVisitorMessage[]
) {
  const byId = new Map(current.map((message) => [message.id, message] as const));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => left.sequence - right.sequence);
}

const reactionNames: Record<ReactionCode, string> = {
  heart: "Hearts",
  support: "Support",
  celebrate: "Celebrations",
  insightful: "Insights"
};

const templateNames: Record<TemplateId, string> = {
  build: "Build & Ship",
  create: "Practice & Create",
  fitness: "Fitness & Movement",
  reading: "Reading",
  study: "Study & Focus"
};

function roomTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(value));
}

function publicProofStateLabel(
  state: NonNullable<PublicVisitorMessage["activity"]>["state"]
) {
  if (state === "under_review") return "Creator review";
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Not verified";
  if (state === "timeout_protected") return "Protected after review timeout";
  return "Committed";
}

export function PublicVisitorRoom({
  canReport = false,
  initial,
  name,
  reportingEnabled = false
}: {
  canReport?: boolean;
  initial: PublicVisitorRoomData;
  name?: string;
  reportingEnabled?: boolean;
}) {
  const [data, setData] = useState(initial);
  const [reportTarget, setReportTarget] = useState<{
    targetKind: "message" | "submission";
    targetId: string;
    label: string;
  } | null>(null);
  const [reportState, setReportState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [reportError, setReportError] = useState("");
  const media = mediaForTemplate(data.pod.templateId, data.pod.id);
  const lastSequence = useRef(initial.lastSequence);
  const changeCursor = useRef(initial.changeCursor);

  const reconcile = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const response = await fetch(
      `/api/public/pods/${initial.pod.id}/room?after=${lastSequence.current}&cursor=${changeCursor.current}&limit=100`,
      { cache: "no-store" }
    );
    if (!response.ok) return;
    const next = (await response.json()) as PublicVisitorRoomData;
    setData((current) => ({
      ...next,
      messages: mergeMessages(current.messages, next.messages)
    }));
    lastSequence.current = Math.max(lastSequence.current, next.lastSequence);
    changeCursor.current = Math.max(changeCursor.current, next.changeCursor);
  }, [initial.pod.id]);

  useEffect(() => {
    const timer = window.setInterval(() => void reconcile(), 2_000);
    const onVisibility = () => void reconcile();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reconcile]);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget || reportState === "sending") return;
    const form = new FormData(event.currentTarget);
    setReportState("sending");
    setReportError("");
    try {
      const response = await fetch(`/api/public/pods/${data.pod.id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind: reportTarget.targetKind,
          targetId: reportTarget.targetId,
          reason: String(form.get("reason") ?? ""),
          details: String(form.get("details") ?? "")
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Report could not be sent");
      setReportState("sent");
    } catch (cause) {
      setReportState("error");
      setReportError(cause instanceof Error ? cause.message : "Report could not be sent");
    }
  }

  return (
    <main className={`app-shell public-room-shell theme-${data.pod.templateId}`}>
      <header className="public-room-header">
        <Link className="wordmark" href={`/pods/${data.pod.id}`}>
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <div>
          <span className="visitor-live-dot" aria-hidden="true" />
          <span>Public gallery</span>
        </div>
      </header>
      <section className="public-room-cover">
        <Image
          alt={`${templateNames[data.pod.templateId]} activity`}
          fill
          priority
          sizes="(max-width: 560px) 100vw, 520px"
          src={media.hero}
        />
        <div className="public-room-cover-shade" aria-hidden="true" />
        <div className="public-room-intro">
          <span>{data.pod.stage === "recent" ? "Completed archive" : "Building in public"}</span>
          <h1>{name ?? data.pod.name}</h1>
          <p>{data.pod.purpose}</p>
          <div>
            <strong>{data.pod.participantCount}</strong> people
            <i aria-hidden="true" />
            <strong>{data.pod.occurrenceCount}</strong> occurrences
          </div>
        </div>
      </section>
      <aside className="visitor-boundary">
        <strong>Read-only visitor</strong>
        <span>You can read public messages and proof records. Writing, reactions, activity controls, creator-only evidence, private decision notes, and financial details stay private.</span>
      </aside>
      <section className="public-room-stream" aria-label="Public Pod room">
        {data.messages.length === 0 ? (
          <div className="public-room-empty">
            <span>The room is ready.</span>
            <p>Public activity will appear here as the locked group begins.</p>
          </div>
        ) : data.messages.map((message) => (
          <article
            className={`public-room-entry is-${message.kind}${message.hidden ? " is-hidden" : ""}`}
            key={message.id}
          >
            {message.hidden ? (
              <p>Message unavailable</p>
            ) : (
              <>
                <div className="public-room-author">
                  {message.sender ? (
                    <Avatar
                      avatar={message.sender.avatar}
                      displayName={message.sender.displayName}
                      size="small"
                    />
                  ) : <span className="system-avatar" aria-hidden="true">p</span>}
                  {message.sender ? (
                    <Link
                      className="public-room-author-link"
                      href={
                        message.sender.profileVisibility === "public"
                          ? `/u/${message.sender.handle}`
                          : `/pods/${data.pod.id}/contributors/${message.sender.handle}`
                      }
                    >
                      <strong>{message.sender.displayName}</strong>
                      <small>{message.kind === "announcement" ? "Creator announcement" : message.kind === "activity" ? "Activity proof" : roomTime(message.createdAt)}</small>
                    </Link>
                  ) : (
                    <span><strong>Pods</strong><small>System update</small></span>
                  )}
                  {reportingEnabled && message.sender && (
                    message.activity?.submissionId || message.kind !== "activity"
                  ) ? canReport ? (
                    <button
                      aria-label={`Report ${message.kind === "activity" ? "proof" : "message"} by ${message.sender.displayName}`}
                      className="public-report-trigger"
                      onClick={() => {
                        setReportTarget({
                          targetKind: message.kind === "activity" ? "submission" : "message",
                          targetId: message.activity?.submissionId ?? message.id,
                          label: `${message.kind === "activity" ? "Proof" : "Message"} by ${message.sender?.displayName ?? "Pod member"}`
                        });
                        setReportState("idle");
                        setReportError("");
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">•••</span>
                    </button>
                  ) : (
                    <Link
                      aria-label={`Connect wallet to report ${message.kind === "activity" ? "proof" : "message"} by ${message.sender.displayName}`}
                      className="public-report-trigger"
                      href={`/connect?returnTo=${encodeURIComponent(`/pods/${data.pod.id}/room`)}`}
                    >
                      <span aria-hidden="true">•••</span>
                    </Link>
                  ) : null}
                </div>
                {message.reply ? (
                  <div className="public-reply-context">
                    <strong>{message.reply.senderDisplayName ?? "Message"}</strong>
                    <span>{message.reply.excerpt}</span>
                  </div>
                ) : null}
                {message.body && message.kind !== "activity" ? <p>{message.body}</p> : null}
                {message.activity ? (
                  <div className="public-proof-card">
                    <div>
                      <span>Occurrence {message.activity.occurrenceOrdinal}</span>
                      <b>{publicProofStateLabel(message.activity.state)}</b>
                    </div>
                    <h2>{message.activity.task}</h2>
                    {message.activity.resultSummary ? <p>{message.activity.resultSummary}</p> : null}
                    {message.activity.supportingImageAvailable && message.activity.submissionId ? (
                      // The optimized Next image loader is intentionally not used for an authenticated
                      // no-store byte stream whose dimensions are not known until decode.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`Public supporting proof from ${message.sender?.displayName ?? "a participant"}`}
                        loading="lazy"
                        src={`/api/public/pods/${data.pod.id}/proofs/${message.activity.submissionId}/image`}
                      />
                    ) : null}
                    {message.activity.artifactUrl ? (
                      <a href={message.activity.artifactUrl} rel="noopener noreferrer" target="_blank">
                        Open public artifact
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {message.reactions.length > 0 ? (
                  <div className="public-reaction-summary" aria-label="Member reactions">
                    {message.reactions.map((reaction) => (
                      <span key={reaction.code}>
                        {reactionNames[reaction.code]} {reaction.count}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </article>
        ))}
      </section>
      {reportTarget ? (
        <div className="public-report-backdrop">
          <section
            aria-label="Report public content"
            aria-modal="true"
            className="public-report-sheet"
            role="dialog"
          >
            {reportState === "sent" ? (
              <>
                <span className="public-report-kicker">Report received</span>
                <h2>Pods operations will review it.</h2>
                <p>The author is not notified by this form. Reporting never changes the Pod contract, review result, or financial state.</p>
                <button
                  className="secondary-action full-action"
                  onClick={() => setReportTarget(null)}
                  type="button"
                >
                  Return to room
                </button>
              </>
            ) : (
              <form onSubmit={submitReport}>
                <div className="public-report-heading">
                  <span>Private safety report</span>
                  <button
                    aria-label="Close report"
                    onClick={() => setReportTarget(null)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <h2>{reportTarget.label}</h2>
                <label htmlFor="public-report-reason">Reason</label>
                <select defaultValue="unsafe_content" id="public-report-reason" name="reason">
                  <option value="unsafe_content">Unsafe content</option>
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
                <label htmlFor="public-report-details">What happened?</label>
                <textarea
                  id="public-report-details"
                  maxLength={1000}
                  minLength={5}
                  name="details"
                  required
                  rows={5}
                />
                {reportError ? <p className="form-error" role="alert">{reportError}</p> : null}
                <button
                  className="primary-action full-action"
                  disabled={reportState === "sending"}
                  type="submit"
                >
                  {reportState === "sending" ? "Sending report" : "Send private report"}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
      <div className="visitor-composer-boundary" aria-label="Read-only room">
        <span>Visitors can watch, not participate</span>
        <Link href={`/pods/${data.pod.id}`}>View Pod</Link>
      </div>
    </main>
  );
}
