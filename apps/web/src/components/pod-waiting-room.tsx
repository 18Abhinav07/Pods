import type { MembershipState } from "@pods/domain";
import Link from "next/link";

import type { ParticipantRefund } from "./refund-status-rail";
import { RefundStatusRail } from "./refund-status-rail";

export type PodWaitingRoomProps = {
  podId: string;
  name: string;
  purpose: string;
  viewerRole: "creator" | "participant";
  membershipState: MembershipState | null;
  fundingStatusHref: string | null;
  confirmedParticipants: number;
  minParticipants: number;
  maxParticipants: number;
  cutoffAt: string;
  firstOccurrenceAt: string;
  firstOccurrenceDate: string;
  occurrenceCount: number;
  weekdays: number[];
  timeZone: string;
  nimPerOccurrence: number;
  totalNim: number;
  refund: ParticipantRefund | null;
};

const participantStateCopy: Partial<Record<MembershipState, readonly [string, string]>> = {
  funded_provisional: [
    "Commitment credited",
    "Your NIM is recorded. Roster lock happens at the published cutoff."
  ],
  roster_locked: [
    "Place secured",
    "The minimum roster was met and your place is locked for the activity."
  ],
  excluded_at_cutoff: [
    "Refund required",
    "Capacity filled before your finalized chain position. Your full commitment is protected."
  ],
  refund_pending: [
    "Refund in progress",
    "The Pod did not include your place. Your full commitment is being returned."
  ],
  refunded: [
    "Refund completed",
    "Your full commitment has been returned and the receipt remains available here."
  ]
};

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMoment(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(new Date(value));
}

function nim(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(value);
}

export function PodWaitingRoom(props: PodWaitingRoomProps) {
  const remaining = Math.max(0, props.maxParticipants - props.confirmedParticipants);
  const stateCopy = props.viewerRole === "creator"
    ? ["Creator overview", "Track funded places without exposing participant payment data."] as const
    : participantStateCopy[props.membershipState ?? "applied"] ?? [
        "Waiting room",
        "Your Pod status is available here."
      ];

  return (
    <>
      <section className="waiting-hero entrance entrance-hero">
        <p className="eyebrow">{stateCopy[0]}</p>
        <h1>{props.name}</h1>
        <p>{props.purpose}</p>
        <div className="waiting-status"><i aria-hidden="true" /><span>{stateCopy[1]}</span></div>
      </section>

      <section className="waiting-metrics entrance entrance-status" aria-label="Pod capacity">
        <div><span>Roster</span><strong>{props.confirmedParticipants} confirmed</strong><small>{props.minParticipants} minimum</small></div>
        <div><span>Capacity</span><strong>{remaining} {remaining === 1 ? "place" : "places"} remaining</strong><small>{props.maxParticipants} maximum</small></div>
      </section>

      {props.refund ? <RefundStatusRail refund={props.refund} /> : null}

      <section className="waiting-contract entrance entrance-templates">
        <div className="section-title-row"><span>Frozen contract</span><h2>Your activity clock</h2></div>
        <dl>
          <div><dt>Enrollment cutoff</dt><dd>{formatMoment(props.cutoffAt, props.timeZone)}</dd></div>
          <div><dt>First occurrence</dt><dd>{formatMoment(props.firstOccurrenceAt, props.timeZone)}</dd></div>
          <div><dt>Cadence</dt><dd>{props.weekdays.map((day) => weekdayNames[day]).join(" · ")}</dd></div>
          <div><dt>Schedule</dt><dd>{props.occurrenceCount} frozen occurrences</dd></div>
          <div><dt>At risk each time</dt><dd>{nim(props.nimPerOccurrence)} NIM</dd></div>
          <div><dt>Total commitment</dt><dd>{nim(props.totalNim)} NIM</dd></div>
        </dl>
      </section>

      <aside className="waiting-verification">
        <span>Pods team verification</span>
        <strong>Evidence decisions stay independent of the pool.</strong>
        <p>Pods team reviews evidence against the frozen rules. Creators and participants cannot approve their own financial outcomes.</p>
      </aside>

      <aside className="waiting-announcement">
        <span>Creator announcements</span>
        <p>No announcements yet. The frozen rules and schedule remain the source of truth.</p>
      </aside>

      <div className="waiting-actions">
        {props.viewerRole === "creator" ? (
          <Link className="primary-action full-action" href={`/pods/${props.podId}/admin/funding`}>Open creator funding view</Link>
        ) : props.fundingStatusHref ? (
          <Link className="primary-action full-action" href={props.fundingStatusHref}>Open funding tracker</Link>
        ) : (
          <Link className="primary-action full-action" href={`/pods/${props.podId}/rules`}>Read frozen rules</Link>
        )}
        <Link className="secondary-action full-action" href={`/pods/${props.podId}/rules`}>Review complete Pod contract</Link>
      </div>
    </>
  );
}
