import type { MembershipState } from "@pods/domain";

export type PodRelationship =
  | { kind: "visitor" }
  | { kind: "creator" }
  | {
      kind: "member";
      state: MembershipState;
      depositIntentId: string | null;
    };

export type PodRelationshipTone = "open" | "pending" | "attention" | "secured" | "closed";

export type PodRelationshipPresentation = {
  statusLabel: string;
  statusDetail: string;
  actionLabel: string;
  href: string;
  tone: PodRelationshipTone;
  todayPriority: number | null;
  todayEyebrow: string;
  todayTitle: string;
  todayDetail: string;
};

export function relationshipForViewer(input: {
  creatorUserId: string;
  viewerUserId: string | null;
  membership: { state: MembershipState; depositIntentId: string | null } | null;
}): PodRelationship {
  if (input.viewerUserId === input.creatorUserId) return { kind: "creator" };
  if (input.membership) {
    return {
      kind: "member",
      state: input.membership.state,
      depositIntentId: input.membership.depositIntentId
    };
  }
  return { kind: "visitor" };
}

type MemberPresentation = Omit<PodRelationshipPresentation, "href"> & {
  destination: "applications" | "fund" | "funding_status" | "waiting_room" | "my_pods";
};

const memberPresentations = {
  applied: {
    statusLabel: "Application pending",
    statusDetail: "Waiting for the creator decision",
    actionLabel: "View application",
    destination: "applications",
    tone: "pending",
    todayPriority: 40,
    todayEyebrow: "Application pending",
    todayTitle: "Your application is with the creator.",
    todayDetail: "No place is reserved until acceptance, funding finality, and roster lock."
  },
  accepted_unfunded: {
    statusLabel: "Accepted, funding required",
    statusDetail: "Fund before the enrollment cutoff",
    actionLabel: "Continue to funding",
    destination: "fund",
    tone: "attention",
    todayPriority: 10,
    todayEyebrow: "Funding required",
    todayTitle: "Your accepted place is waiting for funding.",
    todayDetail: "Review the frozen commitment and complete the NIM handoff."
  },
  application_rejected: {
    statusLabel: "Application not accepted",
    statusDetail: "Final for this enrollment cycle",
    actionLabel: "View outcome",
    destination: "applications",
    tone: "closed",
    todayPriority: null,
    todayEyebrow: "Application outcome",
    todayTitle: "This application did not move forward.",
    todayDetail: "The creator decision is final for the current enrollment cycle."
  },
  application_expired: {
    statusLabel: "Application expired",
    statusDetail: "The enrollment cutoff passed",
    actionLabel: "View outcome",
    destination: "applications",
    tone: "closed",
    todayPriority: null,
    todayEyebrow: "Application expired",
    todayTitle: "The enrollment window has closed.",
    todayDetail: "This application cannot continue in the current enrollment cycle."
  },
  invite_expired: {
    statusLabel: "Invitation expired",
    statusDetail: "This invitation can no longer be used",
    actionLabel: "View My Pods",
    destination: "my_pods",
    tone: "closed",
    todayPriority: null,
    todayEyebrow: "Invitation expired",
    todayTitle: "This private invitation has closed.",
    todayDetail: "Ask the Pod creator for a new invitation if enrollment is still open."
  },
  deposit_pending: {
    statusLabel: "Funding in progress",
    statusDetail: "Transaction awaiting final credit",
    actionLabel: "Track funding",
    destination: "funding_status",
    tone: "pending",
    todayPriority: 5,
    todayEyebrow: "Funding in progress",
    todayTitle: "Your commitment is moving through confirmation.",
    todayDetail: "Keep the transaction tracker available until the commitment is credited."
  },
  funding_failed: {
    statusLabel: "Funding needs attention",
    statusDetail: "No commitment was credited",
    actionLabel: "Retry funding",
    destination: "fund",
    tone: "attention",
    todayPriority: 1,
    todayEyebrow: "Funding needs attention",
    todayTitle: "Your funding attempt did not complete.",
    todayDetail: "No NIM was credited. Review the commitment and try the wallet handoff again."
  },
  funded_provisional: {
    statusLabel: "Commitment credited",
    statusDetail: "Waiting for roster lock",
    actionLabel: "Track commitment",
    destination: "waiting_room",
    tone: "secured",
    todayPriority: 20,
    todayEyebrow: "Commitment credited",
    todayTitle: "Your commitment is safely recorded.",
    todayDetail: "Funding is complete. The Pod is waiting for the enrollment cutoff and roster lock."
  },
  roster_locked: {
    statusLabel: "Joined",
    statusDetail: "Your place is secured",
    actionLabel: "Open Pod",
    destination: "waiting_room",
    tone: "secured",
    todayPriority: 30,
    todayEyebrow: "Place secured",
    todayTitle: "You are part of this Pod.",
    todayDetail: "Open the frozen Pod contract and prepare for the next scheduled occurrence."
  },
  excluded_at_cutoff: {
    statusLabel: "Not included at cutoff",
    statusDetail: "Your commitment will be returned",
    actionLabel: "View refund status",
    destination: "waiting_room",
    tone: "attention",
    todayPriority: 8,
    todayEyebrow: "Refund required",
    todayTitle: "You were not included at roster lock.",
    todayDetail: "Your commitment remains protected and will be returned through the refund tracker."
  },
  refund_pending: {
    statusLabel: "Refund in progress",
    statusDetail: "Your refund transfer is queued",
    actionLabel: "Track refund",
    destination: "waiting_room",
    tone: "pending",
    todayPriority: 7,
    todayEyebrow: "Refund in progress",
    todayTitle: "Your commitment is being returned.",
    todayDetail: "Track the transfer until the refund is confirmed on Nimiq Testnet."
  },
  refunded: {
    statusLabel: "Refund completed",
    statusDetail: "Your commitment was returned",
    actionLabel: "View receipt",
    destination: "waiting_room",
    tone: "closed",
    todayPriority: null,
    todayEyebrow: "Refund completed",
    todayTitle: "Your commitment has been returned.",
    todayDetail: "The refund receipt remains available in your Pod history."
  }
} satisfies Record<MembershipState, MemberPresentation>;

