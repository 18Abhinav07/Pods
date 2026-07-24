"use client";

import type {
  MessageReplyPreview as MessageReplyPreviewType,
  ProfileAvatar as ProfileAvatarType,
  ReactionCode,
  TemplateEvidence,
  TemplateId
} from "@pods/domain";
import { DotsThree, Lightning, PaperPlaneRight, Plus, UserPlus, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClientUuid } from "../lib/client-id";
import { roomSubmissionStateLabel } from "../lib/room-activity-presentation";
import { presentTemplateEvidence } from "../lib/template-evidence-presentation";
import {
  localReplyPreview,
  MessageReplyPreviewView,
  unavailableReplyPreview
} from "./message-reply-preview";
import { ProfileAvatar } from "./profile-avatar";

export type RoomMessage = {
  id: string;
  sequence: number;
  kind: "member_message" | "activity" | "announcement" | "system";
  body: string | null;
  replyToMessageId: string | null;
  replyPreview: MessageReplyPreviewType | null;
  hidden: boolean;
  pinned: boolean;
  createdAt: string;
  sender: {
    handle: string;
    displayName: string;
    avatar: ProfileAvatarType;
    isViewer?: boolean;
  } | null;
  reactions: Array<{ code: ReactionCode; count: number; reactedByViewer: boolean }>;
  activity?: {
    commitmentId: string;
    occurrenceOrdinal: number;
    task: string;
    deliverableType: string | null;
    templateId: TemplateId;
    state: string;
    submissionId: string | null;
    templateEvidence: TemplateEvidence | null;
    resultSummary: string | null;
    artifactUrl: string | null;
    sharedEvidenceAvailable: boolean;
  } | null;
  delivery?: "sending" | "failed";
};

function RoomActivityEvidence({
  activity
}: {
  activity: NonNullable<RoomMessage["activity"]>;
}) {
  const presentation = presentTemplateEvidence({
    templateId: activity.templateId,
    frozenConfig: {},
    commitment: {
      task: activity.task,
      deliverableType:
        activity.deliverableType === "pull_request" ||
        activity.deliverableType === "commit" ||
        activity.deliverableType === "issue" ||
        activity.deliverableType === "live_artifact"
          ? activity.deliverableType
          : null
    },
    templateEvidence: activity.templateEvidence,
    ...(activity.resultSummary !== null
      ? {
          legacySubmission: {
            resultSummary: activity.resultSummary,
            artifactUrl: activity.artifactUrl ?? ""
          }
        }
      : {})
  });
  if (presentation.evidenceRows.length === 0) {
    return (
      <p className="activity-card-waiting">
        {activity.submissionId
          ? "Proof submitted privately. Details are visible only to the participant and creator."
          : "Commitment locked. Proof will appear after submission."}
      </p>
    );
  }
  return (
    <div className="room-template-evidence" aria-label={`${presentation.templateName} proof`}>
      {presentation.evidenceRows.map((row) => (
        <p key={row.label}><span>{row.label}</span>{row.value}</p>
      ))}
      {presentation.artifact ? (
        <a href={presentation.artifact.href} rel="noreferrer" target="_blank">
          {presentation.artifact.label}
        </a>
      ) : null}
    </div>
  );
}

const reactionLabels: Record<ReactionCode, string> = {
  heart: "Heart",
  support: "Support",
  celebrate: "Celebrate",
  insightful: "Insightful"
};

function ReactionIcon({ code }: { code: ReactionCode }) {
  if (code === "heart") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 5.8a5 5 0 0 0-7.1 0L12 7.5l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.1a5 5 0 0 0 0-7.1Z" /></svg>;
  if (code === "support") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 12 3 3 7-7"/><path d="M12 3a9 9 0 1 0 9 9"/></svg>;
  if (code === "celebrate") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 4-10 6 6-10 4Z"/><path d="m14 4 .5 3M19 8l-3 1M17 3l-2 2"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 5a6 6 0 0 1 0 9.5L14 16h-4l-1.5-1.5Z"/></svg>;
}

function messageLabel(kind: RoomMessage["kind"]) {
  if (kind === "announcement") return "Creator announcement";
  if (kind === "activity") return "Activity update";
  if (kind === "system") return "Pods system";
  return null;
}

