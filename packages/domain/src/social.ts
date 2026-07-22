export const profileHandlePattern = /^[a-z0-9_]{3,20}$/;

export const profileAvatarPresets = [
  "ember",
  "moss",
  "indigo",
  "coral",
  "sun",
  "stone"
] as const;

export type ProfileAvatarPreset = (typeof profileAvatarPresets)[number];
export type ProfileVisibility = "public" | "private";
export type DmPolicy = "friends" | "requests" | "none";
export type ProfileAvatar =
  | { kind: "preset"; preset: ProfileAvatarPreset }
  | { kind: "upload"; mediaId: string };

export type ProfileInput = {
  handle: string;
  displayName: string;
  bio: string;
  avatar: ProfileAvatar;
  visibility: ProfileVisibility;
  dmPolicy: DmPolicy;
  activityStatusVisible: boolean;
};

export type ProfileField = keyof ProfileInput;

export const reactionCodes = ["heart", "support", "celebrate", "insightful"] as const;
export type ReactionCode = (typeof reactionCodes)[number];
export type ConversationKind = "pod" | "direct";
export type DirectConversationState = "pending" | "active" | "discarded" | "blocked";
export type RoomState = "open" | "archived";
export type MessageKind =
  | "member_message"
  | "activity"
  | "announcement"
  | "system";
export type ProofShareMode = "reviewer_only" | "pod_shared";
export type AttachmentKind = "image" | "gif" | "pdf" | "link";
export const friendRequestStates = ["pending", "accepted", "declined", "cancelled"] as const;
export type FriendRequestState = (typeof friendRequestStates)[number];
export type ReportReason = "spam" | "harassment" | "unsafe_content" | "other";

export type MessageInput = {
  clientMessageId: string;
  body: string;
  replyToMessageId: string | null;
};

export type MessageReplyPreview = {
  messageId: string;
  sequence: number;
  senderDisplayName: string | null;
  kind: MessageKind;
  excerpt: string;
  available: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProfileValidationResult =
  | { success: true; value: ProfileInput }
  | { success: false; errors: Partial<Record<ProfileField, string>> };

export function normalizeProfileHandle(value: string): string {
  return value.trim().toLowerCase();
}

export function validateMessageInput(input: Record<string, unknown>):
  | { success: true; value: MessageInput }
  | { success: false; errors: string[] } {
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const clientMessageId =
    typeof input.clientMessageId === "string" ? input.clientMessageId : "";
  const replyToMessageId =
    input.replyToMessageId === null || input.replyToMessageId === undefined
      ? null
      : typeof input.replyToMessageId === "string"
        ? input.replyToMessageId
        : "";
  const errors: string[] = [];
  if (body.length < 1 || body.length > 2000) {
    errors.push("Message must contain 1 to 2000 characters");
  }
  if (!uuidPattern.test(clientMessageId)) {
    errors.push("Message retry identity is invalid");
  }
  if (replyToMessageId !== null && !uuidPattern.test(replyToMessageId)) {
    errors.push("Reply target is invalid");
  }
  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: { clientMessageId, body, replyToMessageId } };
}

export function validateDirectIntroduction(value: unknown):
  | { success: true; value: string }
  | { success: false; errors: string[] } {
  const introduction = typeof value === "string" ? value.trim() : "";
  const errors: string[] = [];
  if (introduction.length < 1 || introduction.length > 500) {
    errors.push("Introduction must contain 1 to 500 characters");
  }
  if (/https?:\/\/|www\./i.test(introduction)) {
    errors.push("Links are not available before a message request is accepted");
  }
  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: introduction };
}

export function parseReactionCode(value: unknown): ReactionCode | null {
  return reactionCodes.includes(value as ReactionCode) ? (value as ReactionCode) : null;
}

export function canonicalUserPair(first: string, second: string) {
  if (first === second) throw new Error("A direct conversation requires two different users");
  const [firstUserId, secondUserId] = [first, second].sort();
  return {
    firstUserId: firstUserId!,
    secondUserId: secondUserId!,
    key: `${firstUserId}:${secondUserId}`
  };
}