function memberHref(input: {
  podId: string;
  destination: MemberPresentation["destination"];
  depositIntentId: string | null;
}) {
  if (input.destination === "applications") return "/applications";
  if (input.destination === "fund") return `/pods/${input.podId}/fund`;
  if (input.destination === "waiting_room") return `/pods/${input.podId}/today`;
  if (input.destination === "my_pods") return "/my-pods";
  return input.depositIntentId
    ? `/pods/${input.podId}/fund/status?intent=${input.depositIntentId}`
    : `/pods/${input.podId}/fund`;
}

export function presentPodRelationship(input: {
  podId: string;
  relationship: PodRelationship;
}): PodRelationshipPresentation {
  if (input.relationship.kind === "visitor") {
    return {
      statusLabel: "Open to apply",
      statusDetail: "Review the frozen rules",
      actionLabel: "View Pod",
      href: `/pods/${input.podId}`,
      tone: "open",
      todayPriority: null,
      todayEyebrow: "Open to apply",
      todayTitle: "Find your next commitment.",
      todayDetail: "Review the frozen Pod rules before applying."
    };
  }

  if (input.relationship.kind === "creator") {
    return {
      statusLabel: "Creator",
      statusDetail: "Enrollment open",
      actionLabel: "Manage enrollment",
      href: `/pods/${input.podId}/admin`,
      tone: "secured",
      todayPriority: null,
      todayEyebrow: "Creator controls",
      todayTitle: "Your public Pod is ready to grow.",
      todayDetail: "Review applications and share the frozen public contract."
    };
  }

  const presentation = memberPresentations[input.relationship.state];
  return {
    ...presentation,
    href: memberHref({
      podId: input.podId,
      destination: presentation.destination,
      depositIntentId: input.relationship.depositIntentId
    })
  };
}
