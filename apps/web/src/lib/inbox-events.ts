import type { PodsRepository } from "@pods/db";
import type { PodState } from "@pods/domain";

import { presentPodRelationship } from "./participant-pod-state";

type TimelineRow = Awaited<
  ReturnType<PodsRepository["listInboxTimelineForUser"]>
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
    const current = presentPodRelationship({
      podId: row.pod.id,
      podState: row.pod.state as Exclude<PodState, "draft">,
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
    if (row.submission?.approvedAt) {
      addEvent(events, {
        id: `evidence-approved-${row.submission.id}`,
        title: "Work approved",
        detail: "This occurrence counts toward your progress and streak.",
        href: `/pods/${row.pod.id}/submissions/${row.submission.id}`,
        occurredAt: row.submission.approvedAt,
        tone: "positive"
      }, row);
    }
    if (row.submission?.state === "rejected" && row.submission.reviewedAt) {
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

    if (row.transfer) {
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