export function nextDirectConversationState(
  state: DirectConversationState,
  event: "accept" | "discard" | "block",
  actor: "sender" | "recipient"
): DirectConversationState | null {
  if (event === "block") return "blocked";
  if (state === "pending" && actor === "recipient" && event === "accept") return "active";
  if (state === "pending" && actor === "recipient" && event === "discard") return "discarded";
  return null;
}

export function nextFriendRequestState(
  state: FriendRequestState,
  event: "accept" | "decline" | "cancel",
  actor: "sender" | "recipient"
): FriendRequestState | null {
  if (state !== "pending") return null;
  if (actor === "recipient" && event === "accept") return "accepted";
  if (actor === "recipient" && event === "decline") return "declined";
  if (actor === "sender" && event === "cancel") return "cancelled";
  return null;
}

export function validateReportInput(input: Record<string, unknown>):
  | { success: true; value: { reason: ReportReason; details: string } }
  | { success: false; errors: string[] } {
  const reasons: ReportReason[] = ["spam", "harassment", "unsafe_content", "other"];
  const reason = typeof input.reason === "string" ? input.reason : "";
  const details = typeof input.details === "string" ? input.details.trim() : "";
  const errors: string[] = [];
  if (!reasons.includes(reason as ReportReason)) errors.push("Choose a report reason");
  if (details.length < 5 || details.length > 1000) {
    errors.push("Report details must contain 5 to 1000 characters");
  }
  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: { reason: reason as ReportReason, details } };
}

function validAvatar(value: unknown): value is ProfileAvatar {
  if (!value || typeof value !== "object") return false;
  const avatar = value as Record<string, unknown>;
  if (avatar.kind === "preset") {
    return profileAvatarPresets.includes(avatar.preset as ProfileAvatarPreset);
  }
  return (
    avatar.kind === "upload" &&
    typeof avatar.mediaId === "string" &&
    /^[0-9a-f-]{36}$/i.test(avatar.mediaId)
  );
}

export function validateProfileInput(input: Record<string, unknown>): ProfileValidationResult {
  const handle = normalizeProfileHandle(typeof input.handle === "string" ? input.handle : "");
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  const errors: Partial<Record<ProfileField, string>> = {};

  if (!profileHandlePattern.test(handle)) {
    errors.handle = "Use 3 to 20 lowercase letters, numbers, or underscores";
  }
  if (displayName.length < 2 || displayName.length > 40) {
    errors.displayName = "Add a display name in 2 to 40 characters";
  }
  if (bio.length > 160) {
    errors.bio = "Keep your bio within 160 characters";
  }
  if (!validAvatar(input.avatar)) {
    errors.avatar = "Choose a Pods avatar or upload a supported image";
  }
  if (input.visibility !== "public" && input.visibility !== "private") {
    errors.visibility = "Choose whether your profile is public or private";
  }
  if (!(["friends", "requests", "none"] as const).includes(input.dmPolicy as DmPolicy)) {
    errors.dmPolicy = "Choose who can send you a message request";
  }
  if (typeof input.activityStatusVisible !== "boolean") {
    errors.activityStatusVisible = "Choose whether your activity status is visible";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    value: {
      handle,
      displayName,
      bio,
      avatar: input.avatar as ProfileAvatar,
      visibility: input.visibility as ProfileVisibility,
      dmPolicy: input.dmPolicy as DmPolicy,
      activityStatusVisible: input.activityStatusVisible as boolean
    }
  };
}

export function publicProfileProjection(profile: {
  userId: string;
  walletAddress?: string;
  handle: string;
  displayName: string;
  bio: string;
  avatar: ProfileAvatar;
  visibility: ProfileVisibility;
  dmPolicy: DmPolicy;
  activityStatusVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    activityStatusVisible: profile.activityStatusVisible
  };
}
