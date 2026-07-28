import type { PodsRepository } from "@pods/db";
import type { PodState } from "@pods/domain";

import { presentPodRelationship } from "./participant-pod-state";

type TimelineRow = Awaited<
  ReturnType<PodsRepository["listInboxTimelineForUser"]>
>[number];

type ProofReviewNotification = Awaited<
  ReturnType<PodsRepository["listProofReviewNotificationsForUser"]>
>[number];

export type InboxEvent = {
  id: string;
  podId: string;
  podName: string;
  title: string;
  detail: string;
  href: string;
  occurredAt: Date;
  tone: "neutral" | "positive" | "attention";
};

function addEvent(
  events: InboxEvent[],
  event: Omit<InboxEvent, "podId" | "podName">,
  row: TimelineRow
) {
  events.push({
    ...event,
    podId: row.pod.id,
    podName: row.pod.contractData?.activity.name ?? "Pod"
  });
}

export function buildInboxEvents(rows: TimelineRow[]): InboxEvent[] {
  const events: InboxEvent[] = [];

  for (const row of rows) {
    const usesProofReconciliation =
      row.pod.contractData?.version === 3 &&
      row.pod.contractData.verification.protocol === "proof_reconciliation_v1";
    const current = presentPodRelationship({
      podId: row.pod.id,
      podState: row.pod.state as Exclude<PodState, "draft">,
      ...(row.pod.contractData?.settlementMode
        ? { settlementMode: row.pod.contractData.settlementMode }
        : {}),
      financial: {
        settlementState: null,
        entitlementState: null,
        transferState:
          row.transfer?.type === "payout"
            ? row.transfer.state
            : null
      },
      relationship: {
        kind: "member",
        state: row.membership.state,
        depositIntentId: row.membership.depositIntentId
      }
    });
    const applicationHref = `/applications?pod=${row.pod.id}`;

    if (row.application) {
      addEvent(events, {
        id: `application-submitted-${row.application.id}`,
        title: "Application sent",
        detail: "The creator received your application.",
        href: applicationHref,
        occurredAt: row.application.createdAt,
        tone: "neutral"
      }, row);

      if (row.membership.acceptedAt) {
        addEvent(events, {
          id: `application-accepted-${row.application.id}`,
          title: "Application accepted",
          detail: "Your next step follows the current Pod status.",
          href: current.href,
          occurredAt: row.membership.acceptedAt,
          tone: "positive"
        }, row);
      } else if (row.application.state === "application_rejected" && row.application.decidedAt) {
        addEvent(events, {
          id: `application-rejected-${row.application.id}`,
          title: "Application not accepted",
          detail: "The enrollment decision is final for this cycle.",
          href: applicationHref,
          occurredAt: row.application.decidedAt,
          tone: "attention"
        }, row);
      } else if (row.application.state === "application_expired") {
        addEvent(events, {
          id: `application-expired-${row.application.id}`,
          title: "Application closed",
          detail: "The enrollment cutoff passed before a place was secured.",
          href: applicationHref,
          occurredAt: row.application.updatedAt,
          tone: "attention"
        }, row);
      }
    } else if (
      row.membership.acceptedAt &&
      row.membership.admissionSource === "private_invitation"
    ) {
      addEvent(events, {
        id: `invitation-accepted-${row.membership.id}`,
        title: "Private invitation accepted",
        detail: "The private Pod is now available in My Pods.",
        href: current.href,
        occurredAt: row.membership.acceptedAt,
        tone: "positive"
      }, row);
    }

    if (row.deposit?.creditedAt) {
      addEvent(events, {
        id: `funding-credited-${row.deposit.id}`,
        title: "Commitment credited",
        detail: "Your full commitment is recorded in the participant ledger.",
        href: current.href,
        occurredAt: row.deposit.creditedAt,
        tone: "positive"
      }, row);
    }

    if (row.membership.state === "roster_locked") {
      addEvent(events, {
        id: `place-secured-${row.membership.id}`,
        title: "Place secured",
        detail: "Funding and roster lock are complete.",
        href: `/pods/${row.pod.id}/today`,
        occurredAt: row.membership.updatedAt,
        tone: "positive"
      }, row);
    }

    if (row.membership.state === "active") {
      addEvent(events, {
        id: `activity-started-${row.membership.id}`,
        title: "Activity started",
        detail: "The roster is locked and occurrence commitments are active.",
        href: `/pods/${row.pod.id}/today`,
        occurredAt: row.membership.updatedAt,
        tone: "positive"
      }, row);
    }

    if (row.submission?.submittedAt) {
      addEvent(events, {
        id: `evidence-submitted-${row.submission.id}`,
        title: "Proof submitted",
        detail: "Your proof is with the Pod creator.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.submittedAt,
        tone: "neutral"
      }, row);
    }
    if (!usesProofReconciliation && row.submission?.approvedAt) {
      addEvent(events, {
        id: `evidence-approved-${row.submission.id}`,
        title: "Work approved",
        detail: "This occurrence counts toward your progress and streak.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.approvedAt,
        tone: "positive"
      }, row);
    }
    if (
      !usesProofReconciliation &&
      row.submission?.state === "rejected" &&
      row.submission.reviewedAt
    ) {
      addEvent(events, {
        id: `evidence-rejected-${row.submission.id}`,
        title: "Not verified",
        detail: "The Pod creator did not verify this proof. Open the private result for the decision note.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.reviewedAt,
        tone: "attention"
      }, row);
    }
    if (
      !usesProofReconciliation &&
      row.submission?.state === "timeout_protected" &&
      row.submission.reviewedAt
    ) {
      addEvent(events, {
        id: `evidence-timeout-protected-${row.submission.id}`,
        title: "Protected after review timeout",
        detail: "The creator did not decide within 24 hours. This occurrence counts toward your progress and streak.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.reviewedAt,
        tone: "positive"
      }, row);
    }
    if (
      !usesProofReconciliation &&
      row.submission?.state === "grace" &&
      row.submission.reviewedAt
    ) {
      addEvent(events, {
        id: `evidence-grace-${row.submission.id}`,
        title: "Principal returned with grace",
        detail: "The review closed without a reliable binary decision. This occurrence has no bonus or streak effect.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.reviewedAt,
        tone: "neutral"
      }, row);
    }

    if (row.transfer?.type === "payout") {
      const settlementHref = `/pods/${row.pod.id}/settlement`;
      addEvent(events, {
        id: `payout-queued-${row.transfer.id}`,
        title: "Payout queued",
        detail: "Your final Testnet entitlement is ready for transfer.",
        href: settlementHref,
        occurredAt: row.transfer.createdAt,
        tone: "neutral"
      }, row);
      if (row.transfer.state === "prepared") {
        addEvent(events, {
          id: `payout-prepared-${row.transfer.id}`,
          title: "Payout prepared",
          detail: "The signed transfer is stored and waiting for safe submission.",
          href: settlementHref,
          occurredAt: row.transfer.updatedAt,
          tone: "neutral"
        }, row);
      }
      if (row.transfer.state === "unknown") {
        addEvent(events, {
          id: `payout-unknown-${row.transfer.id}`,
          title: "Payout confirmation delayed",
          detail: "Pods is checking the persisted transaction hash before any retry.",
          href: settlementHref,
          occurredAt: row.transfer.updatedAt,
          tone: "neutral"
        }, row);
      }
      if (row.transfer.broadcastAt) {
        addEvent(events, {
          id: `payout-broadcast-${row.transfer.id}`,
          title: "Payout submitted",
          detail: "Your Testnet transfer is awaiting Nimiq finality.",
          href: settlementHref,
          occurredAt: row.transfer.broadcastAt,
          tone: "neutral"
        }, row);
      }
      if (row.transfer.confirmedAt) {
        addEvent(events, {
          id: `payout-confirmed-${row.transfer.id}`,
          title: "Payout confirmed",
          detail: "Your final Testnet transfer reached Nimiq finality.",
          href: settlementHref,
          occurredAt: row.transfer.confirmedAt,
          tone: "positive"
        }, row);
      }
      if (
        ["retryable_failed", "mismatched", "late", "manual_review"].includes(
          row.transfer.state
        )
      ) {
        addEvent(events, {
          id: `payout-review-${row.transfer.id}`,
          title: "Payout needs review",
          detail: "The settlement is preserved while operations review the transfer.",
          href: settlementHref,
          occurredAt: row.transfer.updatedAt,
          tone: "attention"
        }, row);
      }
    } else if (row.transfer) {
      addEvent(events, {
        id: `refund-queued-${row.transfer.id}`,
        title: "Refund queued",
        detail: "Your full commitment is reserved for return.",
        href: `/pods/${row.pod.id}/today`,
        occurredAt: row.transfer.createdAt,
        tone: "neutral"
      }, row);
      if (row.transfer.broadcastAt) {
        addEvent(events, {
          id: `refund-broadcast-${row.transfer.id}`,
          title: "Refund submitted",
          detail: "The return transfer is awaiting Nimiq finality.",
          href: `/pods/${row.pod.id}/today`,
          occurredAt: row.transfer.broadcastAt,
          tone: "neutral"
        }, row);
      }
      if (row.transfer.confirmedAt) {
        addEvent(events, {
          id: `refund-confirmed-${row.transfer.id}`,
          title: "Refund confirmed",
          detail: "Your full commitment has been returned.",
          href: `/pods/${row.pod.id}/today`,
          occurredAt: row.transfer.confirmedAt,
          tone: "positive"
        }, row);
      }
    }
  }

  return [...new Map(events.map((event) => [event.id, event])).values()]
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

const proofEventCopy: Record<string, { title: string; detail: string; tone: InboxEvent["tone"] }> = {
  request_clarification: { title: "Clarification requested", detail: "The Pod creator needs one specific proof update.", tone: "attention" },
  respond_clarification: { title: "Clarification received", detail: "The participant responded to your review request.", tone: "neutral" },
  provisionally_reject: { title: "Decision needs your response", detail: "Review the detailed reason, then accept it or use your one appeal.", tone: "attention" },
  open_appeal: { title: "Appeal received", detail: "Reconsider the proof with the participant's frozen appeal context.", tone: "attention" },
  accept_rejection: { title: "Rejection accepted", detail: "The participant accepted the proposed proof outcome.", tone: "neutral" },
  approve: { title: "Proof approved", detail: "The occurrence is now counted.", tone: "positive" },
  appeal_approve: { title: "Appeal approved", detail: "The occurrence is now counted after reconsideration.", tone: "positive" },
  appeal_reject: { title: "Appeal resolved", detail: "The rejection is final for this occurrence.", tone: "attention" },
  appeal_grace: { title: "Appeal resolved with grace", detail: "Principal returns without a bonus or streak effect.", tone: "neutral" },
  review_timeout: { title: "Review timeout protection", detail: "The occurrence was protected after reviewer inactivity.", tone: "positive" },
  clarification_timeout: { title: "Clarification window closed", detail: "The participant can now appeal or accept the rejection.", tone: "attention" },
  appeal_window_timeout: { title: "Appeal window closed", detail: "The rejection is now final.", tone: "attention" },
  appeal_review_timeout: { title: "Appeal protected with grace", detail: "Principal returns because the appeal was not resolved in time.", tone: "neutral" },
  absolute_timeout: { title: "Proof review cap reached", detail: "The frozen review fallback has been applied.", tone: "neutral" }
};

export function buildProofReviewInboxEvents(rows: ProofReviewNotification[]): InboxEvent[] {
  return rows.flatMap(({ notification, pod, submissionId, type, recipientRole }) => {
    const copy = proofEventCopy[type];
    if (!copy) return [];
    return [{
      id: `proof-review-${notification.id}`,
      podId: pod.id,
      podName: pod.contractData?.activity.name ?? "Pod",
      title: copy.title,
      detail: copy.detail,
      href: recipientRole === "creator"
        ? `/pods/${pod.id}/admin/reviews/${submissionId}`
        : `/pods/${pod.id}/submissions/${submissionId}`,
      occurredAt: notification.createdAt,
      tone: copy.tone
    }];
  });
}
