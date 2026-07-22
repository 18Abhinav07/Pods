import type { MessageKind, MessageReplyPreview } from "@pods/domain";

export type ReplyPreviewSource = {
  id: string;
  sequence: number;
  kind: MessageKind;
  body: string | null;
  hidden: boolean;
  sender: { displayName: string } | null;
};

function safeExcerpt(message: ReplyPreviewSource) {
  if (message.hidden) return "Message unavailable";
  if (message.kind === "activity") return "Activity update";
  if (message.kind === "system") return "Pods system update";
  return (message.body ?? "Message unavailable").slice(0, 120);
}

export function localReplyPreview(message: ReplyPreviewSource): MessageReplyPreview {
  const available = !message.hidden;
  return {
    messageId: message.id,
    sequence: message.sequence,
    senderDisplayName: available ? message.sender?.displayName ?? "Pods" : null,
    kind: message.kind,
    excerpt: safeExcerpt(message),
    available
  };
}

export function unavailableReplyPreview(
  preview: MessageReplyPreview
): MessageReplyPreview {
  return {
    ...preview,
    senderDisplayName: null,
    excerpt: "Message unavailable",
    available: false
  };
}

export function MessageReplyPreviewView({
  onActivate,
  preview
}: {
  onActivate?: () => void;
  preview: MessageReplyPreview;
}) {
  const content = (
    <>
      {preview.senderDisplayName ? <strong>{preview.senderDisplayName}</strong> : null}
      <span>{preview.excerpt}</span>
    </>
  );

  if (preview.available && onActivate) {
    return (
      <button
        aria-label={`Reply to ${preview.senderDisplayName ?? "Pods"}: ${preview.excerpt}`}
        className="message-reply-preview is-interactive"
        onClick={onActivate}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`message-reply-preview${preview.available ? "" : " is-unavailable"}`}>
      {content}
    </div>
  );
}
