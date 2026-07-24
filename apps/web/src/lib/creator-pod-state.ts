import type { PodState, SettlementMode } from "@pods/domain";

export type CreatorPodAdminAction = {
  kind: "review" | "room" | "activity" | "funding" | "rules" | "draft";
  label: string;
  href: string;
  emphasis: "primary" | "secondary";
};

export type CreatorPodPresentation = {
  statusLabel: string;
  statusDetail: string;
  actionLabel: string;
  href: string;
  todayEyebrow: string;
  todayTitle: string;
  todayDetail: string;
  admin: {
    eyebrow: string;
    detail: string;
    actions: CreatorPodAdminAction[];
  };
};

type CreatorVerifier = "creator" | "pods_team";

function reviewLabel(count?: number) {
  if (count === undefined) return "Review proofs";
  return `Review ${count} proof${count === 1 ? "" : "s"}`;
}

function commandActions(input: {
  podId: string;
  verifier: CreatorVerifier;
  pendingReviewCount?: number;
}): CreatorPodAdminAction[] {
  const shared: CreatorPodAdminAction[] = [
    {
      kind: "room",
      label: "Open Pod room",
      href: `/pods/${input.podId}/room`,
      emphasis: "secondary"
    },
    {
      kind: "activity",
      label: "View activity",
      href: `/pods/${input.podId}/activity`,
      emphasis: "secondary"
    },
    {
      kind: "funding",
      label: "View participant funding stages",
      href: `/pods/${input.podId}/admin/funding`,
      emphasis: "secondary"
    },
    {
      kind: "rules",
      label: "Review frozen rules",
      href: `/pods/${input.podId}/rules`,
      emphasis: "secondary"
    }
  ];
  if (
    input.verifier === "pods_team" ||
    (input.pendingReviewCount ?? 0) === 0
  ) {
    return shared;
  }
  return [
    {
      kind: "review",
      label: reviewLabel(input.pendingReviewCount),
      href: `/pods/${input.podId}/admin/reviews`,
      emphasis: "primary"
    },
    ...shared
  ];
}

function lifecycleActions(
  podId: string,
  primary: Omit<CreatorPodAdminAction, "emphasis">,
  options: { includeActivity?: boolean } = {}
): CreatorPodAdminAction[] {
  return [
    { ...primary, emphasis: "primary" },
    ...(options.includeActivity
      ? [{
          kind: "activity" as const,
          label: "View activity",
          href: `/pods/${podId}/activity`,
          emphasis: "secondary" as const
        }]
      : []),
    {
      kind: "rules",
      label: "Review frozen rules",
      href: `/pods/${podId}/rules`,
      emphasis: "secondary"
    }
  ];
}