function MessageBody({ body }: { body: string | null }) {
  if (!body) return null;
  const parts = body.split(/(https:\/\/[^\s]+)/g);
  return <p>{parts.map((part, index) => part.startsWith("https://")
    ? <a href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">{part}</a>
    : part)}</p>;
}

export function shouldMarkConversationRead(remoteSequence: number, acknowledgedSequence: number) {
  return remoteSequence > acknowledgedSequence;
}

export function mergeRoomMessages(current: RoomMessage[], incoming: RoomMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message] as const));
  for (const message of incoming) {
    byId.set(message.id, { ...byId.get(message.id), ...message });
  }
  return [...byId.values()].sort((first, second) => first.sequence - second.sequence);
}

function messagesShareVisualGroup(first: RoomMessage | undefined, second: RoomMessage | undefined) {
  if (!first || !second) return false;
  if (first.kind !== "member_message" || second.kind !== "member_message") return false;
  if (first.hidden || second.hidden) return false;
  if (first.sender?.handle !== second.sender?.handle) return false;
  if (Boolean(first.sender?.isViewer) !== Boolean(second.sender?.isViewer)) return false;
  return Math.abs(new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()) <= 5 * 60 * 1000;
}

export function PodRoom({
  conversationId,
  podId,
  initialMessages,
  initialLastSequence,
  initialChangeCursor = 0,
  isCreator,
  roomState,
  proofAction,
  viewer,
  mode = "pod",
  initialPeerReadSequence = 0
}: {
  conversationId: string;
  podId: string;
  initialMessages: RoomMessage[];
  initialLastSequence: number;
  initialChangeCursor?: number;
  isCreator: boolean;
  roomState: "open" | "archived";
  proofAction?: { href: string; label: string };
  viewer?: { handle: string; displayName: string; avatar: ProfileAvatarType };
  mode?: "pod" | "direct";
  initialPeerReadSequence?: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [composer, setComposer] = useState("");
  const [replyTo, setReplyTo] = useState<RoomMessage | null>(null);
  const [announcement, setAnnouncement] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<RoomMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [pendingReplyTargetId, setPendingReplyTargetId] = useState<string | null>(null);
  const [peerReadSequence, setPeerReadSequence] = useState(initialPeerReadSequence);
  const cursor = useRef(initialLastSequence);
  const changeCursor = useRef(initialChangeCursor);
  const acknowledgedReadSequence = useRef(0);
  const longPressTimer = useRef<number | null>(null);
  const highlightTimer = useRef<number | null>(null);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current === null) return;
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }, []);

  const startLongPress = useCallback((message: RoomMessage) => {
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      setActiveMessage(message);
      longPressTimer.current = null;
    }, 480);
  }, [cancelLongPress]);

  const markRead = useCallback(async (sequence: number) => {
    if (!shouldMarkConversationRead(sequence, acknowledgedReadSequence.current)) return;
    acknowledgedReadSequence.current = sequence;
    await fetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sequence })
    });
  }, [conversationId]);

  const reconcile = useCallback(async () => {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages?after=${cursor.current}&cursor=${changeCursor.current}&limit=100`,
      { cache: "no-store" }
    );
    if (!response.ok) return;
    const payload = (await response.json()) as {
      conversation: { lastSequence: number; changeCursor?: number };
      messages: RoomMessage[];
    };
    const conversationWithRead = payload.conversation as { lastSequence: number; peerReadSequence?: number };
    setPeerReadSequence(conversationWithRead.peerReadSequence ?? 0);
    if (payload.messages.length > 0) {
      setMessages((current) => mergeRoomMessages(current, payload.messages));
    }
    cursor.current = Math.max(cursor.current, payload.conversation.lastSequence);
    changeCursor.current = Math.max(
      changeCursor.current,
      payload.conversation.changeCursor ?? 0
    );
    await markRead(payload.conversation.lastSequence);
  }, [conversationId, markRead]);

  useEffect(() => {
    void markRead(initialLastSequence);
    const timer = window.setInterval(() => void reconcile(), 2_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      cancelLongPress();
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [cancelLongPress, initialLastSequence, markRead, reconcile]);

  useEffect(() => {
    if (!pendingReplyTargetId) return;
    const frame = window.requestAnimationFrame(() => {
      if (scrollToReplyTarget(pendingReplyTargetId)) setPendingReplyTargetId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, pendingReplyTargetId]);

  async function sendMessage() {
    const body = composer.trim();
    if (!body) return;
    const clientMessageId = createClientUuid();
    const optimistic: RoomMessage = {
      id: clientMessageId,
      sequence: cursor.current + 1,
      kind: announcement ? "announcement" : "member_message",
      body,
      replyToMessageId: replyTo?.id ?? null,
      replyPreview: replyTo ? localReplyPreview(replyTo) : null,
      hidden: false,
      pinned: false,
      createdAt: new Date().toISOString(),
      sender: viewer ? { ...viewer, isViewer: true } : null,
      reactions: [],
      delivery: "sending"
    };
    setMessages((current) => [...current, optimistic]);
    setComposer("");
    setReplyTo(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMessageId,
          body,
          replyToMessageId: optimistic.replyToMessageId,
          kind: optimistic.kind
        })
      });
      if (!response.ok) throw new Error("Message could not be sent");
      const payload = (await response.json()) as { message: { id: string; sequence: number } };
      cursor.current = Math.max(cursor.current, payload.message.sequence);
      setMessages((current) => current.map((message) => {
        if (message.id !== clientMessageId) return message;
        const sent = { ...message };
        delete sent.delivery;
        return { ...sent, id: payload.message.id, sequence: payload.message.sequence };
      }));
    } catch {
      setMessages((current) => current.map((message) =>
        message.id === clientMessageId ? { ...message, delivery: "failed" } : message
      ));
    }
  }

  async function react(message: RoomMessage, code: ReactionCode) {
    const existing = message.reactions.find((item) => item.reactedByViewer);
    setMessages((current) => current.map((item) => {
      if (item.id !== message.id) return item;
      const reactions = item.reactions
        .map((reaction) => reaction.reactedByViewer
          ? { ...reaction, count: reaction.count - 1, reactedByViewer: false }
          : reaction)
        .filter(({ count }) => count > 0);
      if (existing?.code === code) return { ...item, reactions };
      const target = reactions.find((reaction) => reaction.code === code);
      return {
        ...item,
        reactions: target
          ? reactions.map((reaction) => reaction.code === code
            ? { ...reaction, count: reaction.count + 1, reactedByViewer: true }
            : reaction)
          : [...reactions, { code, count: 1, reactedByViewer: true }]
      };
    }));
    if (existing?.code === code) {
      await fetch(`/api/messages/${message.id}/reactions`, { method: "DELETE" });
    } else {
      await fetch(`/api/messages/${message.id}/reactions`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code })
      });
    }
  }

  async function pinMessage(message: RoomMessage) {
    const pinned = !message.pinned;
    const response = await fetch(`/api/messages/${message.id}/pin`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId, pinned })
    });
    if (!response.ok) return;
    setMessages((current) => current.map((item) => item.id === message.id
      ? { ...item, pinned }
      : item));
    setActiveMessage(null);
  }

  function scrollToReplyTarget(messageId: string) {
    const target = document.getElementById(messageId);
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => {
      setHighlightedMessageId((current) => current === messageId ? null : current);
      highlightTimer.current = null;
    }, 1_200);
    return true;
  }

  async function activateReplyTarget(replyMessageId: string, preview: MessageReplyPreviewType) {
    if (scrollToReplyTarget(preview.messageId)) return;
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?around=${preview.messageId}&limit=40`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Reply target could not be loaded");
      const payload = (await response.json()) as {
        conversation: { lastSequence: number };
        messages: RoomMessage[];
      };
      setMessages((current) => mergeRoomMessages(current, payload.messages));
      setPendingReplyTargetId(preview.messageId);
    } catch {
      setMessages((current) => current.map((message) =>
        message.id === replyMessageId && message.replyPreview
          ? { ...message, replyPreview: unavailableReplyPreview(message.replyPreview) }
          : message
      ));
    }
  }

  async function hideMessage(message: RoomMessage) {
    const response = await fetch(`/api/messages/${message.id}/moderation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId })
    });
    if (!response.ok) return;
    setMessages((current) => current.map((item) => {
      if (item.id === message.id) return { ...item, hidden: true, body: null };
      if (item.replyPreview?.messageId === message.id) {
        return { ...item, replyPreview: unavailableReplyPreview(item.replyPreview) };
      }
      return item;
    }));
    setActiveMessage(null);
  }

  async function retryMessage(message: RoomMessage) {
    if (!message.body) return;
    setMessages((current) => current.map((item) => item.id === message.id
      ? { ...item, delivery: "sending" }
      : item));
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMessageId: message.id,
          body: message.body,
          replyToMessageId: message.replyToMessageId,
          kind: message.kind
        })
      });
      if (!response.ok) throw new Error("Message could not be sent");
      const payload = (await response.json()) as { message: { id: string; sequence: number } };
      cursor.current = Math.max(cursor.current, payload.message.sequence);
      setMessages((current) => current.map((item) => {
        if (item.id !== message.id) return item;
        const sent = { ...item };
        delete sent.delivery;
        return { ...sent, id: payload.message.id, sequence: payload.message.sequence };
      }));
    } catch {
      setMessages((current) => current.map((item) => item.id === message.id
        ? { ...item, delivery: "failed" }
        : item));
    }
  }

  return (
    <section className={`pod-room-panel${mode === "direct" ? " is-direct" : ""}`}>
      <div className="room-message-list" aria-live="polite">
        {messages.length === 0 ? (
          <div className="room-empty-state">
            <span>{mode === "direct" ? "Conversation opened" : "Room opened"}</span>
            <h2>{mode === "direct" ? "Start with something real." : "Set the rhythm together."}</h2>
            <p>{mode === "direct" ? "Messages are private to this conversation. Pods does not claim end-to-end encryption." : "Share encouragement, questions, and progress. Review evidence and financial outcomes remain separate."}</p>
          </div>
        ) : messages.map((message, index) => {
          const label = messageLabel(message.kind);
          const isMemberMessage = message.kind === "member_message";
          const groupedWithPrevious = messagesShareVisualGroup(messages[index - 1], message);
          const groupedWithNext = messagesShareVisualGroup(message, messages[index + 1]);
          const groupStart = !groupedWithPrevious;
          const groupEnd = !groupedWithNext;
          const isViewer = Boolean(message.sender?.isViewer);
          const showHeader = !isMemberMessage || (groupStart && !isViewer);
          return (
            <div
              className={`room-message-cluster${isMemberMessage ? " is-member" : " is-authoritative"}${isViewer ? " is-viewer" : ""}${groupStart ? " is-group-start" : ""}${groupEnd ? " is-group-end" : ""}`}
              key={message.id}
            >
              {isMemberMessage && !isViewer ? (
                groupStart && message.sender
                  ? <ProfileAvatar avatar={message.sender.avatar} displayName={message.sender.displayName} size="small" />
                  : <span className="room-avatar-spacer" aria-hidden="true" />
              ) : null}
              <article
                className={`room-entry room-entry-${message.kind}${isViewer ? " is-viewer" : ""}${groupedWithPrevious ? " is-consecutive" : ""}${groupStart ? " is-group-start" : ""}${groupEnd ? " is-group-end" : ""}${message.hidden ? " is-hidden" : ""}${highlightedMessageId === message.id ? " is-reply-target" : ""}`}
                id={message.id}
                onContextMenu={message.hidden ? undefined : (event) => {
                  event.preventDefault();
                  setActiveMessage(message);
                }}
                onPointerCancel={message.hidden ? undefined : cancelLongPress}
                onPointerDown={message.hidden ? undefined : () => startLongPress(message)}
                onPointerLeave={message.hidden ? undefined : cancelLongPress}
                onPointerUp={message.hidden ? undefined : cancelLongPress}
              >
              {message.hidden ? (
                <div className="room-tombstone"><span>Message removed by the Pod creator</span></div>
              ) : (
                <>
                  {showHeader ? <header>
                    {!isMemberMessage ? (message.sender ? <ProfileAvatar avatar={message.sender.avatar} displayName={message.sender.displayName} size="small" /> : <span className="system-avatar" aria-hidden="true">P</span>) : null}
                    <div>
                      {label ? <span className="room-entry-label">{label}</span> : null}
                      <strong>{message.sender?.displayName ?? (message.kind === "system" ? "Pods" : "You")}</strong>
                    </div>
                    {!isMemberMessage ? <div className="room-message-meta">
                      <time dateTime={message.createdAt}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time>
                      <button
                        aria-label={`More actions for ${message.sender?.displayName ?? "this update"}`}
                        className="message-more"
                        onClick={() => setActiveMessage(message)}
                        type="button"
                      >
                        <DotsThree aria-hidden="true" size={20} weight="bold" />
                      </button>
                    </div> : null}
                  </header> : null}
                  {message.pinned ? <span className="room-pinned">Pinned</span> : null}
                  {message.replyPreview ? (
                    message.replyPreview.available ? (
                      <MessageReplyPreviewView
                        onActivate={() => void activateReplyTarget(message.id, message.replyPreview!)}
                        preview={message.replyPreview}
                      />
                    ) : <MessageReplyPreviewView preview={message.replyPreview} />
                  ) : null}
                  {message.kind === "activity" && message.activity ? (
                    <div className="room-activity-card">
                      <div><span>Occurrence {message.activity.occurrenceOrdinal}</span><i>{roomSubmissionStateLabel(message.activity.state)}</i></div>
                      <div className="room-activity-main">
                        <div className="room-activity-copy">
                          <h3>{message.activity.task}</h3>
                          <RoomActivityEvidence activity={message.activity} />
                        </div>
                        {message.activity.sharedEvidenceAvailable && message.activity.submissionId ? (
                          <a
                            aria-label="Open shared proof"
                            className="room-proof-link"
                            href={`/api/pods/${podId}/submissions/${message.activity.submissionId}/shared-evidence`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Image
                              alt="Pod-shared proof"
                              className="room-proof-image"
                              height={192}
                              src={`/api/pods/${podId}/submissions/${message.activity.submissionId}/shared-evidence`}
                              unoptimized
                              width={192}
                            />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : <MessageBody body={message.body} />}
                  {message.delivery === "sending" ? <small className="delivery-state is-sending">Sending</small> : null}
                  {message.delivery === "failed" ? <button className="delivery-state is-failed" onClick={() => void retryMessage(message)} type="button">Failed. Retry</button> : null}
                  {!isMemberMessage && !message.delivery && mode === "direct" && message.sender?.isViewer ? <small className="delivery-state">{message.sequence <= peerReadSequence ? "Seen" : "Sent"}</small> : null}
                  {message.reactions.length > 0 ? <div className="reaction-summary">
                    {message.reactions.map((summary) => (
                      <button className={summary.reactedByViewer ? "is-active" : ""} key={summary.code} onClick={() => void react(message, summary.code)} type="button" aria-label={`${reactionLabels[summary.code]} ${summary.count}`}>
                        <ReactionIcon code={summary.code} />
                        <span>{summary.count}</span>
                      </button>
                    ))}
                  </div> : null}
                  {isMemberMessage && groupEnd ? (
                    <footer className="room-bubble-footer">
                      <time dateTime={message.createdAt}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time>
                      {!message.delivery && mode === "direct" && isViewer ? <span>{message.sequence <= peerReadSequence ? "Seen" : "Sent"}</span> : null}
                      <button aria-label={`More actions for ${message.sender?.displayName ?? "this message"}`} className="message-more" onClick={() => setActiveMessage(message)} type="button"><DotsThree aria-hidden="true" size={18} weight="bold" /></button>
                    </footer>
                  ) : null}
                </>
              )}
              </article>
            </div>
          );
        })}
      </div>
      {activeMessage ? (
        <div className="message-actions-layer">
          <button aria-label="Close message actions" className="message-actions-backdrop" onClick={() => setActiveMessage(null)} type="button" />
          <section aria-label="Message actions" aria-modal="true" className="message-actions-sheet" role="dialog">
            <header>
              <div><small>Message from</small><strong>{activeMessage.sender?.displayName ?? "Pods"}</strong></div>
              <button aria-label="Close message actions" onClick={() => setActiveMessage(null)} type="button"><X aria-hidden="true" size={20} weight="bold" /></button>
            </header>
            <div aria-label="Reactions" className="message-action-reactions" role="group">
              {(["heart", "support", "celebrate", "insightful"] as ReactionCode[]).map((code) => (
                <button
                  aria-label={`React with ${reactionLabels[code]}`}
                  className={activeMessage.reactions.some((reaction) => reaction.code === code && reaction.reactedByViewer) ? "is-active" : ""}
                  key={code}
                  onClick={() => {
                    void react(activeMessage, code);
                    setActiveMessage(null);
                  }}
                  type="button"
                >
                  <ReactionIcon code={code} />
                  <span>{reactionLabels[code]}</span>
                </button>
              ))}
            </div>
            <div className="message-action-list">
              <button onClick={() => { setReplyTo(activeMessage); setActiveMessage(null); }} type="button">Reply</button>
              {activeMessage.body ? <button onClick={() => {
                if (navigator.clipboard) void navigator.clipboard.writeText(activeMessage.body ?? "");
                setActiveMessage(null);
              }} type="button">Copy message</button> : null}
              {isCreator && mode === "pod" && activeMessage.kind === "announcement" ? <button onClick={() => void pinMessage(activeMessage)} type="button" aria-label={activeMessage.pinned ? "Unpin announcement" : "Pin announcement"}>{activeMessage.pinned ? "Unpin announcement" : "Pin announcement"}</button> : null}
              {isCreator && mode === "pod" && activeMessage.kind === "member_message" ? <button className="is-destructive" onClick={() => void hideMessage(activeMessage)} type="button" aria-label="Hide message">Hide message</button> : null}
            </div>
          </section>
        </div>
      ) : null}
      {roomState === "archived" ? (
        <div className="room-archive-state"><strong>This room is a read-only archive.</strong><span>All frozen Pod and financial history remains available.</span></div>
      ) : (
        <form className="room-composer is-bottom-attached" aria-label="Send a room message" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
          {replyTo ? (
            <div className="reply-context">
              <MessageReplyPreviewView preview={localReplyPreview(replyTo)} />
              <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          ) : null}
          {isCreator && mode === "pod" ? <label className="announcement-toggle"><input checked={announcement} onChange={(event) => setAnnouncement(event.target.checked)} type="checkbox" />Creator announcement</label> : null}
          {addMenuOpen && mode === "pod" ? <div className={`composer-action-sheet${isCreator ? "" : " is-single"}`}>
            <Link aria-label={proofAction?.label ?? "View activity"} href={proofAction?.href ?? `/pods/${podId}/activity`} onClick={() => setAddMenuOpen(false)}>
              <Lightning aria-hidden="true" size={21} weight="fill" />
              <span><small>Today</small><strong>{proofAction?.label ?? "View activity"}</strong></span>
            </Link>
            {isCreator ? <Link aria-label="Invite people" href={`/pods/${podId}/admin`} onClick={() => setAddMenuOpen(false)}>
              <UserPlus aria-hidden="true" size={21} weight="bold" />
              <span><small>People</small><strong>Invite people</strong></span>
            </Link> : null}
          </div> : null}
          <div className={`composer-row${mode === "direct" ? " is-direct" : ""}`}>
            {mode === "pod" ? <button aria-expanded={addMenuOpen} className="composer-plus" onClick={() => setAddMenuOpen((open) => !open)} type="button" aria-label="Add to message"><Plus aria-hidden="true" size={22} weight="bold" /></button> : null}
            <textarea aria-label="Message" id="room-message" maxLength={2000} onChange={(event) => setComposer(event.target.value)} placeholder="Message" rows={1} value={composer} />
            <button className={`composer-send ${composer.trim() ? "is-ready" : "is-disabled"}`} disabled={!composer.trim()} type="submit" aria-label="Send message"><PaperPlaneRight aria-hidden="true" size={21} weight="fill" /></button>
          </div>
        </form>
      )}
    </section>
  );
}