export function presentCreatorPodState(input: {
  podId: string;
  state: PodState;
  settlementMode?: SettlementMode;
  verifier?: CreatorVerifier;
  pendingReviewCount?: number;
}): CreatorPodPresentation {
  const verifier = input.verifier ?? "creator";
  const pendingReviewCount = input.pendingReviewCount === undefined
    ? undefined
    : Math.max(0, Math.floor(input.pendingReviewCount));

  switch (input.state) {
    case "draft":
      return {
        statusLabel: "Draft",
        statusDetail: "No financial exposure",
        actionLabel: "Continue Pod setup",
        href: "/my-pods",
        todayEyebrow: "Pod draft",
        todayTitle: "Finish the frozen Pod contract.",
        todayDetail: "Continue setup before enrollment can open.",
        admin: {
          eyebrow: "Pod draft",
          detail: "This Pod is not published. Continue setup before enrollment can open.",
          actions: [{
            kind: "draft",
            label: "Continue Pod setup",
            href: "/my-pods",
            emphasis: "primary"
          }]
        }
      };
    case "enrollment_open":
      return {
        statusLabel: "Enrollment open",
        statusDetail: "Applications and invitations are active",
        actionLabel: "Manage enrollment",
        href: `/pods/${input.podId}/admin`,
        todayEyebrow: "Enrollment open",
        todayTitle: "Your public Pod is ready to grow.",
        todayDetail: "Review applications or share the frozen public contract.",
        admin: {
          eyebrow: "Enrollment command center",
          detail: "Manage who enters. Frozen rules, evidence decisions, and future financial outcomes remain outside creator control.",
          actions: []
        }
      };
    case "cutoff_evaluating":
      return {
        statusLabel: "Cutoff evaluating",
        statusDetail: "Roster snapshot in progress",
        actionLabel: "Open funding overview",
        href: `/pods/${input.podId}/admin/funding`,
        todayEyebrow: "Roster evaluating",
        todayTitle: "The enrollment cutoff is resolving.",
        todayDetail: "Review the participant-safe funding stages while the roster snapshot completes.",
        admin: {
          eyebrow: "Roster evaluating",
          detail: "Enrollment is closed while the audited cutoff resolves funded places and returns.",
          actions: lifecycleActions(input.podId, {
            kind: "funding",
            label: "Open funding overview",
            href: `/pods/${input.podId}/admin/funding`
          })
        }
      };
    case "locked_scheduled":
      return {
        statusLabel: "Roster locked",
        statusDetail: "Activity scheduled",
        actionLabel: "Open Pod room",
        href: `/pods/${input.podId}/room`,
        todayEyebrow: "Roster locked",
        todayTitle: "Your Pod is ready for the activity.",
        todayDetail: "Enrollment is complete. Open the Pod room for the frozen schedule.",
        admin: {
          eyebrow: "Roster locked",
          detail: "Enrollment is complete. The Pod room is now the source of truth for the activity schedule.",
          actions: lifecycleActions(input.podId, {
            kind: "room",
            label: "Open Pod room",
            href: `/pods/${input.podId}/room`
          })
        }
      };
    case "active": {
      const creatorReviews = verifier === "creator";
      const hasPendingReviews = creatorReviews && (pendingReviewCount ?? 0) > 0;
      return {
        statusLabel: "Activity live",
        statusDetail: creatorReviews
          ? pendingReviewCount === undefined
            ? "Creator review is active"
            : `${pendingReviewCount} proof${pendingReviewCount === 1 ? "" : "s"} waiting for creator review`
          : "Legacy Pods Team review remains authoritative",
        actionLabel: hasPendingReviews ? reviewLabel(pendingReviewCount) : "Open Pod room",
        href: hasPendingReviews
          ? `/pods/${input.podId}/admin/reviews`
          : `/pods/${input.podId}/room`,
        todayEyebrow: creatorReviews ? "Creator review active" : "Legacy Pods Team review",
        todayTitle: "Your Pod is building now.",
        todayDetail: creatorReviews
          ? "Review member proofs against the frozen activity contract."
          : "This legacy Pod continues under its frozen Pods Team review contract.",
        admin: {
          eyebrow: creatorReviews ? "Creator review active" : "Legacy Pods Team review",
          detail: creatorReviews
            ? pendingReviewCount === undefined
              ? "Review member submissions against the frozen Pod contract."
              : `${pendingReviewCount} proof${pendingReviewCount === 1 ? "" : "s"} waiting. Review each submission against the frozen Pod contract.`
            : "This legacy Pod uses Pods Team review. Creator review actions are unavailable.",
          actions: commandActions({
            podId: input.podId,
            verifier,
            ...(pendingReviewCount === undefined
              ? {}
              : { pendingReviewCount })
          })
        }
      };
    }
    case "final_review": {
      const proportional = input.settlementMode === "proportional";
      const creatorReviews = verifier === "creator";
      const hasPendingReviews = creatorReviews && (pendingReviewCount ?? 0) > 0;
      return {
        statusLabel: "Final review",
        statusDetail: proportional
          ? "Frozen outcomes are ready for settlement"
          : creatorReviews
            ? pendingReviewCount === undefined
              ? "Creator review is closing the activity record"
              : `${pendingReviewCount} proof${pendingReviewCount === 1 ? "" : "s"} waiting before the activity record closes`
            : "Legacy Pods Team review remains authoritative",
        actionLabel: hasPendingReviews
          ? reviewLabel(pendingReviewCount)
          : proportional
            ? "View settlement"
            : "Open archived room",
        href: hasPendingReviews
          ? `/pods/${input.podId}/admin/reviews`
          : proportional
            ? `/pods/${input.podId}/settlement`
            : `/pods/${input.podId}/room`,
        todayEyebrow: creatorReviews ? "Final review" : "Legacy Pods Team review",
        todayTitle: "The activity record is in final review.",
        todayDetail: creatorReviews
          ? "Resolve the remaining proofs against the frozen contract."
          : "This legacy Pod continues under its frozen Pods Team review contract.",
        admin: {
          eyebrow: creatorReviews ? "Final review" : "Legacy Pods Team review",
          detail: creatorReviews
            ? pendingReviewCount === undefined
              ? "Resolve the remaining proofs before the final activity record closes."
              : `${pendingReviewCount} proof${pendingReviewCount === 1 ? "" : "s"} waiting before the final activity record closes.`
            : "This legacy Pod uses Pods Team review. Creator review actions are unavailable.",
          actions: commandActions({
            podId: input.podId,
            verifier,
            ...(pendingReviewCount === undefined
              ? {}
              : { pendingReviewCount })
          })
        }
      };
    }
    case "completed": {
      const proportional = input.settlementMode === "proportional";
      return {
        statusLabel: "Completed",
        statusDetail: proportional
          ? "Settlement and Testnet transfers are complete"
          : "The public activity record is archived",
        actionLabel: proportional ? "View settlement" : "View Pod archive",
        href: proportional
          ? `/pods/${input.podId}/settlement`
          : `/pods/${input.podId}/room`,
        todayEyebrow: "Pod completed",
        todayTitle: "This activity is complete.",
        todayDetail: "The room, public proof record, and frozen contract remain available.",
        admin: {
          eyebrow: "Pod completed",
          detail: "The activity record is complete. Its room, proofs, funding history, and frozen rules remain available.",
          actions: [
            ...(proportional
              ? [
                  {
                    kind: "funding" as const,
                    label: "View settlement",
                    href: `/pods/${input.podId}/settlement`,
                    emphasis: "primary" as const
                  },
                  {
                    kind: "room" as const,
                    label: "View Pod archive",
                    href: `/pods/${input.podId}/room`,
                    emphasis: "secondary" as const
                  }
                ]
              : [
                  {
                    kind: "room" as const,
                    label: "View Pod archive",
                    href: `/pods/${input.podId}/room`,
                    emphasis: "primary" as const
                  }
                ]),
            {
              kind: "activity",
              label: "View activity",
              href: `/pods/${input.podId}/activity`,
              emphasis: "secondary"
            },
            {
              kind: "funding",
              label: "View financial history",
              href: `/pods/${input.podId}/admin/funding`,
              emphasis: "secondary"
            },
            {
              kind: "rules",
              label: "Review frozen rules",
              href: `/pods/${input.podId}/rules`,
              emphasis: "secondary"
            }
          ]
        }
      };
    }
    case "cancelled_refunding":
      return {
        statusLabel: "Returns in progress",
        statusDetail: "Participant commitments are being returned",
        actionLabel: "Track participant returns",
        href: `/pods/${input.podId}/admin/funding`,
        todayEyebrow: "Returns in progress",
        todayTitle: "This Pod is returning commitments.",
        todayDetail: "Track every participant-safe return until the financial state is final.",
        admin: {
          eyebrow: "Returns in progress",
          detail: "The Pod did not lock. Participant commitments are being returned through the transfer engine.",
          actions: lifecycleActions(input.podId, {
            kind: "funding",
            label: "Track participant returns",
            href: `/pods/${input.podId}/admin/funding`
          })
        }
      };
    case "cancelled":
      return {
        statusLabel: "Cancelled",
        statusDetail: "Financial obligations resolved",
        actionLabel: "View financial history",
        href: `/pods/${input.podId}/admin/funding`,
        todayEyebrow: "Pod cancelled",
        todayTitle: "This Pod is closed.",
        todayDetail: "The frozen contract and resolved financial history remain available.",
        admin: {
          eyebrow: "Pod cancelled",
          detail: "Enrollment is closed and all recorded return obligations are resolved.",
          actions: lifecycleActions(input.podId, {
            kind: "funding",
            label: "View financial history",
            href: `/pods/${input.podId}/admin/funding`
          })
        }
      };
  }
}
